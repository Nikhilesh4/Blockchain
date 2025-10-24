# 🚀 Multi-Signature Proposal System - Deployment Guide

Complete guide for deploying and using the multi-signature certificate issuance system.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Smart Contract Deployment](#smart-contract-deployment)
4. [Frontend Setup](#frontend-setup)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Usage Guide](#usage-guide)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The Multi-Signature Proposal System replaces single-admin certificate issuance with a collaborative approval process:

- **Admins create proposals** for certificate issuance
- **Multiple admins must approve** before minting
- **Configurable threshold** (default: 3 approvals required)
- **Auto-execution** when threshold is reached
- **Real-time updates** via contract events

###  System Flow

```
Admin 1: Create Proposal → Upload to IPFS → Submit to Contract
         ↓
Admin 2: Review & Approve → Sign Transaction
         ↓
Admin 3: Review & Approve → Sign Transaction
         ↓
Admin 4: Review & Approve → Auto-Execute → Certificate Minted! 🎉
```

---

## ✅ Prerequisites

### Required Software

- **Node.js** v18+ and npm
- **MetaMask** browser extension
- **Git** for version control

### Check Versions

```bash
node --version  # Should be v18+
npm --version   # Should be 8+
```

---

## 🔧 Smart Contract Deployment

### Step 1: Clean and Compile

```bash
cd blockchain-certificates
npx hardhat clean
npx hardhat compile
```

**Expected Output:**
```
Compiled 2 Solidity files with solc 0.8.28
```

### Step 2: Run Tests

```bash
npx hardhat test
```

**Expected Output:**
```
✔ 9 passing (multi-sig tests)
✔ 3 passing (counter tests)
```

### Step 3: Start Local Blockchain

```bash
npx hardhat node
```

**Keep this terminal running!** It will show:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

### Step 4: Deploy Contract (New Terminal)

```bash
npx hardhat run scripts/deploy.js --network localhost
```

**Save the contract address!** Example output:
```
CertificateNFT deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Step 5: Grant Admin Roles

```bash
npx hardhat run scripts/setupRoles.js --network localhost
```

This will:
- Grant ADMIN roles to specified addresses
- Set up role hierarchy
- Configure initial threshold (3 approvals)

---

## 🎨 Frontend Setup

### Step 1: Update Contract Address

Edit `frontend/.env`:

```env
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_API_KEY=your_pinata_secret_key
```

### Step 2: Update Contract ABI

After deployment, copy the new ABI:

```bash
cp artifacts/contracts/CertificateNFT.sol/CertificateNFT.json \
   frontend/src/contracts/CertificateNFT.json
```

### Step 3: Install Dependencies

```bash
cd frontend
npm install
```

### Step 4: Start Development Server

```bash
npm run dev
```

Access at: `http://localhost:5173`

---

## ⚙️ Configuration

### MetaMask Setup

1. **Add Localhost Network:**
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **Import Test Accounts:**
   
   Get private keys from `npx hardhat node` output and import into MetaMask.

### Admin Configuration

The contract needs multiple admin accounts for multi-sig to work:

1. **Primary Admin (Deployer):** Auto-granted SUPER_ADMIN_ROLE
2. **Additional Admins:** Grant via `setupRoles.js` or Admin Dashboard

**Minimum Requirement:** At least 3 admins for default threshold

---

## 🧪 Testing

### Smart Contract Tests

```bash
# Run all tests
npx hardhat test

# Run only multi-sig tests
npx hardhat test test/MultiSigCertificate.test.js

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```

### Frontend Manual Testing

1. **Connect Multiple MetaMask Accounts**
   - Import at least 3 admin accounts
   - Switch between accounts to test multi-sig

2. **Test Proposal Creation:**
   ```
   - Connect as Admin 1
   - Go to Admin Dashboard → Proposals
   - Click "Create Proposal"
   - Fill form and submit
   - Verify proposal appears in list
   ```

3. **Test Approval Process:**
   ```
   - Switch to Admin 2 account
   - View pending proposals
   - Click "Approve" on proposal
   - Switch to Admin 3 account
   - Approve again
   - Verify auto-execution at threshold
   ```

---

## 📚 Usage Guide

### For Admins: Creating Proposals

1. **Navigate to Admin Dashboard**
   - Click "🔐 Admin Dashboard" button
   - Go to "Proposals" tab

2. **Create New Proposal**
   - Click "Create Proposal" button
   - Fill in certificate details:
     - Recipient Name
     - Recipient Address (Ethereum address)
     - Grade (A+, A, B+, etc.)
     - Description (optional)
   - Click "Generate & Create Proposal"

3. **Wait for Processing**
   - Certificate image generated
   - Uploaded to IPFS
   - Metadata created and uploaded
   - Proposal submitted to blockchain

### For Admins: Approving Proposals

1. **View Pending Proposals**
   - Go to Proposals tab
   - Filter by "Pending"

2. **Review Proposal**
   - Click on proposal card
   - View certificate preview
   - Check recipient details

3. **Approve or Reject**
   - Click "✓ Approve" to approve
   - Proposal executes automatically at threshold
   - OR revoke approval if needed

### For Super Admins: Managing Threshold

1. **Go to Emergency Controls**
   - Admin Dashboard → Emergency Controls tab

2. **Change Approval Threshold**
   - Enter new threshold value (1-10)
   - Click "Update Threshold"
   - Confirm transaction

### Checking Proposal Status

- **Pending:** Awaiting approvals
- **In Progress:** Some approvals received
- **Approved:** Threshold reached, ready to execute
- **Executed:** Certificate minted ✅
- **Cancelled:** Proposal cancelled by Super Admin

---

## 🔍 Key Features

### 1. Proposal Creation

**Smart Contract Function:**
```solidity
function createProposal(
    address recipient,
    string memory recipientName,
    string memory grade,
    string memory metadataURI
) external returns (uint256 proposalId)
```

**React Component:** `CreateProposal.jsx`

### 2. Approval System

**Smart Contract Functions:**
```solidity
function approveProposal(uint256 proposalId) external
function revokeApproval(uint256 proposalId) external
```

**React Hook:** `useMultiSigProposals.js`

### 3. Auto-Execution

When `approvalCount >= approvalThreshold`:
- Proposal automatically executes
- Certificate minted to recipient
- Event emitted: `ProposalExecuted`

### 4. Threshold Management

**Smart Contract Function:**
```solidity
function setApprovalThreshold(uint256 newThreshold) external
// Only SUPER_ADMIN can call
```

---

## 🐛 Troubleshooting

### Contract Size Warning

**Problem:** `Contract code size exceeds 24576 bytes`

**Solution:** Optimizer is enabled in `hardhat.config.ts`:
```typescript
optimizer: {
  enabled: true,
  runs: 200
}
```

### MetaMask Connection Issues

**Problem:** "Please install MetaMask"

**Solutions:**
1. Install MetaMask extension
2. Refresh page after installation
3. Check browser compatibility

### Transaction Failures

**Problem:** "Transaction reverted"

**Common Causes:**
1. **Insufficient permissions:** Check if account has ADMIN role
2. **Already approved:** Can't approve same proposal twice
3. **Proposal executed:** Can't approve executed proposals
4. **Wrong network:** Ensure connected to localhost (chainId: 31337)

### IPFS Upload Failures

**Problem:** "Pinata IPFS not configured"

**Solution:**
1. Get API keys from [Pinata](https://pinata.cloud)
2. Add to `frontend/.env`:
   ```env
   VITE_PINATA_API_KEY=your_key
   VITE_PINATA_SECRET_API_KEY=your_secret
   ```
3. Restart frontend server

### Event Listeners Not Working

**Problem:** Proposals don't update in real-time

**Solution:**
1. Check console for WebSocket errors
2. Verify contract instance is correct
3. Refresh page to re-establish listeners

---

## 📊 Gas Optimization

The contract is optimized for:
- **Deployment:** ~2,500,000 gas
- **Create Proposal:** ~150,000 gas
- **Approve Proposal:** ~80,000 gas
- **Auto-Execute:** ~200,000 gas

---

## 🔒 Security Considerations

1. **Role-Based Access:**
   - Only ADMIN+ can create/approve proposals
   - Only SUPER_ADMIN can change threshold
   - Only SUPER_ADMIN can cancel proposals

2. **Double Approval Prevention:**
   - Each admin can approve only once per proposal
   - Enforced at contract level

3. **Reentrancy Protection:**
   - Uses OpenZeppelin's secure patterns
   - No external calls in critical functions

4. **Input Validation:**
   - All addresses validated
   - String lengths checked
   - Threshold bounds enforced (1-10)

---

## 📈 Monitoring

### View Proposal Statistics

```javascript
// Get total proposals
const count = await contract.getProposalCount();

// Get all proposal IDs
const allIds = await contract.getAllProposalIds();

// Get pending proposals
const pendingIds = await contract.getPendingProposals();

// Get proposal details
const proposal = await contract.getProposal(proposalId);
```

### Listen for Events

```javascript
contract.on("ProposalCreated", (proposalId, proposer, recipient, metadataURI) => {
  console.log(`Proposal #${proposalId} created by ${proposer}`);
});

contract.on("ProposalApproved", (proposalId, approver, approvalCount) => {
  console.log(`Proposal #${proposalId} approved by ${approver} (${approvalCount} total)`);
});

contract.on("ProposalExecuted", (proposalId, tokenId, recipient) => {
  console.log(`Proposal #${proposalId} executed! Certificate #${tokenId} minted to ${recipient}`);
});
```

---

## 🎓 Best Practices

1. **Minimum Admins:** Have at least `threshold + 1` admins
2. **Threshold Setting:** Start with 3, adjust based on team size
3. **Proposal Review:** Always preview certificate before approving
4. **Key Management:** Keep private keys secure, never share
5. **Regular Backups:** Export proposals data periodically

---

## 📞 Support

- **GitHub Issues:** [Report bugs](https://github.com/Nikhilesh4/Blockchain/issues)
- **Documentation:** Check inline comments in code
- **Tests:** Review test files for usage examples

---

## ✅ Success Checklist

Before going to production:

- [ ] All tests passing
- [ ] Contract deployed and verified
- [ ] At least 3 admin accounts configured
- [ ] Threshold set appropriately
- [ ] IPFS credentials configured
- [ ] Frontend connected to correct contract
- [ ] MetaMask configured for all admins
- [ ] Test proposal created and executed successfully
- [ ] Event listeners working
- [ ] Gas costs acceptable

---

## 🎉 Congratulations!

You've successfully deployed the Multi-Signature Proposal System! 

Your certificate issuance process is now:
- ✅ Secure with multi-party approval
- ✅ Transparent with on-chain proposals
- ✅ Traceable with complete audit history
- ✅ Decentralized with no single point of failure

**Next Steps:**
1. Create your first proposal
2. Test the approval workflow
3. Monitor gas usage
4. Adjust threshold if needed
5. Deploy to testnet/mainnet when ready

---

*Last Updated: October 24, 2025*
