import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("CertificateNFT", function () {
  let certificate, owner, user1, user2, user3;
  const SAMPLE_URI = "ipfs://QmSampleHash123";
  const SAMPLE_URI_2 = "ipfs://QmSampleHash456";

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    certificate = await ethers.deployContract("CertificateNFT", [owner.address]);
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await certificate.owner()).to.equal(owner.address);
    });

    it("Should set correct name and symbol", async function () {
      expect(await certificate.name()).to.equal("CertificateNFT");
      expect(await certificate.symbol()).to.equal("CERT");
    });

    it("Should initialize with zero tokens minted", async function () {
      expect(await certificate.getTotalMinted()).to.equal(0);
    });
  });

  describe("Minting Functionality", function () {
    it("Should mint certificate only by owner", async function () {
      await expect(
        certificate.connect(user1).mintCertificate(user1.address, SAMPLE_URI)
      ).to.be.revertedWith("Must have ISSUER_ROLE or higher");

      await certificate.mintCertificate(user1.address, SAMPLE_URI);
      expect(await certificate.getTotalMinted()).to.equal(1);
    });

    it("Should emit CertificateMinted event on successful mint", async function () {
      await expect(certificate.mintCertificate(user1.address, SAMPLE_URI))
        .to.emit(certificate, "CertificateMinted")
        .withArgs(1, user1.address, SAMPLE_URI);
    });

    it("Should mint certificate with correct token URI", async function () {
      await certificate.mintCertificate(user1.address, SAMPLE_URI);
      expect(await certificate.tokenURI(1)).to.equal(SAMPLE_URI);
    });

    it("Should mint multiple certificates with incremental token IDs", async function () {
      await certificate.mintCertificate(user1.address, SAMPLE_URI);
      await certificate.mintCertificate(user2.address, SAMPLE_URI_2);
      await certificate.mintCertificate(user3.address, SAMPLE_URI);

      expect(await certificate.getTotalMinted()).to.equal(3);
      expect(await certificate.ownerOf(1)).to.equal(user1.address);
      expect(await certificate.ownerOf(2)).to.equal(user2.address);
      expect(await certificate.ownerOf(3)).to.equal(user3.address);
    });

    it("Should revert when minting to zero address", async function () {
      await expect(
        certificate.mintCertificate(ethers.ZeroAddress, SAMPLE_URI)
      ).to.be.revertedWith("Cannot mint to zero address");
    });

    it("Should revert when minting with empty token URI", async function () {
      await expect(
        certificate.mintCertificate(user1.address, "")
      ).to.be.revertedWith("Token URI cannot be empty");
    });

    it("Should store correct certificate metadata on mint", async function () {
      const tx = await certificate.mintCertificate(user1.address, SAMPLE_URI);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const details = await certificate.getCertificateDetails(1);
      expect(details.owner).to.equal(user1.address);
      expect(details.mintedAt).to.be.closeTo(block.timestamp, 5);
      expect(details.revoked).to.equal(false);
      expect(details.uri).to.equal(SAMPLE_URI);
    });
  });

  describe("Soulbound Behavior (Transfer Restrictions)", function () {
    beforeEach(async function () {
      await certificate.mintCertificate(user1.address, SAMPLE_URI);
    });

    it("Should not allow transfer between users", async function () {
      await expect(
        certificate.connect(user1).transferFrom(user1.address, user2.address, 1)
      ).to.be.revertedWith("Certificate is soulbound and non-transferable");
    });

    it("Should not allow safeTransferFrom", async function () {
      await expect(
        certificate.connect(user1)["safeTransferFrom(address,address,uint256)"](
          user1.address,
          user2.address,
          1
        )
      ).to.be.revertedWith("Certificate is soulbound and non-transferable");
    });

    it("Should not allow transfer even with approval", async function () {
      await certificate.connect(user1).approve(user2.address, 1);
      
      await expect(
        certificate.connect(user2).transferFrom(user1.address, user3.address, 1)
      ).to.be.revertedWith("Certificate is soulbound and non-transferable");
    });

    it("Should not allow transfer with setApprovalForAll", async function () {
      await certificate.connect(user1).setApprovalForAll(user2.address, true);
      
      await expect(
        certificate.connect(user2).transferFrom(user1.address, user3.address, 1)
      ).to.be.revertedWith("Certificate is soulbound and non-transferable");
    });

    it("Should keep certificate with original owner after failed transfer", async function () {
      try {
        await certificate.connect(user1).transferFrom(user1.address, user2.address, 1);
      } catch (error) {
        // Expected to fail
      }
      
      expect(await certificate.ownerOf(1)).to.equal(user1.address);
    });
  });

  describe("Certificate Verification", function () {
    it("Should verify valid certificate", async function () {
      await certificate.mintCertificate(user1.address, SAMPLE_URI);
      expect(await certificate.verifyCertificate(1)).to.equal(true);
    });

    it("Should return false for non-existent certificate", async function () {
      expect(await certificate.verifyCertificate(999)).to.equal(false);
    });

    it("Should return false for revoked certificate", async function () {
      await certificate.mintCertificate(user1.address, SAMPLE_URI);
      await certificate.revokeCertificate(1);
      
      expect(await certificate.verifyCertificate(1)).to.equal(false);
    });

    it("Should verify multiple certificates correctly", async function () {
      await certificate.mintCertificate(user1.address, SAMPLE_URI);
      await certificate.mintCertificate(user2.address, SAMPLE_URI_2);
      await certificate.revokeCertificate(1);

      expect(await certificate.verifyCertificate(1)).to.equal(false);
      expect(await certificate.verifyCertificate(2)).to.equal(true);
    });
  });

  describe("Revocation Mechanism", function () {
    beforeEach(async function () {
      await certificate.mintCertificate(user1.address, SAMPLE_URI);
    });

    it("Should allow owner to revoke certificate", async function () {
      await expect(certificate.revokeCertificate(1))
        .to.emit(certificate, "CertificateRevoked")
        .withArgs(1, owner.address);

      expect(await certificate.isRevoked(1)).to.equal(true);
    });

    it("Should not allow non-owner to revoke certificate", async function () {
      await expect(
        certificate.connect(user1).revokeCertificate(1)
      ).to.be.revertedWith("Must have SUPER_ADMIN_ROLE");
    });

    it("Should revert when revoking non-existent certificate", async function () {
      await expect(
        certificate.revokeCertificate(999)
      ).to.be.revertedWith("Certificate does not exist");
    });

    it("Should revert when revoking already revoked certificate", async function () {
      await certificate.revokeCertificate(1);
      
      await expect(
        certificate.revokeCertificate(1)
      ).to.be.revertedWith("Certificate already revoked");
    });

    it("Should update certificate metadata after revocation", async function () {
      await certificate.revokeCertificate(1);
      
      const details = await certificate.getCertificateDetails(1);
      expect(details.revoked).to.equal(true);
    });

    it("Should still show owner after revocation", async function () {
      await certificate.revokeCertificate(1);
      
      expect(await certificate.ownerOf(1)).to.equal(user1.address);
    });

    it("Should allow revoking multiple certificates", async function () {
      await certificate.mintCertificate(user2.address, SAMPLE_URI_2);
      await certificate.mintCertificate(user3.address, SAMPLE_URI);

      await certificate.revokeCertificate(1);
      await certificate.revokeCertificate(3);

      expect(await certificate.isRevoked(1)).to.equal(true);
      expect(await certificate.isRevoked(2)).to.equal(false);
      expect(await certificate.isRevoked(3)).to.equal(true);
    });
  });

  describe("Access Controls", function () {
    it("Should only allow owner to mint certificates", async function () {
      await expect(
        certificate.connect(user1).mintCertificate(user2.address, SAMPLE_URI)
      ).to.be.revertedWith("Must have ISSUER_ROLE or higher");

      await certificate.connect(owner).mintCertificate(user2.address, SAMPLE_URI);
      expect(await certificate.ownerOf(1)).to.equal(user2.address);
    });

    it("Should only allow owner to revoke certificates", async function () {
      await certificate.mintCertificate(user1.address, SAMPLE_URI);
      
      await expect(
        certificate.connect(user1).revokeCertificate(1)
      ).to.be.revertedWith("Must have SUPER_ADMIN_ROLE");

      await certificate.connect(owner).revokeCertificate(1);
      expect(await certificate.isRevoked(1)).to.equal(true);
    });

    it("Should allow owner to transfer ownership", async function () {
      await certificate.transferOwnership(user1.address);
      expect(await certificate.owner()).to.equal(user1.address);
    });

    it("Should allow new owner to mint after ownership transfer", async function () {
      // Get role constants
      const ISSUER_ROLE = await certificate.ISSUER_ROLE();
      
      // Transfer ownership to user1
      await certificate.transferOwnership(user1.address);
      
      // Grant ISSUER_ROLE to new owner (user1) - must be done by SUPER_ADMIN (old owner still has it)
      await certificate.connect(owner).grantRole(ISSUER_ROLE, user1.address);
      
      // Old owner (who still has SUPER_ADMIN) can still mint
      await certificate.connect(owner).mintCertificate(user2.address, SAMPLE_URI);
      expect(await certificate.ownerOf(1)).to.equal(user2.address);
      
      // New owner can now mint after getting ISSUER_ROLE
      await certificate.connect(user1).mintCertificate(user3.address, SAMPLE_URI);
      expect(await certificate.ownerOf(2)).to.equal(user3.address);
    });
  });

  describe("Certificate Details", function () {
    it("Should return correct certificate details", async function () {
      await certificate.mintCertificate(user1.address, SAMPLE_URI);
      
      const details = await certificate.getCertificateDetails(1);
      expect(details.owner).to.equal(user1.address);
      expect(details.revoked).to.equal(false);
      expect(details.uri).to.equal(SAMPLE_URI);
      expect(details.mintedAt).to.be.gt(0);
    });

    it("Should revert when getting details of non-existent certificate", async function () {
      await expect(
        certificate.getCertificateDetails(999)
      ).to.be.revertedWith("Certificate does not exist");
    });

    it("Should return updated details after revocation", async function () {
      await certificate.mintCertificate(user1.address, SAMPLE_URI);
      await certificate.revokeCertificate(1);
      
      const details = await certificate.getCertificateDetails(1);
      expect(details.revoked).to.equal(true);
    });
  });

  describe("Edge Cases and Error Handling", function () {
    it("Should revert when querying tokenURI of non-existent token", async function () {
      await expect(
        certificate.tokenURI(999)
      ).to.be.revertedWithCustomError(certificate, "ERC721NonexistentToken");
    });

    it("Should revert when querying ownerOf non-existent token", async function () {
      await expect(
        certificate.ownerOf(999)
      ).to.be.revertedWithCustomError(certificate, "ERC721NonexistentToken");
    });

    it("Should handle minting to same address multiple times", async function () {
      await certificate.mintCertificate(user1.address, SAMPLE_URI);
      await certificate.mintCertificate(user1.address, SAMPLE_URI_2);
      
      expect(await certificate.ownerOf(1)).to.equal(user1.address);
      expect(await certificate.ownerOf(2)).to.equal(user1.address);
      expect(await certificate.balanceOf(user1.address)).to.equal(2);
    });

    it("Should handle long token URI strings", async function () {
      const longURI = "ipfs://" + "a".repeat(500);
      await certificate.mintCertificate(user1.address, longURI);
      
      expect(await certificate.tokenURI(1)).to.equal(longURI);
    });

    it("Should correctly track total minted after multiple operations", async function () {
      await certificate.mintCertificate(user1.address, SAMPLE_URI);
      await certificate.mintCertificate(user2.address, SAMPLE_URI_2);
      await certificate.revokeCertificate(1);
      await certificate.mintCertificate(user3.address, SAMPLE_URI);
      
      expect(await certificate.getTotalMinted()).to.equal(3);
    });

    it("Should support ERC721 interface", async function () {
      const ERC721InterfaceId = "0x80ac58cd";
      expect(await certificate.supportsInterface(ERC721InterfaceId)).to.equal(true);
    });

    it("Should handle balanceOf correctly after multiple mints", async function () {
      await certificate.mintCertificate(user1.address, SAMPLE_URI);
      await certificate.mintCertificate(user1.address, SAMPLE_URI_2);
      await certificate.mintCertificate(user2.address, SAMPLE_URI);
      
      expect(await certificate.balanceOf(user1.address)).to.equal(2);
      expect(await certificate.balanceOf(user2.address)).to.equal(1);
    });

    it("Should revert balanceOf for zero address", async function () {
      await expect(
        certificate.balanceOf(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(certificate, "ERC721InvalidOwner");
    });
  });

  describe("Token Counter", function () {
    it("Should increment token counter correctly", async function () {
      expect(await certificate.getTotalMinted()).to.equal(0);
      
      await certificate.mintCertificate(user1.address, SAMPLE_URI);
      expect(await certificate.getTotalMinted()).to.equal(1);
      
      await certificate.mintCertificate(user2.address, SAMPLE_URI_2);
      expect(await certificate.getTotalMinted()).to.equal(2);
    });

    it("Should not reset counter after revocation", async function () {
      await certificate.mintCertificate(user1.address, SAMPLE_URI);
      await certificate.revokeCertificate(1);
      await certificate.mintCertificate(user2.address, SAMPLE_URI_2);
      
      expect(await certificate.getTotalMinted()).to.equal(2);
    });
  });
});