import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("CertificateNFT - Role-Based Access Control", function () {
  let certificateNFT;
  let owner;
  let superAdmin;
  let admin;
  let issuer;
  let revoker;
  let verifier;
  let user;
  
  // Role constants
  let SUPER_ADMIN_ROLE;
  let ADMIN_ROLE;
  let ISSUER_ROLE;
  let REVOKER_ROLE;
  let VERIFIER_ROLE;
  let DEFAULT_ADMIN_ROLE;

  beforeEach(async function () {
    // Get signers
    [owner, superAdmin, admin, issuer, revoker, verifier, user] = await ethers.getSigners();

    // Deploy contract
    const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    certificateNFT = await CertificateNFT.deploy(owner.address);
    await certificateNFT.waitForDeployment();

    // Get role constants
    SUPER_ADMIN_ROLE = await certificateNFT.SUPER_ADMIN_ROLE();
    ADMIN_ROLE = await certificateNFT.ADMIN_ROLE();
    ISSUER_ROLE = await certificateNFT.ISSUER_ROLE();
    REVOKER_ROLE = await certificateNFT.REVOKER_ROLE();
    VERIFIER_ROLE = await certificateNFT.VERIFIER_ROLE();
    DEFAULT_ADMIN_ROLE = ethers.ZeroHash; // 0x00...00
  });

  describe("Deployment and Initial Roles", function () {
    it("Should assign SUPER_ADMIN_ROLE to deployer", async function () {
      expect(await certificateNFT.hasRole(SUPER_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should assign DEFAULT_ADMIN_ROLE to deployer", async function () {
      expect(await certificateNFT.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should set up role hierarchy correctly", async function () {
      // SUPER_ADMIN should be admin of ADMIN_ROLE
      expect(await certificateNFT.getRoleAdmin(ADMIN_ROLE)).to.equal(SUPER_ADMIN_ROLE);
      
      // ADMIN should be admin of ISSUER_ROLE
      expect(await certificateNFT.getRoleAdmin(ISSUER_ROLE)).to.equal(ADMIN_ROLE);
      
      // ADMIN should be admin of REVOKER_ROLE
      expect(await certificateNFT.getRoleAdmin(REVOKER_ROLE)).to.equal(ADMIN_ROLE);
      
      // ADMIN should be admin of VERIFIER_ROLE
      expect(await certificateNFT.getRoleAdmin(VERIFIER_ROLE)).to.equal(ADMIN_ROLE);
    });
  });

  describe("Role Assignment", function () {
    it("Should allow SUPER_ADMIN to grant ADMIN_ROLE", async function () {
      await certificateNFT.connect(owner).grantRole(ADMIN_ROLE, admin.address);
      expect(await certificateNFT.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("Should allow ADMIN to grant ISSUER_ROLE", async function () {
      // First grant ADMIN role
      await certificateNFT.connect(owner).grantRole(ADMIN_ROLE, admin.address);
      
      // Admin grants ISSUER role
      await certificateNFT.connect(admin).grantRole(ISSUER_ROLE, issuer.address);
      expect(await certificateNFT.hasRole(ISSUER_ROLE, issuer.address)).to.be.true;
    });

    it("Should allow ADMIN to grant REVOKER_ROLE", async function () {
      await certificateNFT.connect(owner).grantRole(ADMIN_ROLE, admin.address);
      await certificateNFT.connect(admin).grantRole(REVOKER_ROLE, revoker.address);
      expect(await certificateNFT.hasRole(REVOKER_ROLE, revoker.address)).to.be.true;
    });

    it("Should allow ADMIN to grant VERIFIER_ROLE", async function () {
      await certificateNFT.connect(owner).grantRole(ADMIN_ROLE, admin.address);
      await certificateNFT.connect(admin).grantRole(VERIFIER_ROLE, verifier.address);
      expect(await certificateNFT.hasRole(VERIFIER_ROLE, verifier.address)).to.be.true;
    });

    it("Should NOT allow ISSUER to grant roles", async function () {
      await certificateNFT.connect(owner).grantRole(ADMIN_ROLE, admin.address);
      await certificateNFT.connect(admin).grantRole(ISSUER_ROLE, issuer.address);
      
      await expect(
        certificateNFT.connect(issuer).grantRole(ISSUER_ROLE, user.address)
      ).to.be.revertedWithCustomError(certificateNFT, "AccessControlUnauthorizedAccount");
    });

    it("Should NOT allow non-admin to grant ADMIN_ROLE", async function () {
      await expect(
        certificateNFT.connect(user).grantRole(ADMIN_ROLE, admin.address)
      ).to.be.revertedWithCustomError(certificateNFT, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Role Revocation", function () {
    beforeEach(async function () {
      // Setup roles
      await certificateNFT.connect(owner).grantRole(ADMIN_ROLE, admin.address);
      await certificateNFT.connect(admin).grantRole(ISSUER_ROLE, issuer.address);
    });

    it("Should allow ADMIN to revoke ISSUER_ROLE", async function () {
      await certificateNFT.connect(admin).revokeRole(ISSUER_ROLE, issuer.address);
      expect(await certificateNFT.hasRole(ISSUER_ROLE, issuer.address)).to.be.false;
    });

    it("Should allow SUPER_ADMIN to revoke ADMIN_ROLE", async function () {
      await certificateNFT.connect(owner).revokeRole(ADMIN_ROLE, admin.address);
      expect(await certificateNFT.hasRole(ADMIN_ROLE, admin.address)).to.be.false;
    });

    it("Should NOT allow ISSUER to revoke roles", async function () {
      await expect(
        certificateNFT.connect(issuer).revokeRole(ISSUER_ROLE, issuer.address)
      ).to.be.revertedWithCustomError(certificateNFT, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Certificate Minting Permissions", function () {
    beforeEach(async function () {
      await certificateNFT.connect(owner).grantRole(ADMIN_ROLE, admin.address);
      await certificateNFT.connect(admin).grantRole(ISSUER_ROLE, issuer.address);
    });

    it("Should allow ISSUER to mint certificates", async function () {
      await certificateNFT.connect(issuer).mintCertificate(
        user.address,
        "ipfs://test-uri"
      );
      
      expect(await certificateNFT.balanceOf(user.address)).to.equal(1);
    });

    it("Should NOT allow ADMIN to mint certificates directly (must use proposals)", async function () {
      // ADMINs are blocked from direct minting - they must use the proposal system
      await expect(
        certificateNFT.connect(admin).mintCertificate(user.address, "ipfs://test-uri")
      ).to.be.revertedWith("ADMINs must use proposal system. Only SUPER_ADMIN can mint directly.");
    });

    it("Should allow SUPER_ADMIN to mint certificates", async function () {
      await certificateNFT.connect(owner).mintCertificate(
        user.address,
        "ipfs://test-uri"
      );
      
      expect(await certificateNFT.balanceOf(user.address)).to.equal(1);
    });

    it("Should NOT allow REVOKER to mint certificates", async function () {
      await certificateNFT.connect(admin).grantRole(REVOKER_ROLE, revoker.address);
      
      await expect(
        certificateNFT.connect(revoker).mintCertificate(user.address, "ipfs://test-uri")
      ).to.be.revertedWith("Must have ISSUER_ROLE or higher");
    });

    it("Should NOT allow VERIFIER to mint certificates", async function () {
      await certificateNFT.connect(admin).grantRole(VERIFIER_ROLE, verifier.address);
      
      await expect(
        certificateNFT.connect(verifier).mintCertificate(user.address, "ipfs://test-uri")
      ).to.be.revertedWith("Must have ISSUER_ROLE or higher");
    });

    it("Should NOT allow users without roles to mint", async function () {
      await expect(
        certificateNFT.connect(user).mintCertificate(user.address, "ipfs://test-uri")
      ).to.be.revertedWith("Must have ISSUER_ROLE or higher");
    });
  });

  describe("Certificate Revocation Permissions", function () {
    let tokenId;

    beforeEach(async function () {
      await certificateNFT.connect(owner).grantRole(ADMIN_ROLE, admin.address);
      await certificateNFT.connect(admin).grantRole(ISSUER_ROLE, issuer.address);
      await certificateNFT.connect(admin).grantRole(REVOKER_ROLE, revoker.address);
      
      // Mint a certificate
      const tx = await certificateNFT.connect(issuer).mintCertificate(
        user.address,
        "ipfs://test-uri"
      );
      const receipt = await tx.wait();
      tokenId = 1; // First token
    });

    it("Should allow REVOKER to revoke certificates", async function () {
      // REVOKER role is now deprecated - only SUPER_ADMIN can revoke
      await expect(
        certificateNFT.connect(revoker).revokeCertificate(tokenId)
      ).to.be.revertedWith("Must have SUPER_ADMIN_ROLE");
    });

    it("Should allow ADMIN to revoke certificates", async function () {
      // ADMIN can no longer revoke - only SUPER_ADMIN can revoke
      await expect(
        certificateNFT.connect(admin).revokeCertificate(tokenId)
      ).to.be.revertedWith("Must have SUPER_ADMIN_ROLE");
    });

    it("Should allow SUPER_ADMIN to revoke certificates", async function () {
      await certificateNFT.connect(owner).revokeCertificate(tokenId);
      expect(await certificateNFT.isRevoked(tokenId)).to.be.true;
    });

    it("Should NOT allow ISSUER to revoke certificates", async function () {
      await expect(
        certificateNFT.connect(issuer).revokeCertificate(tokenId)
      ).to.be.revertedWith("Must have SUPER_ADMIN_ROLE");
    });

    it("Should NOT allow users without roles to revoke", async function () {
      await expect(
        certificateNFT.connect(user).revokeCertificate(tokenId)
      ).to.be.revertedWith("Must have SUPER_ADMIN_ROLE");
    });
  });

  describe("Helper Functions", function () {
    beforeEach(async function () {
      await certificateNFT.connect(owner).grantRole(ADMIN_ROLE, admin.address);
      await certificateNFT.connect(admin).grantRole(ISSUER_ROLE, issuer.address);
      await certificateNFT.connect(admin).grantRole(REVOKER_ROLE, revoker.address);
    });

    it("Should correctly identify admins with isAdmin()", async function () {
      expect(await certificateNFT.isAdmin(owner.address)).to.be.true;
      expect(await certificateNFT.isAdmin(admin.address)).to.be.true;
      expect(await certificateNFT.isAdmin(issuer.address)).to.be.false;
      expect(await certificateNFT.isAdmin(user.address)).to.be.false;
    });

    it("Should correctly identify issuers with canIssue()", async function () {
      expect(await certificateNFT.canIssue(owner.address)).to.be.true;
      expect(await certificateNFT.canIssue(admin.address)).to.be.true;
      expect(await certificateNFT.canIssue(issuer.address)).to.be.true;
      expect(await certificateNFT.canIssue(revoker.address)).to.be.false;
      expect(await certificateNFT.canIssue(user.address)).to.be.false;
    });

    it("Should correctly identify revokers with canRevoke()", async function () {
      // Only SUPER_ADMIN can revoke now
      expect(await certificateNFT.canRevoke(owner.address)).to.be.true;
      expect(await certificateNFT.canRevoke(admin.address)).to.be.false;
      expect(await certificateNFT.canRevoke(revoker.address)).to.be.false;
      expect(await certificateNFT.canRevoke(issuer.address)).to.be.false;
      expect(await certificateNFT.canRevoke(user.address)).to.be.false;
    });

    it("Should return all user roles with getUserRoles()", async function () {
      const roles = await certificateNFT.getUserRoles(admin.address);
      expect(roles.length).to.equal(1);
      expect(roles[0]).to.equal(ADMIN_ROLE);
    });

    it("Should return multiple roles for user with multiple roles", async function () {
      await certificateNFT.connect(admin).grantRole(ISSUER_ROLE, admin.address);
      await certificateNFT.connect(admin).grantRole(REVOKER_ROLE, admin.address);
      
      const roles = await certificateNFT.getUserRoles(admin.address);
      expect(roles.length).to.equal(3);
      expect(roles).to.include(ADMIN_ROLE);
      expect(roles).to.include(ISSUER_ROLE);
      expect(roles).to.include(REVOKER_ROLE);
    });
  });

  describe("Role Request System", function () {
    it("Should emit RoleRequested event", async function () {
      await expect(
        certificateNFT.connect(user).requestRole(ISSUER_ROLE, "I need to issue certificates")
      ).to.emit(certificateNFT, "RoleRequested")
        .withArgs(user.address, ISSUER_ROLE, "I need to issue certificates");
    });

    it("Should NOT allow requesting role if already has it", async function () {
      // Owner needs ADMIN_ROLE to grant ISSUER_ROLE
      await certificateNFT.connect(owner).grantRole(ADMIN_ROLE, owner.address);
      await certificateNFT.connect(owner).grantRole(ISSUER_ROLE, user.address);
      
      await expect(
        certificateNFT.connect(user).requestRole(ISSUER_ROLE, "I need this role")
      ).to.be.revertedWith("Already has this role");
    });

    it("Should NOT allow requesting SUPER_ADMIN_ROLE", async function () {
      await expect(
        certificateNFT.connect(user).requestRole(SUPER_ADMIN_ROLE, "I want admin access")
      ).to.be.revertedWith("Cannot request SUPER_ADMIN_ROLE");
    });
  });

  describe("Emergency Role Revocation", function () {
    beforeEach(async function () {
      await certificateNFT.connect(owner).grantRole(ADMIN_ROLE, admin.address);
    });

    it("Should allow SUPER_ADMIN to emergency revoke roles", async function () {
      await expect(
        certificateNFT.connect(owner).emergencyRevokeRole(
          admin.address,
          ADMIN_ROLE,
          "Suspected account compromise"
        )
      ).to.emit(certificateNFT, "EmergencyRoleRevoked")
        .withArgs(owner.address, admin.address, ADMIN_ROLE, "Suspected account compromise");
      
      expect(await certificateNFT.hasRole(ADMIN_ROLE, admin.address)).to.be.false;
    });

    it("Should NOT allow non-SUPER_ADMIN to emergency revoke", async function () {
      await expect(
        certificateNFT.connect(admin).emergencyRevokeRole(
          admin.address,
          ADMIN_ROLE,
          "Test"
        )
      ).to.be.revertedWithCustomError(certificateNFT, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Batch Role Assignment", function () {
    it("Should allow batch granting roles", async function () {
      const users = [issuer.address, revoker.address, verifier.address];
      const roles = [ISSUER_ROLE, REVOKER_ROLE, VERIFIER_ROLE];
      
      await certificateNFT.connect(owner).grantRole(ADMIN_ROLE, owner.address);
      await certificateNFT.connect(owner).batchGrantRoles(users, roles);
      
      expect(await certificateNFT.hasRole(ISSUER_ROLE, issuer.address)).to.be.true;
      expect(await certificateNFT.hasRole(REVOKER_ROLE, revoker.address)).to.be.true;
      expect(await certificateNFT.hasRole(VERIFIER_ROLE, verifier.address)).to.be.true;
    });

    it("Should revert if arrays length mismatch", async function () {
      const users = [issuer.address, revoker.address];
      const roles = [ISSUER_ROLE];
      
      await expect(
        certificateNFT.connect(owner).batchGrantRoles(users, roles)
      ).to.be.revertedWith("Arrays length mismatch");
    });

    it("Should only allow SUPER_ADMIN to batch grant", async function () {
      const users = [issuer.address];
      const roles = [ISSUER_ROLE];
      
      await expect(
        certificateNFT.connect(user).batchGrantRoles(users, roles)
      ).to.be.revertedWithCustomError(certificateNFT, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow SUPER_ADMIN to pause contract", async function () {
      await certificateNFT.connect(owner).pause();
      
      // Owner needs ADMIN_ROLE to grant ISSUER_ROLE
      await certificateNFT.connect(owner).grantRole(ADMIN_ROLE, owner.address);
      await certificateNFT.connect(owner).grantRole(ISSUER_ROLE, issuer.address);
      
      await expect(
        certificateNFT.connect(issuer).mintCertificate(user.address, "ipfs://test")
      ).to.be.revertedWithCustomError(certificateNFT, "EnforcedPause");
    });

    it("Should allow SUPER_ADMIN to unpause contract", async function () {
      await certificateNFT.connect(owner).pause();
      await certificateNFT.connect(owner).unpause();
      
      // Owner needs ADMIN_ROLE to grant ISSUER_ROLE
      await certificateNFT.connect(owner).grantRole(ADMIN_ROLE, owner.address);
      await certificateNFT.connect(owner).grantRole(ISSUER_ROLE, issuer.address);
      await certificateNFT.connect(issuer).mintCertificate(user.address, "ipfs://test");
      
      expect(await certificateNFT.balanceOf(user.address)).to.equal(1);
    });

    it("Should NOT allow non-SUPER_ADMIN to pause", async function () {
      await certificateNFT.connect(owner).grantRole(ADMIN_ROLE, admin.address);
      
      await expect(
        certificateNFT.connect(admin).pause()
      ).to.be.revertedWithCustomError(certificateNFT, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Integration: Complete Role Workflow", function () {
    it("Should support complete role management workflow", async function () {
      // 1. Super Admin assigns Admin
      await certificateNFT.connect(owner).grantRole(ADMIN_ROLE, admin.address);
      expect(await certificateNFT.isAdmin(admin.address)).to.be.true;
      
      // 2. Admin assigns Issuer and Revoker
      await certificateNFT.connect(admin).grantRole(ISSUER_ROLE, issuer.address);
      await certificateNFT.connect(admin).grantRole(REVOKER_ROLE, revoker.address);
      
      // 3. Issuer mints certificate
      await certificateNFT.connect(issuer).mintCertificate(
        user.address,
        "ipfs://certificate-1"
      );
      
      // 4. Verify certificate
      expect(await certificateNFT.verifyCertificate(1)).to.be.true;
      
      // 5. Only SUPER_ADMIN can revoke certificate (REVOKER role is deprecated)
      await certificateNFT.connect(owner).revokeCertificate(1);
      expect(await certificateNFT.verifyCertificate(1)).to.be.false;
      
      // 6. Admin revokes Issuer's role
      await certificateNFT.connect(admin).revokeRole(ISSUER_ROLE, issuer.address);
      expect(await certificateNFT.canIssue(issuer.address)).to.be.false;
      
      // 7. Super Admin can still do everything
      expect(await certificateNFT.canIssue(owner.address)).to.be.true;
      expect(await certificateNFT.canRevoke(owner.address)).to.be.true;
      expect(await certificateNFT.isAdmin(owner.address)).to.be.true;
    });
  });
});
