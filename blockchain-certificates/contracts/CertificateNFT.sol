// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CertificateNFT is ERC721, Ownable {
    uint256 public tokenIdCounter;
    mapping(uint256 => string) private _tokenURIs;

    constructor(address initialOwner) ERC721("CertificateNFT", "CERT") Ownable(initialOwner) {}

    // Only issuer can mint certificates
    function mintCertificate(address to, string memory _tokenURI) external onlyOwner {
        tokenIdCounter += 1;
        uint256 newTokenId = tokenIdCounter;

        _safeMint(to, newTokenId);
        _tokenURIs[newTokenId] = _tokenURI;
    }

    // Soulbound restriction: prevent transfers by overriding _update
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) but prevent transfers
        if (from != address(0) && to != address(0)) {
            revert("This NFT is soulbound and non-transferable");
        }
        
        return super._update(to, tokenId, auth);
    }

    // Return certificate metadata
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        return _tokenURIs[tokenId];
    }
}
