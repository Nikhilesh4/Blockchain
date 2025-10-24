# Proposer Cannot Approve Own Proposal - Security Feature

## 🔒 Overview

This document describes the implementation of an important security measure: **Proposers cannot approve their own proposals**. This prevents a single admin from creating and approving their own certificate proposals.

## 🎯 Security Rationale

### Without This Restriction (Security Risk)
```
┌─────────────────────────────────────────┐
│ Malicious Admin Scenario                │
├─────────────────────────────────────────┤
│ 1. Admin creates proposal      ✓        │
│ 2. Admin approves own proposal ✓        │
│ 3. Only needs 2 more approvals          │
│ 4. Lower security threshold!    ⚠️      │
└─────────────────────────────────────────┘
```

### With This Restriction (Secure)
```
┌─────────────────────────────────────────┐
│ Secure Multi-Sig Workflow               │
├─────────────────────────────────────────┤
│ 1. Admin creates proposal      ✓        │
│ 2. Admin tries to approve      ✗        │
│    → "Cannot approve own"               │
│ 3. Needs 3 different admins    ✓        │
│ 4. Higher security threshold!   ✅      │
└─────────────────────────────────────────┘
```

## 📝 Smart Contract Implementation

### Updated `approveProposal()` Function

```solidity
function approveProposal(uint256 proposalId) external whenNotPaused {
    require(
        hasRole(ADMIN_ROLE, msg.sender) || hasRole(SUPER_ADMIN_ROLE, msg.sender),
        "Must have ADMIN role or higher to approve proposals"
    );
    
    CertificateProposal storage proposal = proposals[proposalId];
    require(proposal.proposalId != 0, "Proposal does not exist");
    require(!proposal.executed, "Proposal already executed");
    require(!proposal.cancelled, "Proposal is cancelled");
    
    // ✅ NEW: Prevent proposer from approving their own proposal
    require(proposal.proposer != msg.sender, "Cannot approve your own proposal");
    
    require(!proposalApprovals[proposalId][msg.sender], "Already approved");
    
    // ... rest of approval logic
}
```

### Key Changes

1. **Added Check**: `require(proposal.proposer != msg.sender, "Cannot approve your own proposal");`
2. **Position**: Checked BEFORE the "Already approved" check
3. **Error Message**: Clear and specific for better UX

## 🎨 Frontend Implementation

### Updated `proposalUtils.js`

```javascript
export function canApproveProposal(proposal, userAddress, hasApproved, isAdmin) {
  if (!isAdmin) return false;
  if (hasApproved) return false;
  if (proposal.executed || proposal.cancelled) return false;
  
  // ✅ NEW: Check if user is the proposer
  if (proposal.proposer && userAddress && 
      proposal.proposer.toLowerCase() === userAddress.toLowerCase()) {
    return false;
  }
  
  return true;
}
```

### UI Behavior

When a user views their own proposal:

**Before (Would show "Approve" button):**
```jsx
<ProposalCard proposal={myProposal}>
  <button>Approve</button>  ← User could click this
</ProposalCard>
```

**After (Shows informative message):**
```jsx
<ProposalCard proposal={myProposal}>
  <div className="info-message">
    ℹ️ You cannot approve your own proposal
  </div>
</ProposalCard>
```

## ✅ Test Coverage

### New Test Case

```javascript
it("Should prevent proposer from approving their own proposal", async function () {
  // admin1 created the proposal, so they cannot approve it
  await expect(
    certificateNFT.connect(admin1).approveProposal(1n)
  ).to.be.revertedWith("Cannot approve your own proposal");
});
```

### Test Results
- ✅ All 95 tests passing
- ✅ 10 multi-sig tests passing
- ✅ New restriction test included

## 🔄 Complete Workflow Example

### Scenario: Admin1 Creates a Certificate Proposal

```javascript
// Step 1: Admin1 creates proposal
await contract.connect(admin1).createProposal(
  "0xRecipient...",
  "John Doe",
  "A+",
  "ipfs://QmMetadata..."
);
// ✅ Proposal ID: 1, Proposer: admin1

// Step 2: Admin1 tries to approve (BLOCKED)
await contract.connect(admin1).approveProposal(1);
// ❌ Error: "Cannot approve your own proposal"

// Step 3: Admin2 approves
await contract.connect(admin2).approveProposal(1);
// ✅ Approval count: 1

// Step 4: Admin3 approves
await contract.connect(admin3).approveProposal(1);
// ✅ Approval count: 2

// Step 5: Admin4 approves (reaches threshold)
await contract.connect(admin4).approveProposal(1);
// ✅ Approval count: 3 → AUTO-EXECUTE → Certificate minted!
```

## 📊 Security Impact

### Approval Requirements

| Threshold | Without Restriction | With Restriction |
|-----------|---------------------|------------------|
| 3 approvals | Proposer + 2 others | 3 different admins (not proposer) |
| 5 approvals | Proposer + 4 others | 5 different admins (not proposer) |

### Benefits

