# Blockchain Certificate System - Complete Setup Guide

A complete blockchain-based certificate issuance system with soulbound NFTs, IPFS storage, and MetaMask integration.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Pinata IPFS Setup](#pinata-ipfs-setup)
4. [MetaMask Setup](#metamask-setup)
5. [Backend Configuration](#backend-configuration)
6. [Running the Application](#running-the-application)
7. [Testing Guide](#testing-guide)
8. [Issuing Your First Certificate](#issuing-your-first-certificate)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

Before starting, ensure you have:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **MetaMask** browser extension - [Install here](https://metamask.io/download/)
- **Pinata Account** (free tier works) - [Sign up here](https://app.pinata.cloud/register)
- **Git** (optional, for cloning)

---

## 🚀 Initial Setup

### Step 1: Install Dependencies

```bash
# Navigate to project directory
cd blockchain-certificates

# Install all dependencies
npm install
```

### Step 2: Verify Installation

```bash
# Check if Hardhat is installed
npx hardhat --version

# Should output: Hardhat version 3.x.x
```

---

## 🌐 Pinata IPFS Setup

### Step 1: Create Pinata Account

1. Go to [Pinata Cloud](https://app.pinata.cloud/register)
2. Sign up with your email
3. Verify your email address

### Step 2: Get API Keys

1. **Log in** to your Pinata account
2. Click on your **profile icon** (top right)
3. Go to **"API Keys"** from the dropdown
4. Click **"New Key"** button

### Step 3: Configure API Key Permissions

Set the following permissions:
- ✅ **pinFileToIPFS**
- ✅ **pinJSONToIPFS**
- ✅ **pinByHash** (optional)
- ✅ **unpin** (optional)

### Step 4: Create and Save API Key

1. Give your key a name (e.g., "Certificate System")
2. Click **"Create Key"**
3. **IMPORTANT**: Copy both keys immediately:
   - **API Key**: `YOUR_PINATA_API_KEY`
   - **API Secret**: `YOUR_PINATA_SECRET_API_KEY`
4. Store them safely - you won't see the secret again!

### Step 5: Verify Pinata Setup

```bash
# Create a test file
echo "Test upload" > test.txt

# Try uploading (replace with your keys)
curl -X POST "https://api.pinata.cloud/pinning/pinFileToIPFS" \
  -H "pinata_api_key: YOUR_PINATA_API_KEY" \
  -H "pinata_secret_api_key: YOUR_PINATA_SECRET_API_KEY" \
  -F "file=@test.txt"

# Clean up
rm test.txt
```

---

## 🦊 MetaMask Setup

### Step 1: Install MetaMask

1. Go to [MetaMask.io](https://metamask.io/download/)
2. Install the browser extension
3. Create a new wallet or import existing one
4. **IMPORTANT**: Save your Secret Recovery Phrase securely

### Step 2: Get Your Private Key

1. Open MetaMask
2. Click the **three dots** menu (⋮) → **Account Details**
3. Click **"Export Private Key"**
4. Enter your password
5. **Copy the private key** (starts with `0x`)
6. ⚠️ **NEVER share this key with anyone!**

### Step 3: Get Your Wallet Address

1. Open MetaMask
2. Your address is displayed at the top (starts with `0x`)
3. Click to copy it
4. Example: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

---

## ⚙️ Backend Configuration

### Step 1: Create Environment File

Create a `.env` file in the `backend` directory:

```bash
cd backend
touch .env
```

### Step 2: Configure Backend Environment

Open `backend/.env` and add:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Blockchain Configuration
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Pinata IPFS Configuration
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_API_KEY=your_pinata_secret_api_key_here

# Optional: Admin Authorization (comma-separated addresses)
# AUTHORIZED_ADMINS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Optional: Rate Limiting
# RATE_LIMIT_WHITELIST=127.0.0.1,::1
```

**Replace the Pinata keys** with your actual keys from Step 3.

### Step 3: Update Contract Address (After Deployment)

After deploying the contract (Step 5 below), update `CONTRACT_ADDRESS` in `.env` with the deployed address.

---

## 🏃 Running the Application

### Terminal 1: Start Local Blockchain

```bash
# From project root
npx hardhat node
```

**Expected Output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

**✅ Keep this terminal running!**

---

### Terminal 2: Deploy Smart Contract

```bash
# From project root (new terminal)
npx hardhat run scripts/deploy.js --network localhost
```

**Expected Output:**
```
🚀 Starting deployment...
==================================================
📡 Network: Localhost (localhost)
==================================================

👤 Deployer Information:
   Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   Balance: 10000.0 ETH

📦 Deploying CertificateNFT contract...
⏳ Waiting for deployment transaction...

✅ Contract Deployed Successfully!
==================================================
📍 Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
🔗 Transaction Hash: 0x...
==================================================
```

**📝 Important**: Copy the **Contract Address** and update it in `backend/.env`

---

### Terminal 3: Start Backend Server

```bash
# From project root (new terminal)
cd backend
node server.js
```

**Expected Output:**
```
======================================================================
🚀 BLOCKCHAIN CERTIFICATE SYSTEM - BACKEND SERVER
======================================================================
📡 Server running on: http://localhost:5000
🌐 Environment: development
📝 Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
🔗 RPC URL: http://127.0.0.1:8545
======================================================================

📋 Available Endpoints:
   GET  /                           - API Info
   GET  /health                     - Health Check
   GET  /api/certificates/health    - Detailed Health
   POST /api/certificates/issue
   GET  /api/certificates/:tokenId
   GET  /api/certificates/verify/:tokenId
   POST /api/certificates/revoke/:tokenId
   GET  /api/certificates/stats/overview
======================================================================

✅ Server is ready to accept requests
```

**✅ Keep this terminal running!**

---

### Terminal 4: Start Frontend

```bash
# From project root (new terminal)
cd frontend
npm run dev
```

**Expected Output:**
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

**✅ Keep this terminal running!**

---

## 🧪 Testing Guide

### Quick Test: Run All Tests

```bash
# From project root
npx hardhat test
```

**Expected Output:**
```
  CertificateNFT
    ✓ Should mint certificate only by owner (1205ms)
    ✓ Should not allow transfer (soulbound) (891ms)

  2 passing (3s)
```

### Detailed Testing Steps

#### Test 1: Health Check

```bash
# Test backend health
curl http://localhost:5000/health

# Expected response:
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-20T...",
  "uptime": 45.123
}
```

#### Test 2: Contract Health Check

```bash
curl http://localhost:5000/api/certificates/health

# Expected response:
{
  "success": true,
  "message": "Backend is healthy",
  "data": {
    "status": "operational",
    "blockchain": {
      "connected": true,
      "blockNumber": "5"
    },
    "contract": {
      "address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      "accessible": true,
      "totalMinted": "0"
    },
    "pinata": {
      "configured": true
    }
  }
}
```

#### Test 3: Get Statistics

```bash
curl http://localhost:5000/api/certificates/stats/overview

# Expected response:
{
  "success": true,
  "data": {
    "totalMinted": "0",
    "contractName": "CertificateNFT",
    "contractSymbol": "CERT",
    "contractOwner": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  }
}
```

---

## 🎓 Issuing Your First Certificate

### Step 1: Open Frontend

1. Open browser and go to: `http://localhost:3000`
2. You should see the **Blockchain Certificate System** interface

### Step 2: Connect MetaMask

1. Click **"🦊 Connect MetaMask"** button
2. MetaMask popup will appear
3. Select the account with address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
4. Click **"Next"** → **"Connect"**

**Note**: Make sure you're on the correct network (localhost/Hardhat)

### Step 3: Add Localhost Network to MetaMask (if needed)

If localhost network is not showing:

1. Open MetaMask
2. Click network dropdown (top center)
3. Click **"Add Network"** → **"Add network manually"**
4. Enter:
   - **Network Name**: `Hardhat Local`
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
5. Click **"Save"**

### Step 4: Fill Certificate Form

1. **Recipient Name**: `John Doe`
2. **Recipient Address**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (Account #1 from Hardhat)
3. **Grade**: Select `A+`
4. **Issuer**: `Blockchain University` (or leave default)
5. **Description**: `Successfully completed Blockchain Development Course`

### Step 5: Issue Certificate

1. Click **"🔐 Sign & Issue Certificate"**
2. MetaMask will popup asking to **sign a message**
3. Review the message details
4. Click **"Sign"**
5. Wait for processing (30-60 seconds)

**Processing Steps:**
- ✅ Generating certificate image
- ✅ Uploading image to IPFS
- ✅ Creating metadata
- ✅ Uploading metadata to IPFS
- ✅ Minting NFT certificate

### Step 6: View Results

**Success Message:**
```
✅ Certificate Generated Successfully!

🎫 Token ID: #1
📸 IPFS Image URL: https://gateway.pinata.cloud/ipfs/...
📦 Metadata URI: ipfs://Qm...
📝 Transaction Hash: 0x...
```

**Certificate Preview** will appear with:
- Generated certificate image
- IPFS URLs
- Transaction details
- Copy/Open buttons

---

## 🔍 Verifying Certificates

### Method 1: Using Frontend

1. Scroll to **"✓ Verify Certificate"** section
2. Enter Token ID: `1`
3. Click **"Verify"**
4. View results:
   - ✅ Status: VALID
   - Owner address
   - Minted date
   - Certificate image
   - Metadata details

### Method 2: Using API

```bash
# Verify certificate with Token ID 1
curl http://localhost:5000/api/certificates/verify/1

# Expected response:
{
  "success": true,
  "message": "Certificate is valid and authentic",
  "data": {
    "tokenId": 1,
    "isValid": true,
    "status": "VALID",
    "owner": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "mintedAt": "2025-10-20T...",
    "imageUrl": "https://gateway.pinata.cloud/ipfs/...",
    "metadata": { ... }
  }
}
```

---

## 🚫 Revoking Certificates

### Using Frontend

1. Scroll to **"🚫 Revoke Certificate"** section
2. Enter Token ID: `1`
3. Enter Reason: `Certificate revoked due to policy violation`
4. Click **"🔐 Sign & Revoke Certificate"**
5. Sign with MetaMask
6. Confirm revocation

### Verify Revocation

```bash
# Verify the certificate is now invalid
curl http://localhost:5000/api/certificates/verify/1

# Expected response:
{
  "data": {
    "isValid": false,
    "status": "INVALID",
    "reason": "Certificate may be revoked or does not exist"
  }
}
```

---

## 🐛 Troubleshooting

### Issue 1: "Please connect your wallet first"

**Solution:**
- Make sure MetaMask is installed
- Click "Connect MetaMask" button
- Select the correct account (0xf39Fd...)
- Ensure you're on localhost network (Chain ID: 31337)

### Issue 2: "Failed to connect wallet: User rejected the request"

**Solution:**
- Click "Connect MetaMask" again
- In MetaMask popup, click "Connect" (don't close)
- Try refreshing the page

### Issue 3: "Contract not deployed"

**Solution:**
```bash
# Terminal 1: Make sure Hardhat node is running
npx hardhat node

# Terminal 2: Redeploy contract
npx hardhat run scripts/deploy.js --network localhost

# Update CONTRACT_ADDRESS in backend/.env
# Restart backend server
```

### Issue 4: "IPFS upload failed"

**Solution:**
- Verify Pinata API keys in `backend/.env`
- Test Pinata connection:
```bash
curl -X GET "https://api.pinata.cloud/data/testAuthentication" \
  -H "pinata_api_key: YOUR_API_KEY" \
  -H "pinata_secret_api_key: YOUR_SECRET_KEY"
```
- Check your Pinata account limits (free tier: 1GB)

### Issue 5: "Network mismatch"

**Solution:**
1. Open MetaMask
2. Click network dropdown
3. Select "Hardhat Local" (Chain ID: 31337)
4. If not available, add it manually (see Step 3 above)

### Issue 6: "Insufficient funds"

**Solution:**
- You're probably not using the Hardhat test account
- In MetaMask, switch to account: `0xf39Fd...` (Account #0)
- This account has 10,000 ETH for testing

### Issue 7: Tests failing

**Solution:**
```bash
# Clean and recompile
npx hardhat clean
npx hardhat compile

# Run tests again
npx hardhat test
```

### Issue 8: Backend port already in use

**Solution:**
```bash
# Find process using port 5000
# On macOS/Linux:
lsof -i :5000

# On Windows:
netstat -ano | findstr :5000

# Kill the process or change PORT in .env
```

---

## 📊 Complete Testing Checklist

Use this checklist to verify everything works:

- [ ] ✅ Hardhat node running (Terminal 1)
- [ ] ✅ Contract deployed successfully
- [ ] ✅ Backend server running (Terminal 3)
- [ ] ✅ Frontend running (Terminal 4)
- [ ] ✅ MetaMask installed and connected
- [ ] ✅ Health check passes (`/health`)
- [ ] ✅ Contract health check passes (`/api/certificates/health`)
- [ ] ✅ Can view statistics
- [ ] ✅ Can issue certificate
- [ ] ✅ Certificate image generates correctly
- [ ] ✅ IPFS upload succeeds
- [ ] ✅ NFT minting succeeds
- [ ] ✅ Can view certificate on frontend
- [ ] ✅ Can verify certificate
- [ ] ✅ Can revoke certificate
- [ ] ✅ All unit tests pass (`npx hardhat test`)

---

## 🎯 Quick Commands Reference

```bash
# Start everything
Terminal 1: npx hardhat node
Terminal 2: npx hardhat run scripts/deploy.js --network localhost
Terminal 3: cd backend && node server.js
Terminal 4: cd frontend && npm run dev

# Testing
npx hardhat test                    # Run all tests
npx hardhat test --grep "mint"      # Run specific test

# Health checks
curl http://localhost:5000/health
curl http://localhost:5000/api/certificates/health
curl http://localhost:5000/api/certificates/stats/overview

# Verify certificate
curl http://localhost:5000/api/certificates/verify/1

# Clean build
npx hardhat clean
npx hardhat compile

# Stop everything
Ctrl+C in each terminal
```

---

## 📚 Additional Resources

- **Hardhat Documentation**: https://hardhat.org/docs
- **MetaMask Guide**: https://metamask.io/faqs/
- **Pinata Docs**: https://docs.pinata.cloud/
- **OpenZeppelin ERC721**: https://docs.openzeppelin.com/contracts/4.x/erc721
- **Ethers.js Documentation**: https://docs.ethers.org/v6/

---

## 🎉 Success!

If you've completed all steps and all tests pass, congratulations! You now have a fully functional blockchain certificate system running locally.

**What you can do next:**
1. Issue multiple certificates
2. Verify certificates from different accounts
3. Test the soulbound feature (try to transfer - it should fail)
4. Customize certificate design (edit `backend/services/certificateGenerator.js`)
5. Deploy to testnet (Sepolia) following deployment instructions

---

**Built with ❤️ using Hardhat, OpenZeppelin, Pinata IPFS, and React**