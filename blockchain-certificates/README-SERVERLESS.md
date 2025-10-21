# 🎓 Blockchain Certificate System - Serverless Edition

## 🚀 Architecture Overview

This is a **fully serverless** blockchain-based certificate issuance system. All operations happen directly in the browser - no backend server required!

### ✨ Key Features

- ✅ **100% Browser-Based** - No backend server needed
- ✅ **Direct Smart Contract Interaction** - Using ethers.js from the browser
- ✅ **Browser-Side Certificate Generation** - Using HTML5 Canvas & html2canvas
- ✅ **Client-Side IPFS Upload** - Direct uploads to Pinata from browser
- ✅ **Soulbound NFT Certificates** - Non-transferable certificates
- ✅ **On-Chain Verification** - All data verified on blockchain
- ✅ **MetaMask Integration** - Secure wallet connection

## 📁 Project Structure

```
blockchain-certificates/
├── contracts/              # Solidity smart contracts
│   └── CertificateNFT.sol # Main NFT certificate contract
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── utils/
│   │   │   ├── certificateGenerator.js  # Browser-based certificate generation
│   │   │   ├── ipfsUpload.js           # Client-side IPFS uploads
│   │   │   ├── contractHooks.js        # React hooks for contract interaction
│   │   │   ├── contractABI.js          # Contract ABI
│   │   │   └── contract.js             # Contract configuration
│   │   ├── App.jsx        # Main application component
│   │   └── main.jsx       # Entry point
│   ├── .env               # Frontend environment variables
│   └── package.json       # Frontend dependencies
├── scripts/               # Deployment scripts
│   └── deploy.js          # Contract deployment script
├── test/                  # Smart contract tests
├── hardhat.config.ts      # Hardhat configuration
└── package.json           # Root project configuration
```

## 🛠️ Technology Stack

### Frontend
- **React** - UI framework
- **ethers.js v6** - Ethereum interaction
- **html2canvas** - Certificate image generation in browser
- **Axios** - HTTP requests for IPFS
- **React Hot Toast** - Notifications
- **Vite** - Build tool

### Blockchain
- **Solidity ^0.8.21** - Smart contract language
- **Hardhat** - Development environment
- **OpenZeppelin** - Secure contract libraries

### Storage
- **Pinata IPFS** - Decentralized file storage
- **IPFS Gateway** - Image and metadata retrieval

## 🚦 Getting Started

### Prerequisites

- Node.js v16+ installed
- MetaMask browser extension
- Pinata account (free tier works!)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd blockchain-certificates

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Configure Environment Variables

#### Root `.env` (for deployment)
```env
PRIVATE_KEY=your_private_key_here
RPC_URL=http://127.0.0.1:8545
```

#### Frontend `.env` (for IPFS)
```env
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_API_KEY=your_pinata_secret_key

# Or use JWT (recommended for security)
# VITE_PINATA_JWT=your_pinata_jwt_token
```

**⚠️ Security Note:** In production, NEVER expose API keys in the frontend. Use a serverless function or backend proxy for IPFS uploads.

### 3. Start Local Blockchain

```bash
# Terminal 1: Start Hardhat node
npx hardhat node
```

### 4. Deploy Smart Contract

```bash
# Terminal 2: Deploy contract
npx hardhat run scripts/deploy.js --network localhost
```

**Important:** Copy the deployed contract address to `frontend/.env` as `VITE_CONTRACT_ADDRESS`.

### 5. Start Frontend

```bash
# Terminal 3: Start React app
cd frontend
npm run dev
```

Visit `http://localhost:3000` 🎉

## 📖 How It Works

### Certificate Issuance Flow

```
1. User fills form → enters recipient details
2. Connect MetaMask → authenticate admin wallet
3. Generate Certificate →
   ├─ Create HTML template with details
   ├─ Render to canvas using html2canvas
   └─ Export as PNG blob
4. Upload to IPFS →
   ├─ Upload certificate image to Pinata
   └─ Upload metadata JSON to Pinata
5. Mint NFT →
   ├─ Call smart contract from browser
   ├─ Wait for transaction confirmation
   └─ Display token ID & transaction hash
```

### Certificate Verification Flow

```
1. User enters Token ID
2. Query smart contract →
   ├─ Check if certificate exists
   ├─ Verify not revoked
   └─ Get metadata URI
3. Fetch from IPFS →
   ├─ Download metadata JSON
   └─ Display certificate image
4. Show verification result ✅/❌
```

### Revocation Flow

```
1. Admin enters Token ID
2. Connect MetaMask (must be contract owner)
3. Send revocation transaction
4. Certificate marked as invalid on-chain
```

## 🔐 Smart Contract Functions

### Admin Functions (Owner Only)

