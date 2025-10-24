import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("CertificateNFT - Multi-Signature Proposal System", function () {
  let certificateNFT;
  let owner, admin1, admin2, admin3, admin4, admin5, recipient, nonAdmin;
  
  const SUPER_ADMIN_ROLE = ethers.id("SUPER_ADMIN_ROLE");
  const ADMIN_ROLE = ethers.id("ADMIN_ROLE");
  
  beforeEach(async function () {
    [owner, admin1, admin2, admin3, admin4, admin5, recipient, nonAdmin] = await ethers.getSigners();
    
    // Deploy contract
    certificateNFT = await ethers.deployContract("CertificateNFT", [owner.address]);
    
    // Grant ADMIN roles to admin1-5
    await certificateNFT.grantRole(ADMIN_ROLE, admin1.address);
    await certificateNFT.grantRole(ADMIN_ROLE, admin2.address);
    await certificateNFT.grantRole(ADMIN_ROLE, admin3.address);
    await certificateNFT.grantRole(ADMIN_ROLE, admin4.address);
    await certificateNFT.grantRole(ADMIN_ROLE, admin5.address);
  });

  describe("Proposal Creation", function () {
    it("Should allow ADMIN to create a proposal", async function () {
      const tx = await certificateNFT.connect(admin1).createProposal(
        recipient.address,
        "John Doe",
        "A+",
        "ipfs://QmTest123"
      );
      
      await expect(tx)
        .to.emit(certificateNFT, "ProposalCreated")
        .withArgs(1n, admin1.address, recipient.address, "ipfs://QmTest123");
      
      const proposal = await certificateNFT.getProposal(1n);
      expect(proposal.proposer).to.equal(admin1.address);
      expect(proposal.recipient).to.equal(recipient.address);
      expect(proposal.recipientName).to.equal("John Doe");
      expect(proposal.grade).to.equal("A+");
      expect(proposal.approvalCount).to.equal(0n);
      expect(proposal.executed).to.be.false;
      expect(proposal.cancelled).to.be.false;
    });
    
    it("Should increment proposal ID correctly", async function () {
      await certificateNFT.connect(admin1).createProposal(
        recipient.address, "John Doe", "A+", "ipfs://QmTest1"
      );
      await certificateNFT.connect(admin2).createProposal(
        recipient.address, "Jane Smith", "A", "ipfs://QmTest2"
      );
      
      const count = await certificateNFT.getProposalCount();
      expect(count).to.equal(2n);
    });
  });

  describe("Proposal Approval", function () {
    beforeEach(async function () {
      await certificateNFT.connect(admin1).createProposal(
        recipient.address, "John Doe", "A+", "ipfs://QmTest123"
      );
    });
    
    it("Should allow ADMIN to approve a proposal", async function () {
      const tx = await certificateNFT.connect(admin2).approveProposal(1n);
      
      await expect(tx)
        .to.emit(certificateNFT, "ProposalApproved")
        .withArgs(1n, admin2.address, 1n);
      
      const proposal = await certificateNFT.getProposal(1n);
      expect(proposal.approvalCount).to.equal(1n);
      
      const hasApproved = await certificateNFT.hasApproved(1n, admin2.address);
      expect(hasApproved).to.be.true;
    });
    
    it("Should prevent double approvals", async function () {
      await certificateNFT.connect(admin2).approveProposal(1n);
      
      await expect(
        certificateNFT.connect(admin2).approveProposal(1n)
      ).to.be.revertedWith("Already approved");
    });
    
    it("Should prevent proposer from approving their own proposal", async function () {
      // admin1 created the proposal in beforeEach, so they cannot approve it
      await expect(
        certificateNFT.connect(admin1).approveProposal(1n)
      ).to.be.revertedWith("Cannot approve your own proposal");
    });
  });

  describe("Auto-Execution at Threshold", function () {
    beforeEach(async function () {
      await certificateNFT.connect(admin1).createProposal(
        recipient.address, "John Doe", "A+", "ipfs://QmTest123"
      );
    });
    
    it("Should auto-execute when threshold is reached", async function () {
      await certificateNFT.connect(admin2).approveProposal(1n);
      await certificateNFT.connect(admin3).approveProposal(1n);
      
      // Third approval should trigger execution
      const tx = await certificateNFT.connect(admin4).approveProposal(1n);
      
      await expect(tx)
        .to.emit(certificateNFT, "ProposalExecuted")
        .withArgs(1n, 1n, recipient.address);
      
      const proposal = await certificateNFT.getProposal(1n);
      expect(proposal.executed).to.be.true;
      expect(proposal.approvalCount).to.equal(3n);
      
      // Verify certificate was minted
      const owner_addr = await certificateNFT.ownerOf(1n);
      expect(owner_addr).to.equal(recipient.address);
    });
  });

  describe("Threshold Management", function () {
    it("Should allow SUPER_ADMIN to change threshold", async function () {
      const tx = await certificateNFT.setApprovalThreshold(5n);
      
      await expect(tx)
        .to.emit(certificateNFT, "ThresholdChanged")
        .withArgs(3n, 5n, owner.address);
      
      const newThreshold = await certificateNFT.approvalThreshold();
      expect(newThreshold).to.equal(5n);
    });
    
    it("Should reject threshold of 0", async function () {
      await expect(
        certificateNFT.setApprovalThreshold(0n)
      ).to.be.revertedWith("Threshold must be greater than 0");
    });
  });

  describe("Proposal Queries", function () {
    beforeEach(async function () {
      await certificateNFT.connect(admin1).createProposal(
        recipient.address, "John Doe", "A+", "ipfs://QmTest1"
      );
      await certificateNFT.connect(admin2).createProposal(
        recipient.address, "Jane Smith", "A", "ipfs://QmTest2"
      );
      await certificateNFT.connect(admin3).createProposal(
        recipient.address, "Bob Johnson", "B+", "ipfs://QmTest3"
      );
    });
    
    it("Should return all proposal IDs", async function () {
      const ids = await certificateNFT.getAllProposalIds();
      expect(ids.length).to.equal(3);
      expect(ids[0]).to.equal(1n);
      expect(ids[1]).to.equal(2n);
      expect(ids[2]).to.equal(3n);
    });
    
    it("Should return only pending proposals", async function () {
      // Execute proposal 1 (created by admin1, so needs approval from others)
      await certificateNFT.connect(admin2).approveProposal(1n);
      await certificateNFT.connect(admin3).approveProposal(1n);
      await certificateNFT.connect(admin4).approveProposal(1n);
      
      // Cancel proposal 2 (created by admin2)
      await certificateNFT.connect(owner).cancelProposal(2n);
      
      // Proposal 3 (created by admin3) should still be pending
      const pendingIds = await certificateNFT.getPendingProposals();
      expect(pendingIds.length).to.equal(1);
      expect(pendingIds[0]).to.equal(3n);
    });
  });
});
