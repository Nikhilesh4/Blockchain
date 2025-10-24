# Admin Proposal-Only System Implementation

## 🎯 Overview

This document describes the implementation of the **proposal-only workflow** for ADMINs. ADMINs can no longer directly mint certificates and must go through the multi-signature approval process.

## 🔐 Permission Model

### Direct Certificate Minting

| Role | Can Mint Directly? | Notes |
|------|-------------------|-------|
| **SUPER_ADMIN** | ✅ Yes | Can bypass proposal system for emergency minting |
| **ADMIN** | ❌ No | **MUST use proposal system** |
| **ISSUER** | ✅ Yes | Standard certificate issuance role |
| **REVOKER** | ❌ No | Can only revoke certificates |
| **VERIFIER** | ❌ No | Read-only access |

### Proposal System Access

| Role | Can Create Proposals? | Can Approve Proposals? | Can Execute Proposals? |
|------|----------------------|------------------------|------------------------|
| **SUPER_ADMIN** | ✅ Yes | ✅ Yes | ✅ Yes (manual override) |
| **ADMIN** | ✅ Yes | ✅ Yes | ✅ Yes (auto at threshold) |
| **ISSUER** | ❌ No | ❌ No | ❌ No |
| **REVOKER** | ❌ No | ❌ No | ❌ No |
| **VERIFIER** | ❌ No | ❌ No | ❌ No |

## 📝 Smart Contract Changes

### Modified `mintCertificate()` Function

```solidity
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
    
    // ... rest of minting logic
}
```

**Logic Explanation:**
1. First check: If user has ADMIN_ROLE but NOT SUPER_ADMIN_ROLE → **BLOCKED** ❌
2. Second check: User must have ISSUER_ROLE or higher → Continue ✅
3. Result: Only SUPER_ADMIN and ISSUER can mint directly

## 🖥️ Frontend Changes

### App.jsx Updates

The main application now conditionally renders different interfaces based on user role:

#### For SUPER_ADMIN Users
- Shows traditional "Issue New Certificate" form
- Direct minting (bypasses proposal system)
- Immediate certificate generation

```jsx
{userPermissions.isSuperAdmin && (
  <div className="card">
    <h2>📝 Issue New Certificate (Direct Mint - Super Admin Only)</h2>
    <form onSubmit={handleIssueCertificate}>
      {/* Direct mint form */}
    </form>
  </div>
)}
```

#### For ADMIN Users (without SUPER_ADMIN)
- Shows "Create Proposal" component
- Must generate certificate image and upload to IPFS
- Creates proposal that requires multi-sig approval
- Certificate only mints after threshold approvals reached

```jsx
{userPermissions.isAdmin && !userPermissions.isSuperAdmin && (
  <div className="card">
    <div style={{ background: '#fff3cd', ... }}>
      <p>ℹ️ <strong>Note for Admins:</strong> You must create a proposal for certificate issuance.</p>
    </div>
    <CreateProposal 
      contract={contract}
      currentAccount={account}
      userPermissions={userPermissions}
    />
  </div>
)}
```

## 🔄 Proposal Workflow for ADMINs

### Step 1: Create Proposal
1. ADMIN fills out certificate details (name, address, grade, etc.)
2. System generates certificate image in browser
3. Image is uploaded to IPFS (Pinata)
4. Metadata is created and uploaded to IPFS
5. Proposal is submitted to smart contract

### Step 2: Multi-Signature Approval
1. Proposal appears in "Pending" status
2. Other ADMINs can approve the proposal
3. Each approval is tracked on-chain
4. Approval count increments

### Step 3: Auto-Execution at Threshold
1. When approval threshold is reached (default: 3 approvals)
2. Certificate is **automatically minted** to recipient
3. Proposal status changes to "Executed"
4. NFT is transferred to recipient address

### Step 4: Verification
1. Recipient owns the certificate NFT
2. Certificate is visible in "My Certificates" view
3. Certificate can be verified by anyone using token ID

## 🎨 UI Components

### CreateProposal Component
- **Location:** `frontend/src/components/proposals/CreateProposal.jsx`
- **Features:**
  - Certificate data input form
  - Image generation preview
  - IPFS upload with progress bars
  - Proposal submission
  - Error handling and validation

### ProposalList Component
- **Location:** `frontend/src/components/proposals/ProposalList.jsx`
- **Features:**
  - View all proposals
  - Filter by status (Pending/Executed/Cancelled)
  - Filter by owner ("My Proposals")
  - Sort options (newest, oldest, most approved)

### ProposalCard Component
- **Location:** `frontend/src/components/proposals/ProposalCard.jsx`
- **Features:**
  - Displays proposal details
  - Shows approval progress
  - Action buttons (Approve/Revoke/Execute/Cancel)
  - Conditional rendering based on permissions

