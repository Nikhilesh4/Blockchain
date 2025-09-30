# Blockchain Certificate NFT Project

A complete blockchain-based certificate system that creates soulbound (non-transferable) NFT certificates. This project allows institutions to issue tamper-proof digital certificates that can be verified on the blockchain while preventing unauthorized transfers.

## 🎯 Project Overview

This project implements:

- **Soulbound NFT Certificates**: Non-transferable digital certificates
- **IPFS Integration**: Decentralized storage for certificate metadata and images
- **Complete Workflow**: From image upload to certificate minting
- **Testing Suite**: Comprehensive tests for contract functionality
- **Multi-network Support**: Local, testnet, and mainnet deployment options

## 📁 Project Structure

### Core Contracts

- `contracts/CertificateNFT.sol` - Main soulbound NFT contract for certificates
- `contracts/Counter.sol` - Example counter contract (for testing purposes)
- `contracts/Counter.t.sol` - Foundry-style test for Counter contract

### Deployment & Scripts

- `scripts/deploy.js` - Deploy the CertificateNFT contract
- `scripts/pinataUpload.js` - Upload certificate images to IPFS via Pinata
- `scripts/uploadJSON.js` - Upload certificate metadata JSON to IPFS
- `scripts/mintcertificate.js` - Mint certificates to recipients
- `scripts/send-op-tx.ts` - Example Optimism transaction script

### Configuration & Setup

- `hardhat.config.ts` - Hardhat configuration with multiple networks
- `package.json` - Dependencies and project configuration
- `tsconfig.json` - TypeScript configuration

### Testing

- `test/certificateTest.js` - Certificate contract tests using Mocha/Chai
- `test/Counter.ts` - TypeScript tests for Counter contract

### Sample Files

- `a.jpeg` - Sample certificate image
- `a.json` - Sample certificate metadata JSON

### Generated Files

- `artifacts/` - Compiled contract artifacts
- `cache/` - Hardhat compilation cache
- `types/` - TypeScript type definitions for contracts
- `ignition/` - Hardhat Ignition deployment modules

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Pinata account for IPFS storage
- MetaMask or similar wallet

### Installation

1. Clone and install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
# For Sepolia deployment (optional)
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
npx hardhat keystore set SEPOLIA_RPC_URL
```

3. Update Pinata credentials:

- Edit `scripts/pinataUpload.js` and `scripts/uploadJSON.js`
- Replace the API keys with your Pinata credentials

## 📋 Complete Usage Workflow

### Step 1: Prepare Certificate Assets

1. Add your certificate image:

- Replace `a.jpeg` with your certificate image
- Update the file path in `scripts/pinataUpload.js`

2. Create certificate metadata:

- Edit `a.json` with your certificate details:

```json
{
  "name": "Your Certificate Name",
  "description": "Certificate description",
  "image": "ipfs://[IMAGE_HASH]",
  "issuer": "Your Institution Name"
}
```

### Step 2: Upload to IPFS

1. Upload certificate image:

```bash
cd scripts
node pinataUpload.js
```

- Copy the returned IPFS hash
- Update the `image` field in `a.json`

2. Upload metadata JSON:

```bash
node uploadJSON.js
```

- Copy the returned IPFS hash for certificate minting

### Step 3: Deploy Contract

1. Start local Hardhat network (in separate terminal):

```bash
npx hardhat node
```

2. Deploy the contract:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

- Copy the deployed contract address

### Step 4: Mint Certificate

1. Update minting script:

- Edit `scripts/mintcertificate.js`
- Update `contractAddress`, `recipient`, and `metadataURI`

2. Mint the certificate:

```bash
npx hardhat run scripts/mintcertificate.js --network localhost
```

## 🧪 Testing

### Run All Tests

```bash
npx hardhat test
```

### Run Specific Test Types

```bash
# Run only Mocha tests
npx hardhat test mocha

# Run only Solidity tests
npx hardhat test solidity
```

### Test Coverage

The test suite covers:

- ✅ Owner-only minting functionality
- ✅ Soulbound token restrictions (prevents transfers)
- ✅ Metadata URI retrieval
- ✅ Access control mechanisms

### 📋 Testing Example Walkthrough

Here's a step-by-step example of testing the certificate system:

#### 1. Run the Test Suite

```bash
# Start from project root
cd /path/to/blockchain-certificates

# Run all tests with detailed output
npx hardhat test --verbose
```

**Expected Output:**
```
  CertificateNFT
    ✓ Should mint certificate only by owner (1205ms)
    ✓ Should not allow transfer (soulbound) (891ms)

  2 passing (3s)