```solidity
// Mint new certificate NFT
function mintCertificate(address recipient, string memory _tokenURI) external onlyOwner returns (uint256)

// Revoke a certificate
function revokeCertificate(uint256 tokenId) external onlyOwner
```

### Public Functions

```solidity
// Verify certificate validity
function verifyCertificate(uint256 tokenId) public view returns (bool isValid)

// Get certificate details
function getCertificateDetails(uint256 tokenId) external view returns (
    address owner,
    uint256 mintedAt,
    bool revoked,
    string memory uri
)

// Check if revoked
function isRevoked(uint256 tokenId) external view returns (bool)

// Get total minted count
function getTotalMinted() external view returns (uint256)
```

## 🎨 Certificate Design

Certificates are generated with:
- **1920x1080 resolution** - High quality output
- **Gradient background** - Professional look
- **Golden borders & seals** - Authentic appearance
- **Dynamic text** - Recipient name, grade, wallet address
- **Blockchain verification** - Permanent proof

Customizable fields:
- Recipient Name
- Grade (A+, A, B, etc.)
- Issuer Name
- Issue Date (automatic)
- Custom Description
- Attributes/Traits

## 🔒 Security Features

### Smart Contract Security
- ✅ OpenZeppelin audited contracts
- ✅ Owner-only minting and revocation
- ✅ Soulbound tokens (non-transferable)
- ✅ Reentrancy protection
- ✅ Integer overflow protection

### Frontend Security
- ✅ MetaMask signature verification
- ✅ Input validation
- ✅ Transaction confirmation prompts
- ✅ Error handling

### Recommendations for Production
- 🔒 Use backend proxy for IPFS uploads
- 🔒 Implement serverless functions (Vercel, Netlify)
- 🔒 Store API keys in environment variables
- 🔒 Rate limit IPFS uploads
- 🔒 Add multi-sig for admin operations

## 📊 Gas Optimization

Average gas costs (on local network):
- **Mint Certificate:** ~150,000 gas
- **Revoke Certificate:** ~45,000 gas
- **Verify Certificate:** 0 gas (view function)

## 🧪 Testing

```bash
# Run smart contract tests
npx hardhat test

# Run specific test file
npx hardhat test test/certificateTest.js

# Get gas report
REPORT_GAS=true npx hardhat test
```

## 🚀 Deployment

### Localhost (Development)
Already covered in "Getting Started" section.

### Testnet (Sepolia, Goerli, etc.)

1. Update `hardhat.config.ts` with testnet configuration
2. Get testnet ETH from faucet
3. Update `.env` with testnet RPC URL
4. Deploy:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

### Mainnet (Production)

⚠️ **Production Deployment Checklist:**
- [ ] Smart contract audited
- [ ] All tests passing
- [ ] Environment variables secured
- [ ] Frontend API keys moved to backend
- [ ] Gas costs calculated
- [ ] Admin wallet secured (hardware wallet recommended)

## 📦 IPFS & Pinata

### Why Pinata?
- ✅ Reliable IPFS pinning service
- ✅ Free tier available
- ✅ Fast gateways
- ✅ Simple API

### IPFS URLs
- **Gateway URL:** `https://gateway.pinata.cloud/ipfs/{hash}`
- **IPFS URI:** `ipfs://{hash}` (stored on-chain)

### Pinning Policy
- Certificate images are pinned permanently
- Metadata JSON is pinned permanently
- Files can be managed via Pinata dashboard

## 🐛 Troubleshooting

### "Pinata API not configured"
- Check `frontend/.env` has `VITE_PINATA_API_KEY` and `VITE_PINATA_SECRET_API_KEY`
- Restart development server after adding env variables

### "Transaction rejected"
- Make sure you're using the contract owner wallet
- Check you have enough ETH for gas
- Verify you're on the correct network

### "Failed to load certificate image"
- IPFS can be slow sometimes, wait a few seconds
- Try refreshing the page
- Check Pinata dashboard to verify upload

### "Contract not deployed"
- Make sure Hardhat node is running
- Deploy the contract: `npx hardhat run scripts/deploy.js --network localhost`
- Update `VITE_CONTRACT_ADDRESS` in `frontend/.env`

## 🎯 Roadmap

- [ ] Add batch certificate issuance
- [ ] Implement certificate templates library
- [ ] Add QR code generation for verification
- [ ] Create admin dashboard
- [ ] Add certificate expiration dates
- [ ] Implement role-based access control
- [ ] Support multiple issuers
- [ ] Add email notifications
- [ ] Create mobile app
- [ ] Implement zero-knowledge proofs for privacy

## 📄 License

ISC License

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📞 Support

For issues or questions, please open a GitHub issue.

---

**Built with ❤️ using Blockchain Technology**

*No backend servers harmed in the making of this project* 🌐⚡
