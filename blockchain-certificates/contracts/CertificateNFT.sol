// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CertificateNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
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
    
    // Events
    event CertificateMinted(uint256 indexed tokenId, address indexed recipient, string tokenURI);
    event CertificateRevoked(uint256 indexed tokenId, address indexed revoker);
    
    constructor(address initialOwner) 
        ERC721("CertificateNFT", "CERT") 
        Ownable(initialOwner) 
    {}
    
    /**
     * @dev Mint a new certificate NFT (Admin only)
     * @param recipient Address that will receive the certificate
     * @param _tokenURI Metadata URI for the certificate
     */
    function mintCertificate(address recipient, string memory _tokenURI) external onlyOwner returns (uint256) {
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
     * @dev Revoke a certificate (Admin only)
     * @param tokenId The token ID to revoke
     */
    function revokeCertificate(uint256 tokenId) external onlyOwner {
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
    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}