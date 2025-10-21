# 🎓 Blockchain Certificate System - Fully Decentralized

A completely decentralized blockchain-based certificate issuance and verification system. **No backend server required!** All operations happen directly in the browser.

## ✨ Features

- **🎨 Browser-Based Certificate Generation** - Certificates are generated using HTML5 Canvas directly in your browser
- **📦 IPFS Storage** - Certificates and metadata are uploaded to IPFS via Pinata
- **🔗 Direct Smart Contract Interaction** - No backend API - interact directly with the Ethereum blockchain
- **🔒 Soulbound NFTs** - Certificates are non-transferable (soulbound) for authenticity
- **✅ On-Chain Verification** - Verify any certificate directly from the blockchain
- **🚫 Revocation Support** - Contract owner can revoke certificates when needed
- **💰 No Network Fees (Local)** - Test on Hardhat local network with no real ETH required

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MetaMask](https://metamask.io/) browser extension
- [Pinata Account](https://pinata.cloud/) (free tier works fine)

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

### 2. Configure Environment Variables

Edit `frontend/.env`:

```env
# Contract address (update after deployment)
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Pinata IPFS credentials (get from https://pinata.cloud/)
VITE_PINATA_API_KEY=your_api_key_here
VITE_PINATA_SECRET_KEY=your_secret_key_here
# OR use JWT (recommended)
VITE_PINATA_JWT=your_jwt_token_here
```

### 3. Start Local Blockchain

```bash
# In terminal 1
npx hardhat node
```

This will start a local Ethereum node and give you 20 test accounts with 10,000 ETH each.

### 4. Deploy Smart Contract

```bash
# In terminal 2
npx hardhat run scripts/deploy.js --network localhost
```

Copy the deployed contract address and update `VITE_CONTRACT_ADDRESS` in `frontend/.env`.

### 5. Start Frontend

```bash
# In terminal 3
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`

### 6. Connect MetaMask

1. Click "Connect MetaMask" in the app
2. If prompted, switch to "Localhost" network or add it manually:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency: ETH

3. Import a test account from Hardhat:
   - Copy a private key from the Hardhat node output
   - In MetaMask: Import Account → Paste private key
   - **Use Account #0 (the deployer) as it's the contract owner**

## 📋 How to Use

### Issue a Certificate

1. **Connect Wallet** - Use the contract owner's wallet
2. **Fill Form**:
   - Recipient Name
   - Recipient Ethereum Address
   - Grade (A+, A, B, etc.)
   - Issuer Name (optional)
   - Description (optional)
3. **Click "Generate & Mint Certificate"**
4. **Wait for Process**:
   - Certificate image generated in browser
   - Image uploaded to IPFS
   - Metadata created and uploaded to IPFS
   - NFT minted on blockchain
5. **View Result** - Certificate image, IPFS links, and transaction details

### Verify a Certificate

1. Enter Token ID
2. Click "Verify"
3. View certificate details, image, and blockchain info

### Revoke a Certificate

1. **Connect as Owner**
2. Enter Token ID
3. Enter Reason (optional)
4. Confirm transaction in MetaMask

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
│                                                     │
│  ┌──────────────┐      ┌─────────────────┐        │
│  │   React App  │─────▶│  HTML5 Canvas   │        │
│  │              │      │  (Certificate)   │        │
│  └──────┬───────┘      └─────────────────┘        │
│         │                                           │
│         ├─────────▶ Pinata API (IPFS)             │
│         │                                           │
│         └─────────▶ Smart Contract (Ethereum)     │
│                     (via ethers.js)                │
└─────────────────────────────────────────────────────┘
```

### No Backend Required!

All operations happen directly in the browser:
- ✅ Certificate generation (HTML5 Canvas)
- ✅ IPFS uploads (Pinata API)
- ✅ Smart contract calls (ethers.js + MetaMask)
- ✅ Transaction signing (MetaMask)

## 🔧 Project Structure

```
blockchain-certificates/
├── contracts/
│   └── CertificateNFT.sol         # Smart contract
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Main application
│   │   ├── utils/
│   │   │   ├── certificateGenerator.js  # Browser-based canvas
│   │   │   ├── ipfsUpload.js           # Pinata IPFS uploads
│   │   │   ├── contractInteractions.js # Smart contract utilities
│   │   │   └── hooks.js                # React hooks
│   │   └── ...
│   ├── .env                       # Environment variables
│   └── package.json
├── scripts/
│   └── deploy.js                  # Deployment script
└── hardhat.config.ts
```

## 🔐 Security Features

### No Scam Warnings

The app uses **localhost (Hardhat)** network by default, which:
- ✅ Has no real ETH value
- ✅ Never triggers MetaMask scam warnings
- ✅ Allows unlimited free testing
- ✅ Perfect for development and demos

### For Production

When deploying to testnet (Sepolia) or mainnet:
1. Update `VITE_CONTRACT_ADDRESS` with deployed address
2. Switch MetaMask to the correct network
3. **IMPORTANT**: Never expose Pinata API keys in frontend code
   - Use a backend proxy
   - Or use Pinata JWT with proper restrictions

## 🌐 Network Configuration

### Localhost (Hardhat) - Recommended for Testing

- **Chain ID**: 31337
- **RPC URL**: http://127.0.0.1:8545
- **Cost**: Free (no real ETH)
- **Speed**: Instant transactions

### Sepolia Testnet - For Public Testing

- **Chain ID**: 11155111
- **RPC URL**: https://sepolia.infura.io/v3/YOUR_KEY
- **Cost**: Free testnet ETH from faucets
- **Speed**: 12-15 seconds per block

### Ethereum Mainnet - Production Only

- **Chain ID**: 1
- **Cost**: Real ETH (expensive)
- **NOT RECOMMENDED** for testing

## 🐛 Troubleshooting

### "Pinata not configured"
- Check `.env` file has `VITE_PINATA_API_KEY` and `VITE_PINATA_SECRET_KEY`
- Variable names must start with `VITE_` for Vite to expose them

### "Only owner can mint"
- You must use the wallet that deployed the contract
- Check contract owner address with `getContractOwner()`

### "Wrong network"
- Switch to Localhost (Chain ID 31337) in MetaMask
- Or add Localhost network manually

### Certificate image not loading
- IPFS can be slow on first load
- Try refreshing after a few seconds
- Check browser console for errors

### Transaction failed
- Ensure Hardhat node is running
- Check you have test ETH in your wallet
- Verify contract address is correct

## 📝 Smart Contract Functions

```solidity
// Mint certificate (owner only)
mintCertificate(address recipient, string tokenURI) → uint256 tokenId

// Verify certificate
verifyCertificate(uint256 tokenId) → bool isValid

// Revoke certificate (owner only)
revokeCertificate(uint256 tokenId)

// Get certificate details
getCertificateDetails(uint256 tokenId) → (address, uint256, bool, string)

// Check revocation status
isRevoked(uint256 tokenId) → bool

// Get total minted
getTotalMinted() → uint256
```

## 🎯 Key Advantages

1. **No Backend Maintenance** - One less server to manage and secure
2. **Lower Costs** - No server hosting fees
3. **True Decentralization** - Everything on blockchain and IPFS
4. **Better Security** - No single point of failure
5. **Transparent** - All operations visible on blockchain
6. **Offline Verification** - Anyone can verify certificates independently

## 📚 Technologies Used

- **Frontend**: React + Vite
- **Blockchain**: Ethereum (Hardhat)
- **Smart Contracts**: Solidity
- **Web3 Library**: ethers.js
- **Storage**: IPFS (via Pinata)
- **Certificate Generation**: HTML5 Canvas API
- **Wallet**: MetaMask

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT License - feel free to use this for your own projects!

---

**Made with ❤️ for the blockchain community**

*Note: This is a development/demo setup. For production, implement additional security measures and consider using testnets or mainnet.*
