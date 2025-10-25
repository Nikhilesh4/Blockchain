# 🎓 Blockchain Certificate System

A decentralized, secure, and transparent blockchain-based certificate issuance and verification system built on Ethereum. This system enables educational institutions and organizations to issue tamper-proof, verifiable digital certificates as NFTs with role-based access control and multi-signature approval mechanisms.

[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-blue)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-3.0-yellow)](https://hardhat.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Testing](#-testing)
- [Complete Deployment Workflow](#-complete-deployment-workflow)
- [Smart Contract Details](#-smart-contract-details)
- [API Reference](#-api-reference)
- [Security Considerations](#-security-considerations)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

## 🌟 Overview

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

## ✨ Features

### Core Features

1. **🎫 Certificate Minting (NFT Issuance)**
   - Mint certificates as ERC-721 NFTs
   - Upload certificate metadata to IPFS
   - Auto-generated certificate designs
   - Soulbound tokens (non-transferable)

2. **✅ Certificate Verification**
   - Instant verification by token ID or wallet address
   - Check certificate validity and revocation status
   - Public verification endpoint (no wallet required)

3. **🔒 Role-Based Access Control (RBAC)**
   - **SUPER_ADMIN**: Full system control
   - **ADMIN**: Manage roles and create proposals
   - **ISSUER**: Direct certificate minting (with restrictions)
   - **REVOKER**: Revoke fraudulent certificates
   - **VERIFIER**: Read-only verification access
   - Hierarchical role management

4. **🤝 Multi-Signature Approval System**
   - Admins create certificate issuance proposals
   - Requires multiple approvals (default: 3) before execution
   - Prevents single-point-of-failure attacks
   - Full proposal lifecycle management

5. **🗃️ IPFS Integration (Pinata)**
   - Decentralized storage for certificate metadata
   - Permanent, tamper-proof record keeping
   - Automatic JSON and image upload

6. **🔄 Certificate Lifecycle Management**
   - Issue certificates with complete metadata
   - Revoke compromised or fraudulent certificates
   - Track certificate history and status

7. **💼 User Dashboards**
   - **Student Dashboard**: View owned certificates
   - **Admin Dashboard**: Manage roles, proposals, and system stats
   - **Issuer Dashboard**: Mint certificates directly

### Security Features

- 🛡️ **Soulbound Tokens**: Certificates cannot be transferred (prevents fraud)
- 🔐 **Multi-sig Protection**: Critical operations require multiple approvals
- ⏸️ **Pausable Contract**: Emergency pause functionality
- 🚫 **Access Control**: Granular permissions for all operations
- 📜 **Event Logging**: Complete audit trail of all actions

## 🏗️ Architecture

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

## 🔧 Prerequisites

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

## 📥 Installation

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

## ⚙️ Configuration

### 1. Backend Configuration (Root Directory)

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# ===================================
# SEPOLIA TESTNET CONFIGURATION
# ===================================

# Sepolia RPC URL (Get from Infura)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID

# Your MetaMask wallet private key (WITHOUT 0x prefix)
# ⚠️ NEVER share this! Use a test wallet only!
SEPOLIA_PRIVATE_KEY=your_metamask_private_key_here

# Etherscan API Key (for contract verification)
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# ===================================
# IPFS CONFIGURATION (PINATA)
# ===================================

PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_api_key

# ===================================
# LOCALHOST CONFIGURATION (For Testing)
# ===================================

CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
RPC_URL=http://127.0.0.1:8545
NETWORK=localhost
```

### 2. Frontend Configuration

Create a `.env` file in the `frontend` directory:

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

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

# ===================================
# IPFS CONFIGURATION
# ===================================
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_API_KEY=your_pinata_secret_api_key
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

## 🚀 Running the Application

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
# ✅ Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
# 📄 Deployment info saved to: ./deployments/localhost.json
```

#### Step 3: Setup Roles (Important!)

```bash
# Terminal 2: Setup roles after deployment
npx hardhat run scripts/setupRoles.js --network localhost

# This will:
# - Read role configuration from config/roles.json
# - Assign SUPER_ADMIN, ADMIN, ISSUER, REVOKER, VERIFIER roles
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
   - ⚠️ Use test accounts only!

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
# 📡 Network: Sepolia Testnet
# 👤 Deployer: 0xYourAddress
# 💰 Balance: 0.5 ETH
# ✅ Contract Address: 0x...
# 🔍 Etherscan: https://sepolia.etherscan.io/address/0x...
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

## 🧪 Testing

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

1. Connect wallet as deployer (has SUPER_ADMIN role)
2. Fill certificate form:
   - **Recipient Name**: John Doe
   - **Recipient Address**: 0x123... (any valid address)
   - **Grade**: A+
   - **Issuer**: Blockchain University
3. Click "Issue Certificate"
4. Approve MetaMask transaction
5. Wait for IPFS upload and blockchain confirmation
6. Certificate should appear in "My Certificates" section

#### Test 2: Verify Certificate

1. Go to "Verify Certificate" section
2. Enter token ID (e.g., `1`)
3. Click "Verify"
4. Should show:
   - ✅ Certificate is Valid
   - Owner address
   - Minted timestamp
   - Metadata URI

#### Test 3: Revoke Certificate

1. Connect as user with REVOKER_ROLE
2. Enter token ID to revoke
3. Enter reason for revocation
4. Click "Revoke"
5. Verify it now shows as revoked

#### Test 4: Role Management

1. Connect as SUPER_ADMIN
2. Go to Admin Dashboard
3. Grant ISSUER_ROLE to another address
4. Verify that address can now mint certificates

#### Test 5: Multi-Sig Proposal

1. Connect as ADMIN user
2. Create certificate proposal
3. Have 2+ other ADMINs approve
4. Certificate auto-mints when threshold reached

### Testing Checklist

- [ ] Contract deploys successfully
- [ ] Can connect wallet
- [ ] Can mint certificate (ISSUER/SUPER_ADMIN)
- [ ] Certificate appears in wallet
- [ ] Can verify certificate
- [ ] Cannot transfer certificate (soulbound)
- [ ] Can revoke certificate (REVOKER)
- [ ] Revoked certificate shows as invalid
- [ ] Role management works
- [ ] Proposal system requires approvals
- [ ] IPFS upload succeeds
- [ ] Events are emitted correctly

## 🚀 Complete Deployment Workflow

### 📋 Deployment Overview

This section provides complete step-by-step instructions for deploying the Blockchain Certificate System to **both localhost** and **Sepolia testnet**.

---

## 🏠 Option 1: Local Development Deployment

### Prerequisites for Local Deployment

- Node.js and npm installed
- MetaMask browser extension
- Repository cloned and dependencies installed

### Local Deployment Steps

#### 1. Start Local Blockchain

```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Output:
# Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
# 
# Accounts:
# Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
# Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
# [... more accounts ...]

# Keep this terminal running!
```

#### 2. Deploy Contract

```bash
# Terminal 2: Deploy to localhost
npm run deploy

# Expected Output:
# 🚀 Starting deployment...
# 📡 Network: Localhost
# 👤 Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
# 💰 Balance: 10000.0 ETH
# 📦 Deploying CertificateNFT contract...
# ✅ Contract Deployed Successfully!
# 📍 Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
# 📄 Deployment info saved to: ./deployments/localhost.json

# IMPORTANT: Copy the contract address!
```

#### 3. Setup Roles

Configure roles in `config/roles.json`:

```json
{
  "superAdmins": [],
  "admins": ["0x70997970C51812dc3A010C7d01b50e0d17dc79C8"],
  "issuers": ["0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"],
  "revokers": ["0x90F79bf6EB2c4f870365E785982E1f101E93b906"],
  "verifiers": ["0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"]
}
```

Then run the setup script:

```bash
npx hardhat run scripts/setupRoles.js --network localhost

# Expected Output:
# ╔═══════════════════════════════════════════════════════════════╗
# ║                 ROLE SETUP SCRIPT                             ║
# ╚═══════════════════════════════════════════════════════════════╝
# 
# 📡 Network: localhost
# 📍 Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
# 👤 Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
# 
# 1️⃣  SUPER_ADMIN Role Assignment
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#    ⚠️  No SUPER_ADMIN addresses configured
# 
# 2️⃣  ADMIN Role Assignment
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#    ✅ ADMIN granted successfully!
# 
# [... continues for all roles ...]
# 
# ╔═══════════════════════════════════════════════════════════════╗
# ║                   SETUP COMPLETE                              ║
# ╚═══════════════════════════════════════════════════════════════╝
# 
# ✅ Total roles assigned: 4
# 🎉 All roles assigned successfully!
```

#### 4. Test Roles

```bash
# Verify role configuration
npx hardhat test test/roleTests.js

# Expected: All tests pass ✓
```

#### 5. Update Frontend Config

**⚠️ IMPORTANT:** After deployment, you MUST update the contract address in your frontend configuration!

The contract address from deployment output (Step 2) needs to be added to `frontend/.env`:

```bash
VITE_NETWORK_NAME=localhost
VITE_CHAIN_ID=31337
VITE_RPC_URL=http://127.0.0.1:8545

# ⚠️ UPDATE THIS with your deployed contract address!
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_API_KEY=your_pinata_secret_api_key
```

**How to find the contract address:**
- Look for "Contract Address: 0x..." in deployment output
- Or check `deployments/localhost.json` file
- Copy the exact address (with 0x prefix)

#### 6. Start Frontend

```bash
# Terminal 3: Start React app
npm run frontend

# Output:
#   VITE v5.0.0  ready in 500 ms
#   ➜  Local:   http://localhost:5173/
#   ➜  Network: use --host to expose

# Frontend is now running!
```

#### 7. Configure MetaMask for Localhost

1. Open MetaMask
2. Click network dropdown → "Add Network" → "Add a network manually"
3. Enter details:
   - **Network Name**: Hardhat Localhost
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`

4. Import test account:
   - Click account icon → "Import Account"
   - Paste private key from Hardhat node output
   - ⚠️ **NEVER use these accounts for real funds!**

#### 8. Test the Application

1. Open http://localhost:5173
2. Connect MetaMask wallet
3. Try minting a certificate
4. Verify certificate
5. Test role-based permissions

### ✅ Local Deployment Complete!

Your local blockchain certificate system is now running. You can:
- Issue certificates
- Verify certificates
- Test all features locally
- Develop and test new features

---

## 🌐 Option 2: Sepolia Testnet Deployment

### Prerequisites for Sepolia Deployment

- Infura account with Project ID
- MetaMask wallet with Sepolia ETH
- Pinata account for IPFS
- Etherscan API key (optional, for verification)

### Sepolia Deployment Steps

#### 1. Configure Environment

Create `.env` file in root directory:

```bash
# Sepolia Network Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
SEPOLIA_PRIVATE_KEY=your_metamask_private_key_without_0x_prefix

# Contract Verification (Optional)
ETHERSCAN_API_KEY=your_etherscan_api_key

# IPFS Storage
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_api_key
```

**⚠️ Security Warning:**
- NEVER commit `.env` file to Git
- Use a test wallet for deployments
- Keep private keys secure

#### 2. Get Sepolia Test ETH

Visit these faucets to get test ETH:

- **Alchemy Faucet**: https://sepoliafaucet.com
- **PoW Faucet**: https://sepolia-faucet.pk910.de/
- **Infura Faucet**: https://www.infura.io/faucet/sepolia

Check your balance:

```bash
npx hardhat run scripts/checkBalance.js --network sepolia
```

You need at least **0.05 ETH** for deployment and role setup.

#### 3. Compile Contracts

```bash
npm run compile

# Expected Output:
# Compiled 15 Solidity files successfully
# 
# Check artifacts in ./artifacts/contracts/
```

#### 4. Deploy to Sepolia

```bash
npm run deploy:sepolia

# Expected Output:
# 🚀 Starting deployment...
# ══════════════════════════════════════════════════════
# 📡 Network: Sepolia Testnet (sepolia)
# ══════════════════════════════════════════════════════
# 
# 👤 Deployer Information:
#    Address: 0xYourAddress
#    Balance: 0.15 ETH
# 
# 📦 Deploying CertificateNFT contract...
# ⏳ Waiting for deployment transaction...
# 
# ✅ Contract Deployed Successfully!
# ══════════════════════════════════════════════════════
# 📍 Contract Address: 0xABCDEF1234567890ABCDEF1234567890ABCDEF12
# 🔗 Transaction Hash: 0x...
# ⛽ Gas Used: 4523156
# 🔍 Explorer: https://sepolia.etherscan.io/address/0xABCD...
# ══════════════════════════════════════════════════════
# 
# ⏳ Waiting for 6 block confirmations...
# ✅ Confirmations received!
# 
# 📋 Contract Details:
#    Name: CertificateNFT
#    Symbol: CERT
#    Owner: 0xYourAddress
#    Total Minted: 0
# 
# 💾 Saving deployment artifacts...
# 📄 Deployment info saved to: ./deployments/sepolia.json
# 📄 ABI saved to: ./deployments/abi/CertificateNFT.json
# 
# ══════════════════════════════════════════════════════
# 🎉 DEPLOYMENT COMPLETE!
# ══════════════════════════════════════════════════════

# ⚠️ IMPORTANT: Copy and save the contract address!
```

#### 5. Configure Roles

Edit `config/roles.json` with your wallet addresses:

```json
{
  "superAdmins": [
    "0xYourSuperAdminAddress"
  ],
  "admins": [
    "0xAdmin1Address",
    "0xAdmin2Address",
    "0xAdmin3Address"
  ],
  "issuers": [
    "0xIssuer1Address",
    "0xIssuer2Address"
  ],
  "revokers": [
    "0xRevokerAddress"
  ],
  "verifiers": [
    "0xVerifier1Address",
    "0xVerifier2Address"
  ]
}
```

**Important Notes:**
- Add **at least 3 admin addresses** for multi-sig approval system
- Default approval threshold is 3
- SuperAdmins can mint directly
- Admins must use proposal system for minting

#### 6. Setup Roles

```bash
npx hardhat run scripts/setupRoles.js --network sepolia

# Expected Output:
# ╔═══════════════════════════════════════════════════════════════╗
# ║                 ROLE SETUP SCRIPT                             ║
# ╚═══════════════════════════════════════════════════════════════╝
# 
# 📡 Network: sepolia
# 📍 Contract Address: 0xABCDEF1234567890ABCDEF1234567890ABCDEF12
# 👤 Deployer: 0xYourAddress
# 
# Deployer SUPER_ADMIN status: ✅ ASSIGNED
# 
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1️⃣  SUPER_ADMIN Role Assignment
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 
#    ⏳ Granting SUPER_ADMIN to 0xYourSuperAdminAddress...
#    ✅ SUPER_ADMIN granted successfully!
#    📝 Transaction: 0x...
# 
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2️⃣  ADMIN Role Assignment
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 
#    ⏳ Granting ADMIN to 0xAdmin1Address...
#    ✅ ADMIN granted successfully!
#    📝 Transaction: 0x...
# 
# [... continues for all configured roles ...]
# 
# ╔═══════════════════════════════════════════════════════════════╗
# ║                 VERIFICATION SUMMARY                          ║
# ╚═══════════════════════════════════════════════════════════════╝
# 
# Verifying all role assignments...
# 
# 👤 Deployer: 0xYourAddress
#    ✅ 0xYourAddress: SUPER_ADMIN - ASSIGNED
# 
# [... verification for all roles ...]
# 
# ╔═══════════════════════════════════════════════════════════════╗
# ║                   SETUP COMPLETE                              ║
# ╚═══════════════════════════════════════════════════════════════╝
# 
# ✅ Total roles assigned: 8
# ⏭️  Total skipped (already assigned): 1
# ❌ Total failed: 0
# 
# 📋 Role assignment records saved to: logs/role-assignments.json
# 📝 Configuration file: config/roles.json
# 
# 🎉 All roles assigned successfully!
```

#### 7. Test Roles

```bash
# Verify all role configurations work
npx hardhat test test/roleTests.js

# Expected Output:
# CertificateNFT - Role-Based Access Control
#   Deployment and Initial Roles
#     ✓ Should assign SUPER_ADMIN_ROLE to deployer
#     ✓ Should assign DEFAULT_ADMIN_ROLE to deployer
#     ✓ Should set up role hierarchy correctly
# 
#   Role Assignment
#     ✓ Should allow SUPER_ADMIN to grant ADMIN_ROLE
#     ✓ Should allow ADMIN to grant ISSUER_ROLE
#     [... more tests ...]
# 
# 45 passing (5s)

# All tests should pass ✓
```

#### 8. Verify Contract on Etherscan (Optional)

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <DEPLOYER_ADDRESS>

# Example:
npx hardhat verify --network sepolia \
  0xABCDEF1234567890ABCDEF1234567890ABCDEF12 \
  0xYourDeployerAddress

# Expected Output:
# Successfully submitted source code for contract
# contracts/CertificateNFT.sol:CertificateNFT at 0xABCD...
# for verification on the block explorer. Waiting for verification result...
# 
# Successfully verified contract CertificateNFT on Etherscan.
# https://sepolia.etherscan.io/address/0xABCD...#code
```

**Benefits of Verification:**
- ✅ Source code visible on Etherscan
- ✅ Users can verify contract authenticity
- ✅ Enables contract interaction via Etherscan UI
- ✅ Increases trust and transparency

#### 9. Update Frontend Configuration

**⚠️ CRITICAL:** After deploying to Sepolia, you MUST update the contract address in your frontend configuration!

Update `frontend/.env` with your deployed contract address:

```bash
# Network Configuration
VITE_NETWORK_NAME=sepolia
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID

# ⚠️ REPLACE THIS with your actual deployed contract address from Step 4!
VITE_CONTRACT_ADDRESS=0xABCDEF1234567890ABCDEF1234567890ABCDEF12

# IPFS Configuration
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_API_KEY=your_pinata_secret_api_key
```

**How to find your contract address:**
1. Look in the deployment output from Step 4: "Contract Address: 0x..."
2. Or open `deployments/sepolia.json` and copy the `contractAddress` value
3. Or check your Etherscan link from the deployment output

**After updating:**
- Save the `frontend/.env` file
- Restart the frontend if it's already running: `Ctrl+C` then `npm run frontend`

#### 10. Start Frontend

```bash
npm run frontend

# Output:
#   VITE v5.0.0  ready in 800 ms
#   ➜  Local:   http://localhost:5173/
#   ➜  Network: use --host to expose
# 
# Frontend is ready on Sepolia testnet!
```

#### 11. Configure MetaMask for Sepolia

MetaMask should have Sepolia by default. If not:

1. Open MetaMask
2. Network dropdown → "Add Network"
3. Select "Sepolia" from popular networks, or add manually:
   - **Network Name**: Sepolia Testnet
   - **RPC URL**: `https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID`
   - **Chain ID**: `11155111`
   - **Currency Symbol**: `ETH`
   - **Block Explorer**: `https://sepolia.etherscan.io`

#### 12. Test Complete System

1. **Connect Wallet**
   - Open http://localhost:5173
   - Connect MetaMask (ensure Sepolia network selected)
   - Verify connection shows correct address

2. **Test Certificate Issuance**
   - Fill certificate form with student details
   - Upload or design certificate
   - Click "Issue Certificate"
   - Approve MetaMask transaction
   - Wait for confirmation
   - Certificate should appear in "My Certificates"

3. **Test Verification**
   - Go to "Verify Certificate" section
   - Enter token ID or wallet address
   - Click "Verify"
   - Should display certificate details and validity

4. **Test Role Permissions**
   - Try operations with different roles
   - Verify ISSUER can mint
   - Verify REVOKER can revoke
   - Verify ADMIN must use proposals

5. **Test Multi-Sig Proposals** (if ADMIN)
   - Create certificate proposal
   - Get 2+ other admins to approve
   - Certificate should auto-mint when threshold reached

### ✅ Sepolia Deployment Complete!

Your smart contract is now live on Sepolia testnet! You can:
- Issue real certificates on testnet
- Share with users for testing
- Verify on Etherscan
- Test all production features

---

## 📋 Deployment Checklist

Use this checklist to ensure successful deployment:

### Pre-Deployment
- [ ] Node.js and npm installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env` file)
- [ ] MetaMask installed and configured

### For Localhost
- [ ] Hardhat node running
- [ ] Contract deployed successfully
- [ ] Contract address saved
- [ ] **Contract address updated in `frontend/.env`** ⚠️
- [ ] Roles configured in `config/roles.json`
- [ ] Roles assigned via `setupRoles.js`
- [ ] Role tests pass
- [ ] Frontend running
- [ ] MetaMask connected to localhost
- [ ] Test certificate minted successfully

### For Sepolia
- [ ] Infura account created and Project ID obtained
- [ ] Pinata account created and API keys obtained
- [ ] Sepolia test ETH acquired (at least 0.05 ETH)
- [ ] `.env` file configured with all required keys
- [ ] Contracts compiled successfully
- [ ] Contract deployed to Sepolia
- [ ] Deployment transaction confirmed (6 blocks)
- [ ] Contract address saved
- [ ] **Contract address updated in `frontend/.env`** ⚠️ **CRITICAL**
- [ ] Roles configured in `config/roles.json` (3+ admins)
- [ ] Roles assigned via `setupRoles.js`
- [ ] All role assignments confirmed on Etherscan
- [ ] Role tests pass
- [ ] Contract verified on Etherscan (optional but recommended)
- [ ] Frontend restarted after `.env` update
- [ ] Frontend running and connected
- [ ] MetaMask connected to Sepolia
- [ ] Test certificate issuance works
- [ ] Test certificate verification works
- [ ] Multi-sig proposal system tested

### Post-Deployment
- [ ] Documentation updated with contract addresses
- [ ] Team members granted appropriate roles
- [ ] Backup of deployment info saved
- [ ] Contract address shared with stakeholders
- [ ] Monitoring set up for contract events

---

## 🚨 Troubleshooting Deployment Issues

### Common Issues and Solutions

#### Issue: "Insufficient funds for gas"

```bash
# Solution: Get more test ETH
# Visit: https://sepoliafaucet.com
# Check balance:
npx hardhat run scripts/checkBalance.js --network sepolia
```

#### Issue: "Network connection error"

```bash
# Check your RPC URL is correct
# Verify Infura project is active
# Try alternative RPC:
SEPOLIA_RPC_URL=https://rpc.sepolia.org
```

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

#### Issue: "Transaction reverts"

```bash
# Check if you have required role
# Verify contract is not paused
# Ensure parameters are valid
# Check gas limit is sufficient
```

### Getting Help

If you encounter issues:

1. Check the error message carefully
2. Verify all environment variables are set
3. Ensure you're on the correct network
4. Review the Troubleshooting section in README
5. Check Etherscan for transaction details
6. Open a GitHub issue with:
   - Error message
   - Steps to reproduce
   - Network used (localhost/sepolia)
   - Contract address (if deployed)

---

## 📊 Deployment Summary

After successful deployment, you'll have:

1. **Smart Contract** deployed and verified on Sepolia
2. **Role System** configured with SUPER_ADMIN, ADMIN, ISSUER, REVOKER, VERIFIER
3. **Multi-Sig Approval** system ready with 3+ admins
4. **Frontend Application** connected and running
5. **IPFS Storage** integrated via Pinata
6. **Complete Testing** suite verified

### Next Steps

- 📝 Document contract addresses for your team
- 👥 Grant roles to additional team members
- 🎓 Start issuing certificates
- 📈 Monitor contract events on Etherscan
- 🔒 Ensure proper key management practices
- 🧪 Continue testing all features

**Congratulations! Your Blockchain Certificate System is now live! 🎉**

## 📜 Smart Contract Details

### CertificateNFT.sol

The main smart contract implementing the certificate system.

#### Key Functions:

**Minting:**
```solidity
function mintCertificate(address recipient, string memory _tokenURI) 
    external returns (uint256)
```
- Mints new certificate NFT
- Requires ISSUER_ROLE or SUPER_ADMIN
- Emits `CertificateMinted` event
- Returns token ID

**Verification:**
```solidity
function verifyCertificate(uint256 tokenId) 
    public view returns (bool isValid)
```
- Checks if certificate exists and is not revoked
- Public function (anyone can call)
- No gas cost (view function)

**Revocation:**
```solidity
function revokeCertificate(uint256 tokenId) external
```
- Revokes a certificate
- Requires REVOKER_ROLE or higher
- Cannot be undone
- Emits `CertificateRevoked` event

**Multi-Sig Proposals:**
```solidity
function createProposal(
    address recipient,
    string memory recipientName,
    string memory grade,
    string memory metadataURI
) external returns (uint256)
```
- Creates certificate issuance proposal
- Requires ADMIN_ROLE
- Returns proposal ID

```solidity
function approveProposal(uint256 proposalId) external
```
- Approves a proposal
- Requires ADMIN_ROLE
- Auto-executes when threshold reached

**Role Management:**
```solidity
function grantRole(bytes32 role, address account) public
```
- Grants role to address
- SUPER_ADMIN can grant: ADMIN, ISSUER, REVOKER, VERIFIER
- ADMIN can grant: ISSUER, REVOKER, VERIFIER

### Role Hierarchy

```
DEFAULT_ADMIN_ROLE (Contract Deployer)
    ↓
SUPER_ADMIN_ROLE
    ↓
ADMIN_ROLE
    ↓
ISSUER_ROLE / REVOKER_ROLE / VERIFIER_ROLE
```

### Events

```solidity
event CertificateMinted(uint256 indexed tokenId, address indexed recipient, string tokenURI);
event CertificateRevoked(uint256 indexed tokenId, address indexed revoker);
event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address indexed recipient, string metadataURI);
event ProposalApproved(uint256 indexed proposalId, address indexed approver, uint256 approvalCount);
event ProposalExecuted(uint256 indexed proposalId, uint256 indexed tokenId, address indexed recipient);
```

### Contract Addresses

| Network | Contract Address | Explorer |
|---------|-----------------|----------|
| Localhost | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | N/A |
| Sepolia | Check `deployments/sepolia.json` | [Etherscan](https://sepolia.etherscan.io) |

## 🔗 API Reference

### Frontend Hooks

#### `useMintCertificate()`

```javascript
const { mintCertificate, isLoading, progress, uploadProgress } = useMintCertificate();

await mintCertificate({
  recipientAddress: "0x123...",
  recipientName: "John Doe",
  grade: "A+",
  issuer: "University",
  description: "Blockchain Course"
});
```

#### `useVerifyCertificate()`

```javascript
const { verifyCertificate, isLoading } = useVerifyCertificate();

const result = await verifyCertificate(tokenId);
// Returns: { isValid, owner, mintedAt, uri }
```

#### `useRevokeCertificate()`

```javascript
const { revokeCertificate, isLoading } = useRevokeCertificate();

await revokeCertificate(tokenId, reason);
```

### IPFS Functions

#### Upload Certificate to IPFS

```javascript
import { uploadCertificateToIPFS } from './utils/ipfsUpload';

const ipfsHash = await uploadCertificateToIPFS(certificateData);
// Returns: "QmXxx..."
```

### Contract Interaction

```javascript
import { ethers } from 'ethers';
import CertificateABI from './contracts/CertificateNFT.json';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contract = new ethers.Contract(
  CONTRACT_ADDRESS,
  CertificateABI,
  signer
);

// Mint certificate
const tx = await contract.mintCertificate(
  recipientAddress,
  ipfsURI
);
await tx.wait();

// Verify certificate
const isValid = await contract.verifyCertificate(tokenId);

// Get certificate details
const [owner, mintedAt, revoked, uri] = await contract.getCertificateDetails(tokenId);
```

## 🔒 Security Considerations

### Smart Contract Security

1. **Soulbound Implementation**
   - Certificates are non-transferable
   - Prevents secondary market trading
   - Maintains certificate integrity

2. **Access Control**
   - Role-based permissions for all operations
   - Hierarchical role management
   - Prevents unauthorized actions

3. **Multi-Sig Protection**
   - Multiple approvals required for critical operations
   - Prevents single-point-of-failure attacks
   - Configurable approval threshold

4. **Pausable Contract**
   - SUPER_ADMIN can pause in emergencies
   - Stops all minting/revocation during pause
   - Can be unpaused when safe

### Best Practices

**Private Key Management:**
- ⚠️ NEVER commit `.env` files to Git
- Use separate wallets for testing and production
- Use hardware wallets for production deployments
- Rotate keys regularly

**Environment Variables:**
- Keep `.env` files secure
- Use different keys for each environment
- Never expose private keys in frontend code
- Use backend proxy for sensitive operations

**IPFS/Pinata:**
- Frontend API keys are PUBLIC (exposed in browser)
- Use rate limiting and domain restrictions
- Consider backend proxy for uploads in production
- Implement API key rotation

**MetaMask:**
- Always verify transaction details before signing
- Check contract address and function being called
- Be wary of phishing sites
- Use hardware wallet for valuable accounts

### Audit Recommendations

Before production deployment:
- [ ] Professional smart contract audit
- [ ] Penetration testing
- [ ] Gas optimization review
- [ ] Frontend security audit
- [ ] Access control verification
- [ ] Emergency procedure documentation

## 🐛 Troubleshooting

### Common Issues

#### 1. MetaMask Connection Issues

**Problem:** "Please install MetaMask" error

**Solution:**
```bash
# Install MetaMask extension
# Chrome: https://chrome.google.com/webstore/detail/metamask/
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/
```

**Problem:** Wrong network selected

**Solution:**
- Click MetaMask network dropdown
- Select "Sepolia" or "Localhost"
- Refresh page

#### 2. Compilation Errors

**Problem:** "Cannot find module '@openzeppelin/contracts'"

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Problem:** Solidity version mismatch

**Solution:**
```bash
# Check hardhat.config.ts for correct version
# Should be: 0.8.28
npm run compile
```

#### 3. Deployment Issues

**Problem:** "Insufficient funds for gas"

**Solution:**
- Get more Sepolia ETH from faucet
- Check balance: https://sepoliafaucet.com

**Problem:** "Nonce too high"

**Solution:**
```bash
# Reset MetaMask account
# Settings > Advanced > Reset Account
```

#### 4. IPFS Upload Failures

**Problem:** "Pinata API error"

**Solution:**
- Verify API keys in `.env`
- Check Pinata dashboard for rate limits
- Ensure keys are active

#### 5. Frontend Issues

**Problem:** "Contract address not set"

**Solution:**
```bash
# Update frontend/.env
VITE_CONTRACT_ADDRESS=0xYourDeployedAddress
# Restart dev server
npm run dev
```

**Problem:** "Cannot read properties of undefined"

**Solution:**
- Check browser console for specific error
- Ensure MetaMask is connected
- Verify contract is deployed
- Check network matches frontend config

#### 6. Transaction Failures

**Problem:** "Transaction reverted"

**Solution:**
- Check if you have required role
- Verify you have enough ETH for gas
- Ensure contract is not paused
- Check function parameters are valid

### Debug Mode

Enable verbose logging:

```bash
# Root .env
DEBUG=true
LOG_LEVEL=verbose

# Frontend .env
VITE_DEBUG=true
```

### Get Help

If you're still stuck:

1. Check console logs (Browser DevTools)
2. Check terminal output
3. Review Hardhat logs
4. Check Etherscan for transaction details
5. Open GitHub issue with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)

## 📚 Additional Resources

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

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow Solidity style guide
- Write tests for new features
- Update documentation
- Ensure all tests pass
- Use meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: Nikhilesh
- **GitHub**: [@Nikhilesh4](https://github.com/Nikhilesh4)

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Hardhat team for development tools
- Ethereum Foundation for blockchain infrastructure
- Pinata for IPFS hosting
- React team for frontend framework

## 📞 Support

For support, questions, or feedback:

- 📧 Email: [Your email]
- 💬 GitHub Issues: [Open an issue](https://github.com/Nikhilesh4/Blockchain/issues)
- 📖 Documentation: This README

---

<div align="center">

**Built with ❤️ using Blockchain Technology**

[⬆ Back to Top](#-blockchain-certificate-system)

</div>