## ✅ Test Results

All 94 tests passing, including:

### Multi-Sig Proposal Tests (9 tests)
- ✅ Proposal creation by ADMIN
- ✅ Proposal approval tracking
- ✅ Auto-execution at threshold
- ✅ Threshold management
- ✅ Proposal queries

### Role-Based Access Tests (Updated)
- ✅ ISSUER can mint directly
- ✅ **ADMIN cannot mint directly** (new behavior)
- ✅ SUPER_ADMIN can mint directly
- ✅ REVOKER cannot mint
- ✅ VERIFIER cannot mint

## 🚀 Deployment Instructions

### 1. Deploy Updated Contract
```bash
cd blockchain-certificates
npx hardhat ignition deploy ./ignition/modules/CertificateNFT.ts --network localhost
```

### 2. Update Frontend Contract Address
Edit `frontend/.env`:
```
VITE_CONTRACT_ADDRESS=<new_contract_address>
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
```

### 4. Test the Workflow
1. Connect wallet with ADMIN role (not SUPER_ADMIN)
2. Verify "Create Proposal" form appears (not direct mint form)
3. Create a test proposal
4. Switch to another ADMIN account
5. Approve the proposal
6. Repeat until threshold reached
7. Verify certificate is minted automatically

## 📊 Approval Threshold Configuration

Default threshold: **3 approvals**

To change threshold (SUPER_ADMIN only):
```javascript
await contract.setApprovalThreshold(5); // Requires 5 approvals
```

To query current threshold:
```javascript
const threshold = await contract.getApprovalThreshold();
console.log(`Current threshold: ${threshold} approvals`);
```

## 🔧 Emergency Override

SUPER_ADMIN can still mint directly for emergency situations:
1. Connect with SUPER_ADMIN account
2. Traditional "Issue New Certificate" form appears
3. Fill out details and submit
4. Certificate mints immediately (no approval needed)

## 📋 Summary of Changes

### Contract Files
- ✅ `contracts/CertificateNFT.sol` - Updated `mintCertificate()` with ADMIN blocking
- ✅ `test/roleTests.js` - Updated test to verify ADMINs cannot mint directly

### Frontend Files
- ✅ `frontend/src/App.jsx` - Conditional rendering based on role
- ✅ `frontend/src/contracts/CertificateNFT.js` - Updated ABI with proposal functions

### New Components (Already Created)
- ✅ `frontend/src/components/proposals/CreateProposal.jsx`
- ✅ `frontend/src/components/proposals/ProposalList.jsx`
- ✅ `frontend/src/components/proposals/ProposalCard.jsx`
- ✅ `frontend/src/components/proposals/ProposalDetails.jsx`
- ✅ `frontend/src/utils/proposalUtils.js`
- ✅ `frontend/src/hooks/useMultiSigProposals.js`

## 🎓 Benefits of This Approach

1. **Security:** Prevents single ADMIN from minting fraudulent certificates
2. **Accountability:** All proposals are tracked on-chain with approver addresses
3. **Transparency:** Anyone can query proposals and see approval history
4. **Flexibility:** Threshold can be adjusted based on organization needs
5. **Emergency Access:** SUPER_ADMIN can still mint directly if needed
6. **ISSUER Efficiency:** Dedicated ISSUER role can mint directly for routine operations

## 🔍 Verification

To verify the system is working correctly:

1. **Check ADMIN cannot mint directly:**
   ```javascript
   // This should fail with error
   await contract.connect(adminAccount).mintCertificate(recipient, uri);
   // Error: "ADMINs must use proposal system. Only SUPER_ADMIN can mint directly."
   ```

2. **Check SUPER_ADMIN can mint directly:**
   ```javascript
   // This should succeed
   await contract.connect(superAdminAccount).mintCertificate(recipient, uri);
   // Success: Certificate minted immediately
   ```

3. **Check ISSUER can mint directly:**
   ```javascript
   // This should succeed
   await contract.connect(issuerAccount).mintCertificate(recipient, uri);
   // Success: Certificate minted immediately
   ```

4. **Check proposal workflow:**
   ```javascript
   // Create proposal
   await contract.connect(admin1).createProposal(recipient, name, address, grade, uri);
   
   // Approve proposals
   await contract.connect(admin2).approveProposal(proposalId);
   await contract.connect(admin3).approveProposal(proposalId);
   
   // At threshold, certificate auto-mints
   // Proposal status becomes "Executed"
   ```

## 📞 Support

For issues or questions:
- Review test files: `test/MultiSigCertificate.test.js` and `test/roleTests.js`
- Check proposal components in `frontend/src/components/proposals/`
- Review smart contract: `contracts/CertificateNFT.sol`

---

**Last Updated:** October 24, 2025
**Version:** 1.0
**Status:** ✅ All Tests Passing (94/94)
