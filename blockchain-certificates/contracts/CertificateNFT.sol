// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract CertificateNFT is ERC721URIStorage, Ownable, AccessControl, Pausable {
    uint256 private _tokenIdCounter;
    
    // Role definitions
    bytes32 public constant SUPER_ADMIN_ROLE = keccak256("SUPER_ADMIN_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant REVOKER_ROLE = keccak256("REVOKER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    // Mapping to track revoked certificates
    mapping(uint256 => bool) private _revokedCertificates;
    
    // Mapping to store additional certificate metadata
    mapping(uint256 => CertificateMetadata) private _certificateMetadata;
    
    struct CertificateMetadata {
        address recipient;
        uint256 mintedAt;
        bool isRevoked;
        string certificateType;
    }
    
    // ============ MULTI-SIG PROPOSAL SYSTEM ============
    
    struct CertificateProposal {
        uint256 proposalId;
        address proposer;
        address recipient;
        string recipientName;
        string grade;
        string metadataURI;
        uint256 approvalCount;
        uint256 createdAt;
        bool executed;
        bool cancelled;
    }
    
    // Proposal ID counter
    uint256 private _proposalIdCounter;
    
    // Minimum approvals required (default: 3)
    uint256 public approvalThreshold;
    
    // Mapping from proposal ID to proposal
    mapping(uint256 => CertificateProposal) public proposals;
    
    // Mapping from proposal ID to approver address to approval status
    mapping(uint256 => mapping(address => bool)) public proposalApprovals;
    
    // Mapping from proposal ID to array of approvers
    mapping(uint256 => address[]) public proposalApprovers;
    
    // Array of all proposal IDs
    uint256[] private _allProposalIds;
    
    // Events
    event CertificateMinted(uint256 indexed tokenId, address indexed recipient, string tokenURI);
    event CertificateRevoked(uint256 indexed tokenId, address indexed revoker);
    event RoleRequested(address indexed requester, bytes32 indexed role, string justification);
    event EmergencyRoleRevoked(address indexed admin, address indexed user, bytes32 indexed role, string reason);
    
    // Multi-sig proposal events
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address indexed recipient, string metadataURI);
    event ProposalApproved(uint256 indexed proposalId, address indexed approver, uint256 approvalCount);
    event ApprovalRevoked(uint256 indexed proposalId, address indexed approver, uint256 approvalCount);
    event ProposalExecuted(uint256 indexed proposalId, uint256 indexed tokenId, address indexed recipient);
    event ProposalCancelled(uint256 indexed proposalId, address indexed canceller);
    event ThresholdChanged(uint256 oldThreshold, uint256 newThreshold, address changedBy);
    
    constructor(address initialOwner) 
        ERC721("CertificateNFT", "CERT") 
        Ownable(initialOwner) 
    {
        // Grant SUPER_ADMIN_ROLE to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(SUPER_ADMIN_ROLE, initialOwner);
        
        // Set role hierarchy
        // SUPER_ADMIN can manage ADMIN_ROLE
        _setRoleAdmin(SUPER_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(ADMIN_ROLE, SUPER_ADMIN_ROLE);
        
        // ADMIN can manage lower roles (ISSUER, REVOKER, VERIFIER)
        _setRoleAdmin(ISSUER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(REVOKER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(VERIFIER_ROLE, ADMIN_ROLE);
        
        // Initialize approval threshold (default: 3)
        approvalThreshold = 3;
    }
    
    /**
     * @dev Override grantRole to allow SUPER_ADMIN to grant any role
     * SUPER_ADMIN can grant: ADMIN, ISSUER, REVOKER, VERIFIER
     * ADMIN can grant: ISSUER, REVOKER, VERIFIER
     */
    function grantRole(bytes32 role, address account) 
        public 
        virtual 
        override(AccessControl) 
    {
        // Allow SUPER_ADMIN to grant any role (except DEFAULT_ADMIN_ROLE)
        if (hasRole(SUPER_ADMIN_ROLE, msg.sender)) {
            require(
                role == ADMIN_ROLE || 
                role == ISSUER_ROLE || 
                role == REVOKER_ROLE || 
                role == VERIFIER_ROLE,
                "SUPER_ADMIN cannot grant DEFAULT_ADMIN_ROLE"
            );
            _grantRole(role, account);
        } else {
            // For all other cases, use standard AccessControl logic
            // This will check if msg.sender has the admin role for 'role'
            super.grantRole(role, account);
        }
    }
    
    /**
     * @dev Override revokeRole to allow SUPER_ADMIN to revoke any role
     * SUPER_ADMIN can revoke: ADMIN, ISSUER, REVOKER, VERIFIER
     * ADMIN can revoke: ISSUER, REVOKER, VERIFIER
     */
    function revokeRole(bytes32 role, address account) 
        public 
        virtual 
        override(AccessControl) 
    {
        // Allow SUPER_ADMIN to revoke any role (except DEFAULT_ADMIN_ROLE)
        if (hasRole(SUPER_ADMIN_ROLE, msg.sender)) {
            require(
                role == ADMIN_ROLE || 
                role == ISSUER_ROLE || 
                role == REVOKER_ROLE || 
                role == VERIFIER_ROLE,
                "SUPER_ADMIN cannot revoke DEFAULT_ADMIN_ROLE"
            );
            _revokeRole(role, account);
        } else {
            // For all other cases, use standard AccessControl logic
            super.revokeRole(role, account);
        }
    }
    
    /**
     * @dev Mint a new certificate NFT (SUPER_ADMIN or ISSUER only - ADMINs must use proposal system)
     * @param recipient Address that will receive the certificate
     * @param _tokenURI Metadata URI for the certificate
     * @notice ADMINs cannot use this function - they must create proposals instead
     */
    function mintCertificate(address recipient, string memory _tokenURI) 
        external 
        whenNotPaused
        returns (uint256) 
    {
        // Block ADMINs from direct minting - they must use proposals
        require(
            !hasRole(ADMIN_ROLE, msg.sender) || hasRole(SUPER_ADMIN_ROLE, msg.sender),
            "ADMINs must use proposal system. Only SUPER_ADMIN can mint directly."
        );
        
        // Require ISSUER role or higher (SUPER_ADMIN inherits all permissions)
        require(canIssue(msg.sender), "Must have ISSUER_ROLE or higher");
        
        require(recipient != address(0), "Cannot mint to zero address");
        require(bytes(_tokenURI).length > 0, "Token URI cannot be empty");
        
        _tokenIdCounter += 1;
        uint256 newTokenId = _tokenIdCounter;
        
        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);
        
        // Store certificate metadata
        _certificateMetadata[newTokenId] = CertificateMetadata({
            recipient: recipient,
            mintedAt: block.timestamp,
            isRevoked: false,
            certificateType: "Standard"
        });
        
        emit CertificateMinted(newTokenId, recipient, _tokenURI);
        
        return newTokenId;
    }
    
    /**
     * @dev Verify if a certificate is valid (exists and not revoked)
     * @param tokenId The token ID to verify
     * @return isValid True if certificate exists and is not revoked
     */
    function verifyCertificate(uint256 tokenId) public view returns (bool isValid) {
        // Check if token exists
        if (_ownerOf(tokenId) == address(0)) {
            return false;
        }
        
        // Check if certificate is not revoked
        return !_revokedCertificates[tokenId];
    }
    
    /**
     * @dev Revoke a certificate (SUPER_ADMIN_ROLE only)
     * @param tokenId The token ID to revoke
     */
    function revokeCertificate(uint256 tokenId) 
        external 
        whenNotPaused 
    {
        require(hasRole(SUPER_ADMIN_ROLE, msg.sender), "Must have SUPER_ADMIN_ROLE");
        require(_ownerOf(tokenId) != address(0), "Certificate does not exist");
        require(!_revokedCertificates[tokenId], "Certificate already revoked");
        
        _revokedCertificates[tokenId] = true;
        _certificateMetadata[tokenId].isRevoked = true;
        
        emit CertificateRevoked(tokenId, msg.sender);
    }
    
    /**
     * @dev Get detailed information about a certificate
     * @param tokenId The token ID to query
     * @return owner Address of the certificate owner
     * @return mintedAt Timestamp when the certificate was minted
     * @return revoked Whether the certificate has been revoked
     * @return uri The metadata URI
     */
    function getCertificateDetails(uint256 tokenId) external view returns (
        address owner,
        uint256 mintedAt,
        bool revoked,
        string memory uri
    ) {
        require(_ownerOf(tokenId) != address(0), "Certificate does not exist");
        
        CertificateMetadata memory metadata = _certificateMetadata[tokenId];
        
        return (
            _ownerOf(tokenId),
            metadata.mintedAt,
            metadata.isRevoked,
            super.tokenURI(tokenId)
        );
    }
    
    /**
     * @dev Check if a certificate is revoked
     * @param tokenId The token ID to check
     * @return True if revoked, false otherwise
     */
    function isRevoked(uint256 tokenId) external view returns (bool) {
        return _revokedCertificates[tokenId];
    }
    
    /**
     * @dev Get the current token counter
     * @return The current token ID counter
     */
    function getTotalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Override _update to implement Soulbound (non-transferable) feature
     * Allows minting and burning, but prevents transfers between addresses
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) and burning (to == address(0))
        // But prevent transfers between two non-zero addresses
        if (from != address(0) && to != address(0)) {
            revert("Certificate is soulbound and non-transferable");
        }
        
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @dev Override supportsInterface for ERC721URIStorage
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    // ============ RBAC Management Functions ============
    
    /**
     * @dev Get all addresses that have a specific role
     * @param role The role to query
     * @return members Array of addresses with the role
     */
    function getRoleMembers(bytes32 role) external view returns (address[] memory) {
        uint256 count = getRoleMemberCount(role);
        address[] memory members = new address[](count);
        
        // Note: This is a helper function - in production you'd want to maintain
        // an enumerable set for better gas efficiency
        // For now, this returns empty array and should be enhanced with proper enumeration
        return members;
    }
    
    /**
     * @dev Get count of members in a role
     * @param role The role to query
     * @return count Number of addresses with the role
     */
    function getRoleMemberCount(bytes32 role) public view returns (uint256) {
        // This is a simplified version - OpenZeppelin's AccessControlEnumerable
        // should be used for full functionality
        if (hasRole(role, msg.sender)) {
            return 1;
        }
        return 0;
    }
    
    /**
     * @dev Check all roles for a specific address
     * @param account The address to check
     * @return roles Array of role identifiers the address has
     */
    function getUserRoles(address account) external view returns (bytes32[] memory) {
        bytes32[] memory allRoles = new bytes32[](5);
        allRoles[0] = SUPER_ADMIN_ROLE;
        allRoles[1] = ADMIN_ROLE;
        allRoles[2] = ISSUER_ROLE;
        allRoles[3] = REVOKER_ROLE;
        allRoles[4] = VERIFIER_ROLE;
        
        uint256 count = 0;
        for (uint256 i = 0; i < allRoles.length; i++) {
            if (hasRole(allRoles[i], account)) {
                count++;
            }
        }
        
        bytes32[] memory userRoles = new bytes32[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allRoles.length; i++) {
            if (hasRole(allRoles[i], account)) {
                userRoles[index] = allRoles[i];
                index++;
            }
        }
        
        return userRoles;
    }
    
    /**
     * @dev Request a role (emits event for admin review)
     * @param role The role being requested
     * @param justification Reason for requesting the role
     */
    function requestRole(bytes32 role, string memory justification) external {
        require(!hasRole(role, msg.sender), "Already has this role");
        require(
            role == ISSUER_ROLE || 
            role == REVOKER_ROLE || 
            role == VERIFIER_ROLE || 
            role == ADMIN_ROLE,
            "Cannot request SUPER_ADMIN_ROLE"
        );
        
        emit RoleRequested(msg.sender, role, justification);
    }
    
    /**
     * @dev Emergency role revocation (SUPER_ADMIN only)
     * @param user Address to revoke role from
     * @param role Role to revoke
     * @param reason Reason for emergency revocation
     */
    function emergencyRevokeRole(address user, bytes32 role, string memory reason) 
        external 
        onlyRole(SUPER_ADMIN_ROLE) 
    {
        require(hasRole(role, user), "User does not have this role");
        _revokeRole(role, user);
        
        emit EmergencyRoleRevoked(msg.sender, user, role, reason);
    }
    
    /**
     * @dev Pause contract (SUPER_ADMIN only)
     */
    function pause() external onlyRole(SUPER_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract (SUPER_ADMIN only)
     */
    function unpause() external onlyRole(SUPER_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Batch grant roles (SUPER_ADMIN only)
     * @param users Array of addresses to grant roles to
     * @param roles Array of roles to grant (must match users length)
     */
    function batchGrantRoles(address[] memory users, bytes32[] memory roles) 
        external 
        onlyRole(SUPER_ADMIN_ROLE) 
    {
        require(users.length == roles.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < users.length; i++) {
            grantRole(roles[i], users[i]);
        }
    }
    
    /**
     * @dev Check if address has any administrative role
     * @param account Address to check
     * @return True if has any admin role
     */
    function isAdmin(address account) public view returns (bool) {
        return hasRole(SUPER_ADMIN_ROLE, account) || 
               hasRole(ADMIN_ROLE, account);
    }
    
    /**
     * @dev Check if address can issue certificates
     * @param account Address to check
     * @return True if can issue certificates
     */
    function canIssue(address account) public view returns (bool) {
        return hasRole(SUPER_ADMIN_ROLE, account) || 
               hasRole(ADMIN_ROLE, account) ||
               hasRole(ISSUER_ROLE, account);
    }
    
    /**
     * @dev Check if address can revoke certificates
     * @param account Address to check
     * @return True if can revoke certificates (SUPER_ADMIN only)
     */
    function canRevoke(address account) public view returns (bool) {
        return hasRole(SUPER_ADMIN_ROLE, account);
    }
    
    // ============ MULTI-SIG PROPOSAL FUNCTIONS ============
    
    /**
     * @dev Create a new certificate issuance proposal
     * @param recipient Address to receive the certificate
     * @param recipientName Name of the certificate recipient
     * @param grade Grade to be awarded
     * @param metadataURI IPFS URI containing certificate metadata
     * @return proposalId The ID of the created proposal
     */
    function createProposal(
        address recipient,
        string memory recipientName,
        string memory grade,
        string memory metadataURI
    ) external whenNotPaused returns (uint256) {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || hasRole(SUPER_ADMIN_ROLE, msg.sender),
            "Must have ADMIN role or higher to create proposals"
        );
        require(recipient != address(0), "Invalid recipient address");
        require(bytes(recipientName).length > 0, "Recipient name cannot be empty");
        require(bytes(grade).length > 0, "Grade cannot be empty");
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");
        
        _proposalIdCounter += 1;
        uint256 newProposalId = _proposalIdCounter;
        
        proposals[newProposalId] = CertificateProposal({
            proposalId: newProposalId,
            proposer: msg.sender,
            recipient: recipient,
            recipientName: recipientName,
            grade: grade,
            metadataURI: metadataURI,
            approvalCount: 0,
            createdAt: block.timestamp,
            executed: false,
            cancelled: false
        });
        
        _allProposalIds.push(newProposalId);
        
        emit ProposalCreated(newProposalId, msg.sender, recipient, metadataURI);
        
        return newProposalId;
    }
    
    /**
     * @dev Approve a certificate issuance proposal
     * @param proposalId The ID of the proposal to approve
     */
    function approveProposal(uint256 proposalId) external whenNotPaused {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || hasRole(SUPER_ADMIN_ROLE, msg.sender),
            "Must have ADMIN role or higher to approve proposals"
        );
        
        CertificateProposal storage proposal = proposals[proposalId];
        require(proposal.proposalId != 0, "Proposal does not exist");
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.cancelled, "Proposal is cancelled");
        require(proposal.proposer != msg.sender, "Cannot approve your own proposal");
        require(!proposalApprovals[proposalId][msg.sender], "Already approved");
        
        // Record approval
        proposalApprovals[proposalId][msg.sender] = true;
        proposalApprovers[proposalId].push(msg.sender);
        proposal.approvalCount += 1;
        
        emit ProposalApproved(proposalId, msg.sender, proposal.approvalCount);
        
        // Auto-execute if threshold reached
        if (proposal.approvalCount >= approvalThreshold) {
            _executeProposal(proposalId);
        }
    }
    
    /**
     * @dev Revoke approval for a proposal
     * @param proposalId The ID of the proposal
     */
    function revokeApproval(uint256 proposalId) external whenNotPaused {
        CertificateProposal storage proposal = proposals[proposalId];
        require(proposal.proposalId != 0, "Proposal does not exist");
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.cancelled, "Proposal is cancelled");
        require(proposalApprovals[proposalId][msg.sender], "Not approved by sender");
        
        // Remove approval
        proposalApprovals[proposalId][msg.sender] = false;
        proposal.approvalCount -= 1;
        
        // Remove from approvers array
        address[] storage approvers = proposalApprovers[proposalId];
        for (uint256 i = 0; i < approvers.length; i++) {
            if (approvers[i] == msg.sender) {
                approvers[i] = approvers[approvers.length - 1];
                approvers.pop();
                break;
            }
        }
        
        emit ApprovalRevoked(proposalId, msg.sender, proposal.approvalCount);
    }
    
    /**
     * @dev Execute a proposal manually (if not auto-executed)
     * @param proposalId The ID of the proposal to execute
     */
    function executeProposal(uint256 proposalId) external whenNotPaused {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || hasRole(SUPER_ADMIN_ROLE, msg.sender),
            "Must have ADMIN role or higher to execute proposals"
        );
        
        CertificateProposal storage proposal = proposals[proposalId];
        require(proposal.proposalId != 0, "Proposal does not exist");
        require(!proposal.executed, "Proposal already executed");
        require(!proposal.cancelled, "Proposal is cancelled");
        require(
            proposal.approvalCount >= approvalThreshold,
            "Insufficient approvals"
        );
        
        _executeProposal(proposalId);
    }
    
    /**
     * @dev Internal function to execute a proposal
     * @param proposalId The ID of the proposal to execute
     */
    function _executeProposal(uint256 proposalId) private {
        CertificateProposal storage proposal = proposals[proposalId];
        
        // Mark as executed
        proposal.executed = true;
        
        // Mint the certificate
        _tokenIdCounter += 1;
        uint256 newTokenId = _tokenIdCounter;
        
        _safeMint(proposal.recipient, newTokenId);
        _setTokenURI(newTokenId, proposal.metadataURI);
        
        // Store certificate metadata
        _certificateMetadata[newTokenId] = CertificateMetadata({
            recipient: proposal.recipient,
            mintedAt: block.timestamp,
            isRevoked: false,
            certificateType: "Multi-Sig Approved"
        });
        
        emit ProposalExecuted(proposalId, newTokenId, proposal.recipient);
        emit CertificateMinted(newTokenId, proposal.recipient, proposal.metadataURI);
    }
    
    /**
     * @dev Cancel a proposal (SUPER_ADMIN only)
     * @param proposalId The ID of the proposal to cancel
     */
    function cancelProposal(uint256 proposalId) external onlyRole(SUPER_ADMIN_ROLE) {
        CertificateProposal storage proposal = proposals[proposalId];
        require(proposal.proposalId != 0, "Proposal does not exist");
        require(!proposal.executed, "Cannot cancel executed proposal");
        require(!proposal.cancelled, "Proposal already cancelled");
        
        proposal.cancelled = true;
        
        emit ProposalCancelled(proposalId, msg.sender);
    }
    
    /**
     * @dev Set the approval threshold (SUPER_ADMIN only)
     * @param newThreshold New number of approvals required
     */
    function setApprovalThreshold(uint256 newThreshold) external onlyRole(SUPER_ADMIN_ROLE) {
        require(newThreshold > 0, "Threshold must be greater than 0");
        require(newThreshold <= 10, "Threshold too high (max 10)");
        
        uint256 oldThreshold = approvalThreshold;
        approvalThreshold = newThreshold;
        
        emit ThresholdChanged(oldThreshold, newThreshold, msg.sender);
    }
    
    /**
     * @dev Get proposal details
     * @param proposalId The ID of the proposal
     */
    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        address recipient,
        string memory recipientName,
        string memory grade,
        string memory metadataURI,
        uint256 approvalCount,
        uint256 createdAt,
        bool executed,
        bool cancelled
    ) {
        CertificateProposal memory proposal = proposals[proposalId];
        require(proposal.proposalId != 0, "Proposal does not exist");
        
        return (
            proposal.proposalId,
            proposal.proposer,
            proposal.recipient,
            proposal.recipientName,
            proposal.grade,
            proposal.metadataURI,
            proposal.approvalCount,
            proposal.createdAt,
            proposal.executed,
            proposal.cancelled
        );
    }
    
    /**
     * @dev Get all proposal IDs
     */
    function getAllProposalIds() external view returns (uint256[] memory) {
        return _allProposalIds;
    }
    
    /**
     * @dev Get pending proposals (not executed or cancelled)
     */
    function getPendingProposals() external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count pending proposals
        for (uint256 i = 0; i < _allProposalIds.length; i++) {
            uint256 proposalId = _allProposalIds[i];
            CertificateProposal memory proposal = proposals[proposalId];
            if (!proposal.executed && !proposal.cancelled) {
                count++;
            }
        }
        
        // Create array of pending proposal IDs
        uint256[] memory pendingIds = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < _allProposalIds.length; i++) {
            uint256 proposalId = _allProposalIds[i];
            CertificateProposal memory proposal = proposals[proposalId];
            if (!proposal.executed && !proposal.cancelled) {
                pendingIds[index] = proposalId;
                index++;
            }
        }
        
        return pendingIds;
    }
    
    /**
     * @dev Get approvers for a proposal
     * @param proposalId The ID of the proposal
     */
    function getProposalApprovers(uint256 proposalId) external view returns (address[] memory) {
        return proposalApprovers[proposalId];
    }
    
    /**
     * @dev Check if an address has approved a proposal
     * @param proposalId The ID of the proposal
     * @param approver Address to check
     */
    function hasApproved(uint256 proposalId, address approver) external view returns (bool) {
        return proposalApprovals[proposalId][approver];
    }
    
    /**
     * @dev Get total number of proposals
     */
    function getProposalCount() external view returns (uint256) {
        return _proposalIdCounter;
    }
}