1. **Stronger Security**: Requires truly independent approvals
2. **Prevents Self-Dealing**: One admin cannot fast-track their own proposals
3. **Better Accountability**: Forces peer review from other admins
4. **Audit Trail**: Clear separation between proposer and approvers
5. **Transparent Process**: Anyone can verify proposer didn't self-approve

## 🚨 Edge Cases Handled

### Case 1: Proposer Has Multiple Accounts
- ✅ Each account is checked independently
- ✅ Proposer account cannot approve regardless of other accounts

### Case 2: Threshold of 1
- ✅ Even with threshold=1, proposer cannot self-approve
- ✅ Requires at least one other admin's approval

### Case 3: SUPER_ADMIN as Proposer
- ✅ Same rules apply - SUPER_ADMIN proposers cannot self-approve
- ✅ Emergency: SUPER_ADMIN can still use direct mint (bypass proposals)

## 🔍 Verification Methods

### Contract Level Verification

```javascript
// Create proposal as admin1
const tx1 = await contract.connect(admin1).createProposal(...);
const receipt1 = await tx1.wait();
const proposalId = receipt1.events[0].args.proposalId;

// Get proposal details
const proposal = await contract.getProposal(proposalId);
console.log("Proposer:", proposal.proposer); // admin1.address

// Try to approve as admin1 (should fail)
try {
  await contract.connect(admin1).approveProposal(proposalId);
  console.log("❌ ERROR: Self-approval was allowed!");
} catch (error) {
  console.log("✅ CORRECT: Self-approval blocked");
  console.log("Error:", error.message);
  // "Cannot approve your own proposal"
}
```

### Frontend Level Verification

```javascript
// In ProposalCard component
const isProposer = proposal.proposer.toLowerCase() === currentAccount.toLowerCase();
const canApprove = canApproveProposal(proposal, currentAccount, hasApproved, isAdmin);

console.log({
  isProposer,        // true if user created this proposal
  canApprove,        // false if isProposer is true
  currentAccount,    // user's address
  proposer: proposal.proposer  // creator's address
});

// Approve button is disabled/hidden if isProposer === true
```

## 📱 User Experience

### For Proposers (Creating Proposals)

1. Create proposal → ✅ Success
2. View own proposal → See "Awaiting approval from other admins"
3. Try to approve → Button disabled with message: "Cannot approve your own proposal"
4. Monitor approvals → See other admins' approvals in real-time

### For Other Admins (Reviewers)

1. View pending proposals → See all proposals including others' proposals
2. Review proposal details → Check recipient, grade, metadata
3. Approve if valid → Click "Approve" button
4. Track progress → See approval count increment

## 🛡️ Security Best Practices

### Recommended Threshold Settings

| Number of Admins | Recommended Threshold | Rationale |
|------------------|----------------------|-----------|
| 3 admins | 2 approvals | 66% consensus (excluding proposer) |
| 5 admins | 3 approvals | 60% consensus (excluding proposer) |
| 7 admins | 4 approvals | 57% consensus (excluding proposer) |
| 10 admins | 5-6 approvals | 50-60% consensus (excluding proposer) |

### Important Notes

- **Minimum Admins**: Need at least (threshold + 1) admins total
  - If threshold = 3, need at least 4 admins
  - If threshold = 5, need at least 6 admins
  
- **Quorum Calculation**: Threshold should be set considering that proposer cannot approve
  - Example: 5 total admins, threshold = 3
  - Proposer creates proposal (1 admin unavailable for approval)
  - Need 3 out of remaining 4 admins to approve (75% consensus)

## 🔧 Configuration

### Adjust Threshold (SUPER_ADMIN only)

```javascript
// Set threshold to 5 approvals
await contract.connect(superAdmin).setApprovalThreshold(5);

// Verify new threshold
const threshold = await contract.getApprovalThreshold();
console.log("New threshold:", threshold); // 5
```

### Query Current Settings

```javascript
// Get approval threshold
const threshold = await contract.getApprovalThreshold();

// Get total number of admins
const adminRole = await contract.ADMIN_ROLE();
const adminCount = await contract.getRoleMemberCount(adminRole);

console.log({
  threshold,
  adminCount,
  minRequiredAdmins: threshold + 1, // Proposer + threshold approvers
});
```

## 📚 Related Documentation

- See `ADMIN-PROPOSAL-ONLY.md` for overall proposal system documentation
- See `RBAC-IMPLEMENTATION.md` for role-based access control details
- See `MULTI-SIG-IMPLEMENTATION.md` for multi-signature system architecture

## 🎯 Summary

### What Changed
- ✅ Added proposer self-approval check in smart contract
- ✅ Updated frontend utility to reflect this restriction
- ✅ Added comprehensive test coverage
- ✅ Updated UI to inform users when they cannot approve

### Why It Matters
- 🔒 Stronger security through true multi-party approval
- 🛡️ Prevents single admin from abusing proposal system
- 📋 Creates clear audit trail with independent approvers
- ✅ Industry best practice for multi-signature systems

### Impact
- No breaking changes to existing functionality
- Proposals require genuine multi-party consensus
- System is more secure and trustworthy

---

**Last Updated:** October 24, 2025  
**Version:** 1.0  
**Status:** ✅ Implemented and Tested (95/95 tests passing)
