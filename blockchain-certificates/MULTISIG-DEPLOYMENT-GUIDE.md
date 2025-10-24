# 🚀 Multi-Signature Proposal System - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying and using the multi-signature approval system for certificate issuance in your blockchain-based certificate management dApp.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Smart Contract Deployment](#smart-contract-deployment)
3. [Testing the Contract](#testing-the-contract)
4. [Frontend Integration](#frontend-integration)
5. [Configuration](#configuration)
6. [Usage Guide](#usage-guide)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- Node.js (v16 or higher)
- npm or yarn
- Hardhat
- MetaMask browser extension

### Dependencies
Already included in your project:
```json
{
  "dependencies": {
    "ethers": "^6.9.0",
    "react": "^18.2.0",
    "react-hot-toast": "^2.4.1"
  }
}
```

---

## Smart Contract Deployment

### Step 1: Compile the Contract

Navigate to your project root and compile:

```bash
cd blockchain-certificates
npx hardhat compile
```

Expected output:
```
Compiled 1 Solidity file successfully
```

### Step 2: Run Tests

Verify everything works correctly:

```bash
npx hardhat test test/MultiSigCertificate.test.js
```

You should see all tests passing:
```
  CertificateNFT - Multi-Signature Proposal System
    Proposal Creation
      ✓ Should allow ADMIN to create a proposal
      ✓ Should allow SUPER_ADMIN to create a proposal
      ✓ Should reject proposal creation from non-admin
      ... (and more)

  62 passing (3s)
```

### Step 3: Deploy to Local Network

Start a local Hardhat node in one terminal:

```bash
npx hardhat node
```

In another terminal, deploy the contract:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

**Important:** Save the contract address from the output:
```
CertificateNFT deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Step 4: Update Frontend Configuration

Update `frontend/src/utils/contract.js` with the new contract address:

```javascript
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Your deployed address
```

### Step 5: Update Contract ABI

After compilation, the ABI is automatically generated. Update it in your frontend:

```bash
cp artifacts/contracts/CertificateNFT.sol/CertificateNFT.json frontend/src/contracts/CertificateNFT.js
```

Or manually copy the `abi` array from the JSON file.

---

## Testing the Contract

### Interactive Testing with Hardhat Console

```bash
npx hardhat console --network localhost
```

Then run:

```javascript
const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
const [owner, admin1, admin2, admin3, recipient] = await ethers.getSigners();

// Get deployed contract
const contract = await CertificateNFT.attach("YOUR_CONTRACT_ADDRESS");

// Grant ADMIN roles
await contract.grantRole(ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")), admin1.address);
await contract.grantRole(ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")), admin2.address);
await contract.grantRole(ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")), admin3.address);

// Create a proposal
await contract.connect(admin1).createProposal(
  recipient.address,
  "John Doe",
  "A+",
  "ipfs://QmTest123"
);

// Check proposal
const proposal = await contract.getProposal(1);
console.log("Proposal created:", proposal);

// Approve proposal
await contract.connect(admin2).approveProposal(1);
await contract.connect(admin3).approveProposal(1); // This will auto-execute

// Verify certificate was minted
const owner = await contract.ownerOf(1);
console.log("Certificate owner:", owner);
```

---

## Frontend Integration

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Configure Environment Variables

Create `frontend/.env`:

```env
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_API_KEY=your_pinata_secret_key
```

### Step 3: Start Frontend

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### Step 4: Connect MetaMask

1. Open MetaMask
2. Add localhost network:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

3. Import test accounts from Hardhat:
   - Get private keys from Hardhat node output
   - Import into MetaMask

---

## Configuration

### Default Settings

The contract is deployed with these defaults:
- **Approval Threshold:** 3 admins
- **Roles:** SUPER_ADMIN, ADMIN, ISSUER, REVOKER, VERIFIER
- **Owner:** Deployer address (has SUPER_ADMIN role)

### Changing Approval Threshold

Only SUPER_ADMIN can change the threshold:

```javascript
// In contract console or frontend
await contract.setApprovalThreshold(5); // Require 5 approvals
```

Or use the Admin Dashboard:
1. Go to Admin Dashboard
2. Click "Emergency Controls" tab
3. Update threshold in "Approval Threshold Configuration" section

### Setting Up Admin Roles

#### Via Contract:
```javascript
const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
await contract.grantRole(ADMIN_ROLE, "0xAdminAddress");
```

#### Via Frontend:
1. Go to Admin Dashboard (as SUPER_ADMIN)
2. Click "Role Assignment" tab
3. Enter admin address
4. Select "ADMIN" role
5. Click "Grant Role"

---

## Usage Guide

### Creating a Certificate Proposal

#### For Admins:

1. **Navigate to Proposals Tab**
   - Open Admin Dashboard
   - Click "Proposals" tab
   - Click "➕ Create New Proposal"

2. **Fill in Certificate Details**
   - Recipient Name (e.g., "John Doe")
   - Recipient Address (Ethereum address)
   - Grade (A+, A, B+, etc.)
   - Issuer (optional, defaults to "Blockchain University")
   - Description (optional)

3. **Generate & Submit**
   - Click "🎨 Generate & Create Proposal"
   - Certificate image is generated automatically
   - Image and metadata are uploaded to IPFS
   - Proposal is submitted to blockchain
   - Wait for transaction confirmation

4. **Track Your Proposal**
   - Proposal appears in "My Proposals" filter
   - Status shows "Pending Approval"
   - Approval count: 0/3 (or your threshold)

### Approving Proposals

#### For Other Admins:

1. **View Pending Proposals**
   - Open Admin Dashboard → Proposals tab
   - See all pending proposals
   - Click on a proposal for details

2. **Review Certificate**
   - Check recipient details
   - View certificate preview
   - Verify metadata

3. **Approve**
   - Click "✓ Approve" button
   - Confirm transaction in MetaMask
   - Approval count increases

4. **Auto-Execution**
   - When threshold is reached (e.g., 3/3 approvals)
   - Certificate is automatically minted
   - Proposal status changes to "Executed"
   - Certificate NFT is sent to recipient

### Revoking Approval

If you change your mind before execution:

1. Find your approved proposal
2. Click "✗ Revoke My Approval"
3. Confirm transaction
4. Your approval is removed

### Manual Execution

If auto-execution is disabled or fails:

1. Go to approved proposal (3/3 or more approvals)
2. Click "🚀 Execute & Mint Certificate"
3. Confirm transaction
4. Certificate is minted

### Cancelling Proposals

Only SUPER_ADMIN can cancel:

1. Go to proposal details
2. Click "🗑️ Cancel Proposal"
3. Confirm cancellation
4. Proposal is permanently cancelled

---

## Workflow Example

### Complete Multi-Sig Certificate Issuance

```
Admin 1 (Alice)
  ↓
Creates proposal for "Bob" with grade "A+"
  ↓
Uploads certificate to IPFS
  ↓
Submits proposal to blockchain
  ↓
[Proposal #1 created]
  ↓
Admin 2 (Charlie) reviews and approves
  ↓
[Approval count: 1/3]
  ↓
Admin 3 (David) reviews and approves
  ↓
[Approval count: 2/3]
  ↓
Admin 4 (Eve) reviews and approves
  ↓
[Approval count: 3/3 - Threshold reached!]
  ↓
Smart contract automatically mints certificate
  ↓
NFT #1 sent to Bob's address
  ↓
[Certificate successfully issued]
```

---

## API Reference

### Smart Contract Functions

#### Proposal Management

```solidity
// Create a new proposal
function createProposal(
    address recipient,
    string memory recipientName,
    string memory grade,
    string memory metadataURI
) external returns (uint256 proposalId)

// Approve a proposal
function approveProposal(uint256 proposalId) external

// Revoke your approval
function revokeApproval(uint256 proposalId) external

// Execute approved proposal
function executeProposal(uint256 proposalId) external

// Cancel proposal (SUPER_ADMIN only)
function cancelProposal(uint256 proposalId) external
```

#### View Functions

```solidity
// Get proposal details
function getProposal(uint256 proposalId) external view returns (...)

// Get all proposal IDs
function getAllProposalIds() external view returns (uint256[] memory)

// Get pending proposals
function getPendingProposals() external view returns (uint256[] memory)

// Get proposal approvers
function getProposalApprovers(uint256 proposalId) external view returns (address[] memory)

// Check if address approved
function hasApproved(uint256 proposalId, address approver) external view returns (bool)

// Get approval threshold
function approvalThreshold() external view returns (uint256)
```

#### Configuration

```solidity
// Change approval threshold (SUPER_ADMIN only)
function setApprovalThreshold(uint256 newThreshold) external
```

### Frontend Hooks

#### useMultiSigProposals

```javascript
const {
  proposals,              // Array of all proposals
  approvalThreshold,      // Current threshold
  loading,               // Loading state
  loadingProposalId,     // Currently loading proposal
  userApprovals,         // User's approval status for each proposal
  createProposal,        // Function to create proposal
  approveProposal,       // Function to approve
  revokeApproval,        // Function to revoke approval
  executeProposal,       // Function to execute
  cancelProposal,        // Function to cancel
  changeThreshold,       // Function to change threshold
  getProposalApprovers,  // Function to get approvers
  refreshProposals,      // Function to refresh list
} = useMultiSigProposals(contract, currentAccount, userPermissions);
```

---

## Troubleshooting

### Common Issues

#### 1. Transaction Reverted: "Already approved"
**Solution:** You've already approved this proposal. Check in "My Approvals" or revoke your approval first.

#### 2. "Insufficient approvals"
**Solution:** Wait for more admins to approve. Current count must reach the threshold.

#### 3. "Proposal already executed"
**Solution:** This proposal has been completed. Check "Executed" filter to see past proposals.

#### 4. IPFS upload fails
**Solution:** 
- Check Pinata API keys in `.env` file
- Verify internet connection
- Try again after a few moments

#### 5. MetaMask "Transaction Rejected"
**Solution:** 
- Check you have enough ETH for gas
- Ensure you're on the correct network
- Try increasing gas limit

#### 6. "Must have ADMIN role or higher"
**Solution:** 
- Only ADMIN and SUPER_ADMIN can create/approve proposals
- Contact your SUPER_ADMIN to grant you ADMIN role

### Debugging Tips

#### Check Proposal Status

```javascript
const proposal = await contract.getProposal(proposalId);
console.log("Status:", {
  executed: proposal.executed,
  cancelled: proposal.cancelled,
  approvals: proposal.approvalCount.toString(),
  threshold: await contract.approvalThreshold()
});
```

#### Check Your Approval

```javascript
const hasApproved = await contract.hasApproved(proposalId, yourAddress);
console.log("You have approved:", hasApproved);
```

#### Check Approvers List

```javascript
const approvers = await contract.getProposalApprovers(proposalId);
console.log("Approvers:", approvers);
```

---

## Security Considerations

### Best Practices

1. **Threshold Selection**
   - Set threshold based on number of trusted admins
   - Recommended: 50-60% of total admins
   - Example: 3 out of 5 admins

2. **Admin Management**
   - Regularly review admin list
   - Remove inactive admins
   - Use emergency revoke for compromised accounts

3. **Proposal Review**
   - Always verify recipient details
   - Check certificate preview before approving
   - Ensure metadata is correct

4. **Emergency Procedures**
   - SUPER_ADMIN can cancel any proposal
   - SUPER_ADMIN can pause contract
   - Use emergency controls responsibly

### Smart Contract Security

- ✅ Reentrancy protection
- ✅ Role-based access control
- ✅ Input validation
- ✅ Event logging for audit trail
- ✅ Pausable functionality
- ✅ Non-transferable (soulbound) certificates

---

## Monitoring and Analytics

### View Proposal Statistics

In Admin Dashboard → Overview tab:
- Total Certificates Minted
- Pending Proposals
- Executed Proposals
- Current Approval Threshold

### Filter and Sort

In Proposals tab:
- **Filters:** All, Pending, Executed, Cancelled, My Proposals
- **Sort:** Newest First, Oldest First, Most Approvals, Least Approvals

### Real-Time Updates

The frontend automatically updates when:
- New proposal is created
- Proposal is approved
- Proposal is executed
- Proposal is cancelled
- Threshold is changed

---

## Advanced Features

### Batch Operations

(Future enhancement - not yet implemented)
```javascript
// Approve multiple proposals at once
await Promise.all([
  contract.approveProposal(1),
  contract.approveProposal(2),
  contract.approveProposal(3)
]);
```

### Delegation

(Future enhancement - not yet implemented)
```javascript
// Delegate your approval power temporarily
await contract.delegateApproval(delegateAddress, duration);
```

---

## Support and Resources

### Documentation
- Smart Contract: `contracts/CertificateNFT.sol`
- Tests: `test/MultiSigCertificate.test.js`
- Frontend Components: `frontend/src/components/proposals/`
- Utils: `frontend/src/utils/proposalUtils.js`

### Getting Help
- Review test cases for usage examples
- Check console logs for debugging
- Verify transaction on block explorer

---

## Changelog

### Version 2.0.0 - Multi-Sig Proposal System

**Added:**
- Multi-signature approval system for certificates
- Proposal creation, approval, and execution
- Configurable approval threshold
- Real-time proposal updates
- Admin dashboard proposals tab
- Comprehensive test suite

**Modified:**
- CertificateNFT.sol: Added proposal structs and functions
- AdminDashboard: Added proposals tab
- Contract ABI: Updated with new functions

**Security:**
- Prevention of double approvals
- Role-based proposal management
- Event logging for all actions
- Emergency cancellation by SUPER_ADMIN

---

## License

MIT License - See LICENSE file for details

---

## Conclusion

Your multi-signature approval system is now fully deployed and operational! This system provides:

✅ **Enhanced Security** - Multiple admins must approve  
✅ **Transparency** - All actions are logged on blockchain  
✅ **Flexibility** - Configurable threshold  
✅ **User-Friendly** - Easy-to-use interface  
✅ **Decentralized** - No single point of failure  

Happy certificate issuing! 🎓
