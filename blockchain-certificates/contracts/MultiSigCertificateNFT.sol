// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Multi-Signature Certificate NFT
 * @notice Requires multiple authorized issuers to prevent single point of failure
 * @dev Implements role-based access control with multi-sig approval for minting
 */
contract MultiSigCertificateNFT is ERC721URIStorage, AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    uint256 private _tokenIdCounter;
    uint256 public requiredApprovals = 2; // Require 2 approvals to mint
    uint256 private _requestIdCounter;
    
    // Mapping to track revoked certificates
    mapping(uint256 => bool) private _revokedCertificates;
    
    // Certificate metadata
    mapping(uint256 => CertificateMetadata) private _certificateMetadata;
    
    // Certificate issuance requests
    mapping(uint256 => CertificateRequest) public certificateRequests;
    
    struct CertificateMetadata {
        address recipient;
        uint256 mintedAt;
        bool isRevoked;
        string certificateType;
    }
    
    struct CertificateRequest {
        address recipient;
        string tokenURI;
        uint256 approvalCount;
        mapping(address => bool) approvals;
        bool executed;
        address requestedBy;
        uint256 requestedAt;
    }
    
    // Events
    event CertificateRequested(
        uint256 indexed requestId, 
        address indexed recipient, 
        address indexed requestedBy
    );
    
    event CertificateApproved(
        uint256 indexed requestId, 
        address indexed approver,
        uint256 currentApprovals,
        uint256 requiredApprovals
    );
    
    event CertificateMinted(
        uint256 indexed tokenId, 
        address indexed recipient, 
        string tokenURI
    );
    
    event CertificateRevoked(uint256 indexed tokenId, address indexed revoker);
    
    event IssuerAdded(address indexed issuer, address indexed addedBy);
    event IssuerRemoved(address indexed issuer, address indexed removedBy);
    event RequiredApprovalsUpdated(uint256 oldValue, uint256 newValue);
    
    /**
     * @notice Constructor - Sets up initial admin
     * @param initialAdmin Address of the initial admin
     */
    constructor(address initialAdmin) ERC721("MultiSigCertificateNFT", "MSCERT") {
        require(initialAdmin != address(0), "Invalid admin address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);
        _grantRole(ISSUER_ROLE, initialAdmin); // Admin is also an issuer
    }
    
    /**
     * @notice Request certificate issuance (requires multiple approvals)
     * @param recipient Wallet address to receive certificate
     * @param tokenURI Metadata URI for certificate
     * @return requestId ID of the certificate request
     */
    function requestCertificate(
        address recipient,
        string memory tokenURI
    ) external onlyRole(ISSUER_ROLE) returns (uint256) {
        require(recipient != address(0), "Cannot mint to zero address");
        require(bytes(tokenURI).length > 0, "Token URI cannot be empty");
        
        _requestIdCounter++;
        uint256 requestId = _requestIdCounter;
        
        CertificateRequest storage request = certificateRequests[requestId];
        request.recipient = recipient;
        request.tokenURI = tokenURI;
        request.approvalCount = 0;
        request.executed = false;
        request.requestedBy = msg.sender;
        request.requestedAt = block.timestamp;
        
        emit CertificateRequested(requestId, recipient, msg.sender);
        
        // Auto-approve from requester
        _approveCertificate(requestId);
        
        return requestId;
    }
    
    /**
     * @notice Approve a certificate request
     * @param requestId ID of the request to approve
     */
    function approveCertificate(uint256 requestId) external onlyRole(ISSUER_ROLE) {
        _approveCertificate(requestId);
    }
    
    /**
     * @notice Internal function to approve certificate
     */
    function _approveCertificate(uint256 requestId) private {
        CertificateRequest storage request = certificateRequests[requestId];
        
        require(request.requestedAt > 0, "Request does not exist");
        require(!request.executed, "Request already executed");
        require(!request.approvals[msg.sender], "Already approved by this address");
        
        request.approvals[msg.sender] = true;
        request.approvalCount++;
        
        emit CertificateApproved(
            requestId, 
            msg.sender, 
            request.approvalCount,
            requiredApprovals
        );
        
        // Auto-execute if threshold met
        if (request.approvalCount >= requiredApprovals) {
            _executeMint(requestId);
        }
    }
    
    /**
     * @notice Execute minting after sufficient approvals
     * @dev Can be called by anyone once threshold is met
     */
    function executeMint(uint256 requestId) external {
        CertificateRequest storage request = certificateRequests[requestId];
        
        require(request.requestedAt > 0, "Request does not exist");
        require(!request.executed, "Already executed");
        require(
            request.approvalCount >= requiredApprovals, 
            "Insufficient approvals"
        );
        
        _executeMint(requestId);
    }
    
    /**
     * @notice Internal function to mint certificate
     */
    function _executeMint(uint256 requestId) private {
        CertificateRequest storage request = certificateRequests[requestId];
        
        request.executed = true;
        
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;
        
        _safeMint(request.recipient, newTokenId);
        _setTokenURI(newTokenId, request.tokenURI);
        
        // Store certificate metadata
        _certificateMetadata[newTokenId] = CertificateMetadata({
            recipient: request.recipient,
            mintedAt: block.timestamp,
            isRevoked: false,
            certificateType: "Standard"
        });
        
        emit CertificateMinted(newTokenId, request.recipient, request.tokenURI);
    }
    
    /**
     * @notice Verify if a certificate is valid
     * @param tokenId Token ID to verify
     * @return isValid True if certificate exists and is not revoked
     */
    function verifyCertificate(uint256 tokenId) public view returns (bool isValid) {
        if (_ownerOf(tokenId) == address(0)) {
            return false;
        }
        return !_revokedCertificates[tokenId];
    }
    
    /**
     * @notice Revoke a certificate (Admin only)
     * @param tokenId Token ID to revoke
     */
    function revokeCertificate(uint256 tokenId) external onlyRole(ADMIN_ROLE) {
        require(_ownerOf(tokenId) != address(0), "Certificate does not exist");
        require(!_revokedCertificates[tokenId], "Certificate already revoked");
        
        _revokedCertificates[tokenId] = true;
        _certificateMetadata[tokenId].isRevoked = true;
        
        emit CertificateRevoked(tokenId, msg.sender);
    }
    
    /**
     * @notice Get certificate details
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
     * @notice Check if a certificate is revoked
     */
    function isRevoked(uint256 tokenId) external view returns (bool) {
        return _revokedCertificates[tokenId];
    }
    
    /**
     * @notice Get total number of minted certificates
     */
    function getTotalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @notice Check if an address has approved a request
     */
    function hasApproved(uint256 requestId, address issuer) 
        external 
        view 
        returns (bool) 
    {
        return certificateRequests[requestId].approvals[issuer];
    }
    
    /**
     * @notice Get request details
     */
    function getRequestDetails(uint256 requestId) 
        external 
        view 
        returns (
            address recipient,
            string memory tokenURI,
            uint256 approvalCount,
            bool executed,
            address requestedBy,
            uint256 requestedAt
        ) 
    {
        CertificateRequest storage request = certificateRequests[requestId];
        return (
            request.recipient,
            request.tokenURI,
            request.approvalCount,
            request.executed,
            request.requestedBy,
            request.requestedAt
        );
    }
    
    /**
     * @notice Add authorized issuer (Admin only)
     * @param issuer Address to grant issuer role
     */
    function addIssuer(address issuer) external onlyRole(ADMIN_ROLE) {
        require(issuer != address(0), "Invalid issuer address");
        grantRole(ISSUER_ROLE, issuer);
        emit IssuerAdded(issuer, msg.sender);
    }
    
    /**
     * @notice Remove issuer (Admin only)
     * @param issuer Address to revoke issuer role
     */
    function removeIssuer(address issuer) external onlyRole(ADMIN_ROLE) {
        revokeRole(ISSUER_ROLE, issuer);
        emit IssuerRemoved(issuer, msg.sender);
    }
    
    /**
     * @notice Update required approvals threshold (Admin only)
     * @param newRequired New number of required approvals
     */
    function updateRequiredApprovals(uint256 newRequired) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(newRequired > 0, "Must require at least 1 approval");
        require(newRequired <= 10, "Maximum 10 approvals");
        
        uint256 oldValue = requiredApprovals;
        requiredApprovals = newRequired;
        
        emit RequiredApprovalsUpdated(oldValue, newRequired);
    }
    
    /**
     * @notice Get list of all issuers
     * @dev This is a helper function - in production, track issuers in a separate array
     */
    function isIssuer(address account) external view returns (bool) {
        return hasRole(ISSUER_ROLE, account);
    }
    
    /**
     * @notice Prevent transfers (Soulbound NFT)
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) and burning (to == address(0))
        // But prevent transfers between two non-zero addresses
        if (from != address(0) && to != address(0)) {
            revert("Certificate is soulbound and non-transferable");
        }
        
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @notice Support interface detection
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}