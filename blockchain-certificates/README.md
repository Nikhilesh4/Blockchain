# Blockchain Certificate System

A decentralized, secure, and transparent blockchain-based certificate issuance and verification system built on Ethereum. This system enables educational institutions and organizations to issue tamper-proof, verifiable digital certificates as NFTs with role-based access control and multi-signature approval mechanisms.


## Table of Contents

- [Overview](../../../../Downloads/README (1).md#-overview)
- [Features](../../../../Downloads/README (1).md#-features)
- [Architecture](../../../../Downloads/README (1).md#-architecture)
- [Prerequisites](../../../../Downloads/README (1).md#-prerequisites)
- [Installation](../../../../Downloads/README (1).md#-installation)
- [Configuration](../../../../Downloads/README (1).md#-configuration)
- [Running the Application](../../../../Downloads/README (1).md#-running-the-application)
- [Testing](../../../../Downloads/README (1).md#-testing)
- [Troubleshooting](../../../../Downloads/README (1).md#-troubleshooting)
- [Contributing](../../../../Downloads/README (1).md#-contributing)
## Overview

The Blockchain Certificate System is a full-stack decentralized application (dApp) that leverages blockchain technology to:

- **Issue** tamper-proof digital certificates as ERC-721 NFTs
- **Verify** certificate authenticity instantly
- **Manage** certificate lifecycle (issuance, verification, revocation)
- **Control** access through sophisticated role-based permissions (RBAC)
- **Approve** certificate issuance through multi-signature workflows
- **Store** certificate metadata on IPFS (Pinata) for permanent, decentralized storage

### Why Blockchain for Certificates?

Traditional digital certificates face several challenges:
- ❌ Easy to forge or tamper with
- ❌ Centralized verification systems can fail
- ❌ No global standard for verification
- ❌ Difficult to revoke fraudulent certificates

Our blockchain solution provides:
- ✅ **Immutability**: Certificates cannot be altered once issued
- ✅ **Transparency**: All issuances and revocations are publicly auditable
- ✅ **Decentralization**: No single point of failure
- ✅ **Instant Verification**: Anyone can verify authenticity in seconds
- ✅ **Soulbound**: Certificates are non-transferable (tied to recipient)
- ✅ **Revocable**: Fraudulent certificates can be revoked by authorized personnel

##  Features

### Core Features

1. **Certificate Minting (NFT Issuance)**
   - Mint certificates as ERC-721 NFTs
   - Upload certificate metadata to IPFS
   - Auto-generated certificate designs
   - Soulbound tokens (non-transferable)

2. **Certificate Verification**
   - Instant verification by token ID or wallet address
   - Check certificate validity and revocation status
   - Public verification endpoint (no wallet required)

3. **Role-Based Access Control (RBAC)**
   - **SUPER_ADMIN**: Full system control
   - **ADMIN**: Manage roles and create proposals
   - Hierarchical role management

4. **Multi-Signature Approval System**
   - Admins create certificate issuance proposals
   - Requires multiple approvals (default: 3) before execution
   - Prevents single-point-of-failure attacks
   - Full proposal lifecycle management

5. **IPFS Integration (Pinata)**
   - Decentralized storage for certificate metadata
   - Permanent, tamper-proof record keeping
   - Automatic JSON and image upload

6. **Certificate Lifecycle Management**
   - Issue certificates with complete metadata
   - Revoke compromised or fraudulent certificates
   - Track certificate history and status

7. **User Dashboards**
   - **Student Dashboard**: View owned certificates
   - **Admin Dashboard**: Manage roles, proposals, and system stats
   - **Issuer Dashboard**: Mint certificates directly

### Security Features

-  **Soulbound Tokens**: Certificates cannot be transferred (prevents fraud)
-  **Multi-sig Protection**: Critical operations require multiple approvals
-  **Pausable Contract**: Emergency pause functionality
-  **Access Control**: Granular permissions for all operations
-  **Event Logging**: Complete audit trail of all actions

##  Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (React)                    │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────┐│
│  │ User Dashboard │  │Admin Dashboard │  │   Issuer   ││
│  └────────────────┘  └────────────────┘  └────────────┘│
└──────────────────────┬──────────────────────────────────┘
                       │ ethers.js + Web3
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   MetaMask Wallet                        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Ethereum Blockchain (Sepolia)               │
│  ┌────────────────────────────────────────────────────┐ │
│  │         CertificateNFT Smart Contract              │ │
│  │  - ERC-721 Standard                                │ │
│  │  - Role-Based Access Control                       │ │
│  │  - Multi-Sig Approval System                       │ │
│  │  - Soulbound Implementation                        │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    IPFS (Pinata)                         │
│              Decentralized Storage                       │
│  - Certificate Metadata (JSON)                           │
│  - Certificate Images                                    │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

**Smart Contracts:**
- Solidity 0.8.28
- OpenZeppelin Contracts v5.4.0
- Hardhat 3.0.6

**Frontend:**
- React 18.2
- Ethers.js 6.15.0
- Vite 5.0 (Build tool)
- React Hot Toast (Notifications)

**Development Tools:**
- Hardhat (Development environment)
- Mocha & Chai (Testing)
- TypeScript 5.8
- dotenv (Environment management)

**Infrastructure:**
- Ethereum Sepolia Testnet
- IPFS (Pinata for storage)
- Infura (RPC provider)
- Etherscan (Contract verification)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
  ```bash
  node --version  # Should be v18+
  ```

- **npm** (v9.0.0 or higher) or **yarn**
  ```bash
  npm --version
  ```

- **Git**
  ```bash
  git --version
  ```

- **MetaMask** browser extension
  - [Install MetaMask](https://metamask.io/download/)

### Required Accounts

1. **Infura Account** (for Sepolia RPC)
   - Sign up at: https://infura.io
   - Create a new project
   - Copy your Project ID

2. **Pinata Account** (for IPFS)
   - Sign up at: https://pinata.cloud
   - Get API keys from Dashboard > API Keys

3. **Etherscan Account** (for contract verification)
   - Sign up at: https://etherscan.io
   - Get API key from Account > API Keys

4. **Sepolia Testnet ETH**
   - Get test ETH from: https://sepoliafaucet.com
   - Or: https://sepolia-faucet.pk910.de/

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Nikhilesh4/Blockchain.git
cd Blockchain/blockchain-certificates
```

### 2. Install Dependencies

**Backend (Smart Contracts):**

```bash
# Install root dependencies
npm install
```

**Frontend:**

```bash
# Navigate to frontend directory
cd frontend
npm install
cd ..
```

### 3. Verify Installation

```bash
# Check Hardhat
npx hardhat --version  # Should show: Hardhat 3.0.6

# Check all dependencies
npm list --depth=0
```

## Configuration

### 1. Backend Configuration (Root Directory)

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# ===================================
# SERVER CONFIGURATION
# ===================================
PORT=5000
NODE_ENV=development

# ===================================
# BLOCKCHAIN CONFIGURATION
# ===================================
# Update after deploying your contract
CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
RPC_URL=http://127.0.0.1:8545
NETWORK=localhost

# ===================================
# PINATA API CREDENTIALS
# ===================================
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_api_key

# ===================================
# ADMIN WALLET
# ===================================
# WARNING: Use test wallets only! Never expose real private keys
PRIVATE_KEY=your_private_key_without_0x_prefix
ADMIN_ADDRESSES=0xYourAdminAddress1,0xYourAdminAddress2

# Additional admin private keys (for multi-sig testing)
ISSUER_2_PRIVATE_KEY=second_admin_private_key_without_0x_prefix
ISSUER_3_PRIVATE_KEY=third_admin_private_key_without_0x_prefix

# ===================================
# SEPOLIA TESTNET CONFIGURATION
# ===================================
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
SEPOLIA_PRIVATE_KEY=your_sepolia_private_key_without_0x_prefix

# ===================================
# IPFS CONFIGURATION
# ===================================
IPFS_HOST=ipfs.infura.io
IPFS_PORT=5001
IPFS_PROTOCOL=https

# ===================================
# ETHERSCAN API (For contract verification)
# ===================================
ETHERSCAN_API_KEY=your_etherscan_api_key

# ===================================
# SECURITY
# ===================================
CORS_ORIGIN=http://localhost:3000,http://localhost:5000

```

### 2. Frontend Configuration

Create a `.env` file in the `frontend` directory:

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

```bash

```bash
# ===================================
# NETWORK CONFIGURATION
# ===================================

# FOR SEPOLIA TESTNET:
VITE_NETWORK_NAME=sepolia
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID

# FOR LOCALHOST TESTING:
# VITE_NETWORK_NAME=localhost
# VITE_CHAIN_ID=31337
# VITE_RPC_URL=http://127.0.0.1:8545

# ===================================
# CONTRACT ADDRESS
# ===================================
# Update after deploying your contract
VITE_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS

# Multi-sig contract address (if using separate multi-sig contract)
VITE_MULTISIG_CONTRACT_ADDRESS=YOUR_MULTISIG_CONTRACT_ADDRESS

# ===================================
# IPFS CONFIGURATION
# ===================================

# Pinata (Primary IPFS Provider)
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_API_KEY=your_pinata_secret_api_key

# NFT.Storage (Alternative IPFS Provider)
VITE_NFT_STORAGE_TOKEN=your_nft_storage_api_token

# Filebase (Fallback IPFS Provider)
VITE_FILEBASE_ACCESS_KEY=your_filebase_access_key
VITE_FILEBASE_SECRET_KEY=your_filebase_secret_key

# ===================================
# SEPOLIA TESTNET (Optional)
# ===================================
# Alternative Sepolia RPC endpoint
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID

```

### 3. MetaMask Configuration

#### Add Sepolia Testnet to MetaMask:

1. Open MetaMask
2. Click network dropdown → "Add Network"
3. Click "Add a network manually"
4. Enter details:
   - **Network Name**: Sepolia Testnet
   - **RPC URL**: `https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID`
   - **Chain ID**: `11155111`
   - **Currency Symbol**: `ETH`
   - **Block Explorer**: `https://sepolia.etherscan.io`

#### Get Sepolia Test ETH:

1. Copy your MetaMask wallet address
2. Visit: https://sepoliafaucet.com
3. Paste address and request test ETH
4. Wait 1-2 minutes for confirmation

## Running the Application

### Option 1: Local Development (Localhost)

#### Step 1: Start Hardhat Node

```bash
# Terminal 1: Start local blockchain
npx hardhat node

# This will:
# - Start a local Ethereum node on http://127.0.0.1:8545
# - Display 20 test accounts with private keys
# - Auto-mine blocks
```

Keep this terminal running.

#### Step 2: Deploy Contract Locally

```bash
# Terminal 2: Deploy to localhost
npm run deploy

# Output will show:
#  Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
#  Deployment info saved to: ./deployments/localhost.json
```

#### Step 3: Setup Roles (Important!)

```bash
# Terminal 2: Setup roles after deployment
npx hardhat run scripts/setupRoles.js --network localhost

# This will:
# - Read role configuration from config/roles.json
# - Assign SUPER_ADMIN and ADMIN roles
# - Verify all role assignments
# - Save assignment records to logs/role-assignments.json
```

**Configure Roles** (Optional - edit `config/roles.json`):

```json
{
  "superAdmins": [],
  "admins": ["0xYourAdminAddress"],
  "issuers": ["0xYourIssuerAddress"],
  "revokers": ["0xYourRevokerAddress"],
  "verifiers": ["0xYourVerifierAddress"]
}
```

#### Step 4: Update Frontend Config

Update `frontend/.env`:

```bash
VITE_NETWORK_NAME=localhost
VITE_CHAIN_ID=31337
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

#### Step 5: Start Frontend

```bash
# Terminal 3: Start React app
npm run frontend

# Or:
cd frontend
npm run dev

# Frontend will open at: http://localhost:5173
```

#### Step 6: Connect MetaMask to Localhost

1. Open MetaMask
2. Add Network:
   - **Network Name**: Hardhat Localhost
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`

3. Import test account:
   - Copy a private key from Hardhat node output
   - MetaMask → Import Account → Paste private key
   -  Use test accounts only!

### Option 2: Sepolia Testnet (Production-like)

#### Step 1: Compile Contracts

```bash
npm run compile

# Compiles contracts and generates artifacts
```

#### Step 2: Deploy to Sepolia

```bash
npm run deploy:sepolia

# Output:
#  Network: Sepolia Testnet
#  Deployer: 0xYourAddress
#  Balance: 0.5 ETH
#  Contract Address: 0x...
#  Etherscan: https://sepolia.etherscan.io/address/0x...
```

Copy the contract address from the output.

#### Step 3: Setup Roles (Important!)

```bash
# Setup roles for deployed contract
npx hardhat run scripts/setupRoles.js --network sepolia

# This will:
# - Read role configuration from config/roles.json
# - Assign roles to configured addresses
# - Verify all assignments on Sepolia
# - Save records to logs/role-assignments.json
```

**Before running, configure roles** in `config/roles.json`:

```json
{
  "superAdmins": ["0xYourSuperAdminAddress"],
  "admins": ["0xAdmin1", "0xAdmin2", "0xAdmin3"],
  "issuers": ["0xIssuer1", "0xIssuer2"],
  "revokers": ["0xRevoker1"],
  "verifiers": ["0xVerifier1", "0xVerifier2"]
}
```

**Note:** Make sure to add at least 3 admin addresses for the multi-signature approval system to work properly (default threshold is 3 approvals).

#### Step 4: Verify Contract on Etherscan (Optional)

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <DEPLOYER_ADDRESS>

# Example:
npx hardhat verify --network sepolia 0x123... 0xYourAddress
```

#### Step 4: Update Frontend Config

Update `frontend/.env`:

```bash
VITE_CONTRACT_ADDRESS=<YOUR_DEPLOYED_CONTRACT_ADDRESS>
```

#### Step 5: Start Frontend

```bash
npm run frontend

# Frontend at: http://localhost:5173
```

#### Step 6: Connect MetaMask

1. Switch MetaMask to Sepolia network
2. Ensure you have test ETH
3. Connect wallet on the frontend

##  Testing

### Run All Tests

```bash
# Run complete test suite
npm test

# Output shows:
# - Deployment tests
# - Minting functionality
# - Soulbound behavior (transfer restrictions)
# - Verification tests
# - Revocation mechanism
# - Access control
# - RBAC tests
# - Multi-sig proposal tests
```

### Test Role-Based Access Control

After deploying and setting up roles, test the RBAC system:

```bash
# Test role functionality (works with localhost or Sepolia)
npx hardhat test test/roleTests.js

# This tests:
# - Role assignment and revocation
# - Permission checks for minting
# - Permission checks for revocation
# - Role hierarchy
# - Emergency role revocation
# - Batch role operations
# - Complete role workflow integration
```

**Important:** Run role tests after setting up roles to verify your configuration works correctly.

### Run Specific Test Suites

```bash
# Certificate tests only
npx hardhat test test/certificateTest.js

# Multi-sig tests only
npx hardhat test test/MultiSigCertificate.test.js

# Role-based access control tests
npx hardhat test test/roleTests.js
```

### Test Coverage

```bash
# Generate coverage report (if plugin installed)
npx hardhat coverage

# Coverage includes:
# - Line coverage
# - Statement coverage
# - Branch coverage
# - Function coverage
```

### Manual Testing Guide 

#### Test 1: Mint a Certificate


1. Connect wallet as an ADMIN or Super ADMIN.
2. Fill certificate form:
   - Recipient Name: John Doe
   - Recipient Address: 0x123... (any valid address)
   - Grade: A+
   - Issuer: Blockchain University
3. Create a mint proposal.
4. Have the required number of other ADMINs (Super ADMIN is also an ADMIN) approve the proposal (approval threshold is configurable — e.g., 2 or 3).
5. Proposal auto-executes and mints once the approval threshold is reached.
6. Wait for IPFS upload and blockchain confirmation.
7. Certificate should appear in "My Certificates".

> Note: SUPER_ADMIN can manage roles (grant/revoke ADMIN role) but cannot unilaterally execute multi-sig proposals. All proposals require the configured number of ADMIN approvals.

#### Test 2: Verify Certificate

1. Any user (no special role required) goes to "Verify Certificate".
2. Enter token ID (e.g., 1).
3. Click "Verify".
4. Should show:
   - ✅ Certificate is Valid (if not revoked)
   - Owner address
   - Minted timestamp
   - Metadata / IPFS URI

#### Test 3: Revoke Certificate (Disciplinary Action)

1. Connect wallet as SUPER_ADMIN.
2. In the main dashboard, locate the "Revoke Certificate" section (only visible to SUPER_ADMIN).
3. Enter the token ID of the certificate to revoke.
4. Provide a reason for revocation (e.g., "Fraudulent submission", "Academic misconduct", "Policy violation").
5. Click "Revoke Certificate" and approve the MetaMask transaction.
6. Certificate is immediately marked as revoked on the blockchain.
7. Verify the certificate now shows as revoked and invalid when verified.


#### Test 4: Role Management

1. Connect as SUPER_ADMIN.
2. Go to Admin Dashboard.
3. Grant or revoke the ADMIN role to addresses as needed.
4. Verify granted ADMIN addresses can create and approve proposals.

#### Test 5: Multi-Sig Proposal (Mint / Revoke)

1. Connect as an ADMIN user.
2. Create a mint or revoke proposal.
3. Have the configured number of other ADMINs approve the proposal.
4. Proposal auto-executes when threshold reached and performs the requested action.


---

##  Troubleshooting

### Frontend Connection Issues

#### Issue: "Frontend can't connect to contract"

This is the most common issue! Usually caused by not updating the contract address.

```bash
# 1. Verify VITE_CONTRACT_ADDRESS in frontend/.env is correct
# Check deployment output or deployments/localhost.json or deployments/sepolia.json

# 2. Make sure you updated frontend/.env with the NEW contract address
cat frontend/.env | grep VITE_CONTRACT_ADDRESS

# 3. Restart frontend dev server after changing .env
# Stop the server (Ctrl+C) then:
npm run frontend

# 4. Check MetaMask is on correct network (localhost or Sepolia)

# 5. Clear browser cache if needed
# Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
```

**Common mistake:** Using an old contract address from a previous deployment. Always copy the address from the latest deployment!

#### Issue: "Contract address not set"

```bash
# Update frontend/.env
VITE_CONTRACT_ADDRESS=0xYourDeployedAddress
# Restart dev server
npm run frontend
```

### Network & RPC Issues

#### Issue: "Network connection error"

```bash
# Check your RPC URL is correct
# Verify Infura project is active
# Try alternative RPC:
SEPOLIA_RPC_URL=https://rpc.sepolia.org
```

#### Issue: Wrong network selected in MetaMask

**Solution:**
- Click MetaMask network dropdown
- Select "Sepolia" or "Localhost"
- Refresh page

### Smart Contract Issues

#### Issue: "Contract deployment failed"

```bash
# Check gas settings in hardhat.config.ts
# Ensure you have enough ETH
# Try recompiling:
npm run compile
```

#### Issue: "Role setup script fails"

```bash
# Verify contract address in deployments/sepolia.json
# Check all addresses in config/roles.json are valid
# Ensure deployer has SUPER_ADMIN role
```

#### Issue: "Transaction reverts"

```bash
# Check if you have required role (ADMIN for proposals)
# Verify contract is not paused
# Ensure parameters are valid (addresses, token IDs)
# Check gas limit is sufficient
```

#### Issue: "Insufficient funds for gas"

```bash
# Solution: Get more test ETH
# Visit: https://sepoliafaucet.com
# Check balance:
npx hardhat run scripts/checkBalance.js --network sepolia
```

### MetaMask Issues

#### Issue: "Please install MetaMask" error

**Solution:**
```bash
# Install MetaMask extension
# Chrome: https://chrome.google.com/webstore/detail/metamask/
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/
```

#### Issue: "Nonce too high"

**Solution:**
```bash
# Reset MetaMask account
# Settings > Advanced > Reset Account
```

### Development Environment Issues

#### Issue: "Cannot find module '@openzeppelin/contracts'"

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Issue: Solidity version mismatch

**Solution:**
```bash
# Check hardhat.config.ts for correct version
# Should be: 0.8.28
npm run compile
```

### IPFS Issues

#### Issue: "Pinata API error"

**Solution:**
- Verify API keys in `.env` and `frontend/.env`
- Check Pinata dashboard for rate limits
- Ensure keys are active and have proper permissions
- Verify you haven't exceeded the free tier limits


## Additional Resources

### Documentation

- [Hardhat Documentation](https://hardhat.org/getting-started/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [React Documentation](https://react.dev/)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [Pinata Documentation](https://docs.pinata.cloud/)

### Learning Resources

- [Solidity by Example](https://solidity-by-example.org/)
- [CryptoZombies](https://cryptozombies.io/)
- [Ethereum.org Developer Resources](https://ethereum.org/developers)
- [Smart Contract Security](https://consensys.github.io/smart-contract-best-practices/)

### Tools

- [Sepolia Faucet](https://sepoliafaucet.com)
- [Etherscan Sepolia](https://sepolia.etherscan.io)
- [Remix IDE](https://remix.ethereum.org/)
- [Hardhat Network](https://hardhat.org/hardhat-network/)