```

#### 2. Test Individual Functionality

**Test 1: Owner-Only Minting**
```javascript
// From test/certificateTest.js
it("Should mint certificate only by owner", async function () {
  // Non-owner tries to mint - should fail
  await expect(certificate.connect(user).mintCertificate(user.address, "ipfs://sampleURI"))
    .to.be.revertedWithCustomError(certificate, "OwnableUnauthorizedAccount");

  // Owner mints successfully
  await certificate.mintCertificate(user.address, "ipfs://sampleURI");
  expect(await certificate.tokenIdCounter()).to.equal(1);
});
```

**Test 2: Soulbound Restriction**
```javascript
// Test that prevents transfers
it("Should not allow transfer (soulbound)", async function () {
  // First mint a certificate
  await certificate.mintCertificate(user.address, "ipfs://sampleURI");
  
  // Try to transfer - should fail
  await expect(certificate.connect(user).transferFrom(user.address, owner.address, 1))
    .to.be.revertedWith("This NFT is soulbound and non-transferable");
});
```

#### 3. Manual Testing Example

**Complete Manual Test Scenario:**

1. **Setup Test Environment:**
```bash
# Terminal 1: Start local blockchain
npx hardhat node

# Terminal 2: Run tests
npx hardhat test
```

2. **Deploy and Test Manually:**
```bash
# Deploy contract
npx hardhat run scripts/deploy.js --network localhost

# Expected output:
# Deploying contracts with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
# CertificateNFT deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

3. **Test Certificate Minting:**
```bash
# Update scripts/mintcertificate.js with:
# - contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
# - recipient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
# - metadataURI: "ipfs://QmTest123..."

npx hardhat run scripts/mintcertificate.js --network localhost

# Expected output:
# Certificate NFT minted successfully!
# Recipient: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
# Metadata URI: ipfs://QmTest123...
```

4. **Verify Certificate on Blockchain:**
```bash
# Use Hardhat console to interact with contract
npx hardhat console --network localhost
```

```javascript
// In Hardhat console:
const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
const certificate = CertificateNFT.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

// Check token counter
await certificate.tokenIdCounter(); // Should return 1

// Check token owner
await certificate.ownerOf(1); // Should return recipient address

// Check metadata URI
await certificate.tokenURI(1); // Should return IPFS URI

// Try to transfer (should fail)
const [owner, user] = await ethers.getSigners();
try {
  await certificate.connect(user).transferFrom(user.address, owner.address, 1);
} catch (error) {
  console.log("Transfer blocked - Soulbound working!"); // Expected
}
```

#### 4. Test Results Interpretation

**Successful Test Run Should Show:**

```bash
$ npx hardhat test

  CertificateNFT
    ✓ Should mint certificate only by owner (1205ms)
      - Non-owner minting attempt blocked ✓
      - Owner minting successful ✓
      - Token counter incremented ✓
    ✓ Should not allow transfer (soulbound) (891ms)
      - Certificate minted successfully ✓
      - Transfer attempt blocked with correct error ✓
      - Token remains with original owner ✓

  2 passing (3s)
```

#### 5. Integration Test Example

**Full End-to-End Test:**

```bash
# 1. Upload test image
cd scripts
node pinataUpload.js
# Note the returned hash: bafkreitest123...

# 2. Update a.json with image hash and upload metadata
node uploadJSON.js
# Note the returned hash: QmMetadataTest456...

# 3. Deploy contract
cd ..
npx hardhat run scripts/deploy.js --network localhost
# Note contract address: 0x5FbDB2315678afecb367f032d93F642f64180aa3

# 4. Update mintcertificate.js with real values
# 5. Mint certificate
npx hardhat run scripts/mintcertificate.js --network localhost

# 6. Verify in console
npx hardhat console --network localhost
```

```javascript
// Verification commands in console:
const contract = await ethers.getContractAt("CertificateNFT", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
await contract.tokenIdCounter(); // Should be 1
await contract.tokenURI(1); // Should return your IPFS metadata URI

// Verify IPFS content by visiting:
// https://gateway.pinata.cloud/ipfs/QmMetadataTest456...
```

#### 6. Common Test Scenarios & Expected Results

| Test Scenario | Command | Expected Result |
|--------------|---------|-----------------|
| Run all tests | `npx hardhat test` | 2 passing tests |
| Non-owner mint | See test code above | Reverted with "OwnableUnauthorizedAccount" |
| Owner mint | See test code above | Success, tokenIdCounter = 1 |
| Transfer attempt | See test code above | Reverted with "soulbound" message |
| Token URI check | `contract.tokenURI(1)` | Returns IPFS URI |
| Owner verification | `contract.ownerOf(1)` | Returns recipient address |

## 🌐 Network Deployment

### Local Development

```bash
npx hardhat node  # Start local node
npx hardhat run scripts/deploy.js --network localhost
```

### Sepolia Testnet

```bash
# Set up credentials first
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
npx hardhat keystore set SEPOLIA_RPC_URL

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia
```

## 📖 Sample Example

Here's a complete example of issuing a blockchain certificate:

### 1. Certificate Image (a.jpeg)

Upload your institution's certificate template image.

### 2. Certificate Metadata (a.json)

```json
{
  "name": "Blockchain Development Certificate",
  "description": "Issued for completing the Advanced Blockchain Development Course",
  "image": "ipfs://bafkreiawsqji4rzpjn6mpgaxci3bu2f24tpgqqqe2dsvmlmfrod5cbjrbe",
  "issuer": "Blockchain University",
  "attributes": [
    {
      "trait_type": "Course",
      "value": "Advanced Blockchain Development"
    },
    {
      "trait_type": "Completion Date",
      "value": "September 2025"
    },
    {
      "trait_type": "Grade",
      "value": "A+"
    }
  ]
}
```

### 3. Deployment Result

```
Deploying contracts with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
CertificateNFT deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 4. Certificate Minting

```
Certificate NFT minted successfully!
Recipient: 0xcd3b766ccdd6ae721141f452c550ca635964ce71  
Metadata URI: ipfs://QmfCNWTJVyQQ1WDhjbzbzdo1g9wpYqPEALWMjxsPqQgZBr
```

## 🔧 Configuration Details

### Hardhat Networks

- **hardhatMainnet**: Local Ethereum mainnet simulation
- **hardhatOp**: Local Optimism simulation  
- **sepolia**: Ethereum Sepolia testnet

### Contract Features

- **ERC721 Standard**: Standard NFT functionality
- **Soulbound**: Prevents transfers after minting
- **Ownable**: Only contract owner can mint certificates
- **Metadata Storage**: IPFS-based metadata storage

## 🛠️ Customization

### For Educational Institutions

1. Update contract constructor:

- Modify token name and symbol in `CertificateNFT.sol`
- Customize metadata structure

2. Batch minting:

- Create scripts for bulk certificate issuance
- Add CSV import functionality

3. Verification portal:

- Build a web interface for certificate verification
- Integrate with your existing systems

### For Organizations

1. Add certificate types:

- Extend metadata to include course/program information
- Add expiration dates if needed

2. Integration:

- Connect with existing LMS systems
- Add API endpoints for automated issuance

## 🔍 Verification

Certificate holders and third parties can verify certificates by:

1. **On-chain verification:**

- Check token ownership on blockchain explorer
- Verify metadata URI and content

2. **IPFS content verification:**

- Access metadata via IPFS hash
- Verify image and certificate details

3. **Smart contract interaction:**

- Call `tokenURI()` function with token ID
- Verify issuer address matches institution

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Troubleshooting

### Common Issues

1. **"Contract not deployed" error:**

- Ensure local network is running: `npx hardhat node`
- Check contract address in minting script

2. **IPFS upload failures:**

- Verify Pinata API credentials
- Check file paths in upload scripts

3. **Transaction failures:**

- Ensure sufficient ETH balance
- Check gas price settings

4. **Test failures:**

- Clean artifacts: `npx hardhat clean`
- Recompile: `npx hardhat compile`

### Support

For issues and questions:

- Check existing tests for usage examples
- Review Hardhat documentation
- Examine transaction logs for debugging

---

**Built with:** Hardhat 3 Beta, OpenZeppelin, Pinata IPFS, Ethers.js

## 📝 File Descriptions Summary

| File/Folder | Purpose | Description |
|-------------|---------|-------------|
| `contracts/CertificateNFT.sol` | Smart Contract | Main soulbound NFT contract with ERC721 standard and transfer restrictions |
| `scripts/deploy.js` | Deployment | Deploys CertificateNFT contract to specified network |
| `scripts/pinataUpload.js` | IPFS Upload | Uploads certificate images to IPFS via Pinata service |
| `scripts/uploadJSON.js` | Metadata Upload | Uploads certificate metadata JSON to IPFS |
| `scripts/mintcertificate.js` | Certificate Minting | Mints new certificates to specified recipients |
| `test/certificateTest.js` | Testing | Comprehensive tests for contract functionality |
| `a.jpeg` | Sample Asset | Example certificate image for testing |
| `a.json` | Sample Metadata | Example certificate metadata structure |
| `hardhat.config.ts` | Configuration | Hardhat network and compiler configuration |
| `package.json` | Dependencies | Project dependencies and scripts |

### Quick Command Reference

```bash
# Setup
npm install

# Testing
npx hardhat test

# Local Development
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost

# IPFS Upload
cd scripts
node pinataUpload.js
node uploadJSON.js

# Certificate Minting
npx hardhat run scripts/mintcertificate.js --network localhost

# Deployment to Testnet
npx hardhat run scripts/deploy.js --network sepolia
```