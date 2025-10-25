# 🚀 Sepolia Testnet Deployment Guide

Complete step-by-step guide to deploy your Certificate NFT system from localhost to Sepolia testnet.

---

## 📋 Prerequisites

Before you begin, ensure you have:

1. ✅ **MetaMask wallet** installed with your private key
2. ✅ **Sepolia ETH** (get from [Sepolia Faucet](https://sepoliafaucet.com/) or [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia))
3. ✅ **Infura Account** (or Alchemy) for RPC URL
4. ✅ **Private Key** from your MetaMask wallet

---

## ⚙️ Step 1: Configure Environment Variables

### 1.1 Update Root `.env` File

Your root `.env` already has most configuration. Verify it contains:

```bash
# Sepolia Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/c5e5b4b204b24547a39af9634e49e4f5
SEPOLIA_PRIVATE_KEY=97a10b385c559504bdd7d16212cc937e0d614b45a15a356368bddbfff22031fc

# Pinata IPFS (keep existing)
PINATA_API_KEY=c0259b922ede324d6f00
PINATA_SECRET_API_KEY=34997e502475eddff752bc1852a663420090cebc20b3ecee6f19e9a14323fd64
```

⚠️ **IMPORTANT:** Replace `SEPOLIA_PRIVATE_KEY` with your **actual private key** from MetaMask if needed.

### 1.2 Update Frontend `.env` File

Your `frontend/.env` should be updated with:

```bash
# Network Configuration - DYNAMIC
VITE_NETWORK_NAME=sepolia
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://sepolia.infura.io/v3/c5e5b4b204b24547a39af9634e49e4f5

# Contract Address (will be updated after deployment)
VITE_CONTRACT_ADDRESS=

# Pinata IPFS
VITE_PINATA_API_KEY=c0259b922ede324d6f00
VITE_PINATA_SECRET_API_KEY=34997e502475eddff752bc1852a663420090cebc20b3ecee6f19e9a14323fd64
```

---

## 🔧 Step 2: Verify Hardhat Configuration

Your `hardhat.config.ts` is already configured for Sepolia! Verify it looks like this:

```typescript
networks: {
  sepolia: {
    type: "http",
    chainType: "l1",
    url: configVariable("SEPOLIA_RPC_URL"),
    accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
  },
}
```

---

## 💰 Step 3: Fund Your Wallet

### Get Sepolia Test ETH:

1. Visit [Sepolia Faucet](https://sepoliafaucet.com/)
2. Enter your wallet address: **Copy from MetaMask**
3. Complete captcha and request ETH
4. Wait 1-2 minutes for ETH to arrive

**Alternative Faucets:**
- [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

### Verify Balance:

```bash
npx hardhat run scripts/checkBalance.js --network sepolia
```

Or use this command:
```bash
node -e "import('ethers').then(({ethers}) => { const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/c5e5b4b204b24547a39af9634e49e4f5'); const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider); wallet.getBalance().then(b => console.log('Balance:', ethers.formatEther(b), 'ETH')); })"
```

---

## 🚀 Step 4: Deploy Contract to Sepolia

### 4.1 Compile Contracts

```bash
npm run compile
```

Expected output:
```
✓ Compiled 15 Solidity files successfully
```

### 4.2 Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

**Expected Output:**
```
🚀 Starting deployment...
==================================================
📡 Network: Sepolia Testnet (sepolia)
==================================================

👤 Deployer Information:
   Address: 0x...
   Balance: 0.5 ETH

📦 Deploying CertificateNFT contract...
⏳ Waiting for deployment transaction...

✅ Contract Deployed Successfully!
==================================================
📍 Contract Address: 0x1234567890abcdef...
🔗 Transaction Hash: 0xabcd...
⛽ Gas Used: 2500000
🔍 Explorer: https://sepolia.etherscan.io/address/0x1234567890abcdef...
==================================================

📋 Contract Details:
   Name: Certificate NFT
   Symbol: CNFT
   Owner: 0x...
   Total Minted: 0

💾 Saving deployment artifacts...
📄 Deployment info saved to: ./deployments/sepolia.json
📄 ABI saved to: ./deployments/abi/CertificateNFT.json
```

### 4.3 Save Contract Address

The contract address will be saved automatically in `./deployments/sepolia.json`.

**Copy the contract address** from the output or from the JSON file.

---

## 📝 Step 5: Update Frontend Configuration

### 5.1 Update `frontend/.env`

Add the deployed contract address:

```bash
VITE_CONTRACT_ADDRESS=0x1234567890abcdef...  # Your deployed contract address
```

### 5.2 The App.jsx is Now Dynamic!

The frontend has been updated to read network configuration from environment variables, so it will automatically connect to Sepolia!

---

## 🧪 Step 6: Test Deployment

### 6.1 Verify Contract on Etherscan

Visit: `https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS`

You should see:
- ✅ Contract creation transaction
- ✅ Contract code (verified if auto-verification worked)
- ✅ Contract interactions

### 6.2 Manual Verification (if needed)

If auto-verification didn't work:

```bash
npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS YOUR_DEPLOYER_ADDRESS
```

### 6.3 Test Certificate Minting

```bash
npx hardhat run scripts/issueCertificate.js --network sepolia
```

Or use the frontend after Step 7!

---

## 🌐 Step 7: Run Frontend with Sepolia

### 7.1 Install Frontend Dependencies (if not done)

```bash
cd frontend
npm install
```

### 7.2 Start Frontend

```bash
npm run dev
```

### 7.3 Configure MetaMask

1. Open MetaMask
2. Click network dropdown
3. Select **"Sepolia Test Network"**
4. Connect wallet to your app

### 7.4 Test Features

1. **Connect Wallet** - Should show Sepolia network
2. **Issue Certificate** - Mint a test certificate
3. **Verify Certificate** - Check using token ID
4. **View on IPFS** - Certificate images should load
5. **Check Etherscan** - View transactions

---

## 🔍 Step 8: Monitor & Verify

### Check Contract on Etherscan:
```
https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
```

### Check Transactions:
```
https://sepolia.etherscan.io/tx/YOUR_TRANSACTION_HASH
```

### Check IPFS Data:
```
https://gateway.pinata.cloud/ipfs/YOUR_IPFS_HASH
```

---

## 📊 Deployment Checklist

- [ ] Root `.env` configured with Sepolia RPC and private key
- [ ] Frontend `.env` configured with Sepolia network details
- [ ] Wallet funded with Sepolia ETH (minimum 0.1 ETH recommended)
- [ ] Contracts compiled successfully
- [ ] Contract deployed to Sepolia
- [ ] Contract address saved in `frontend/.env`
- [ ] Contract verified on Etherscan
- [ ] Frontend connected to MetaMask on Sepolia
- [ ] Test certificate minted successfully
- [ ] IPFS images loading correctly

---

## 🛠️ Troubleshooting

### Issue: "Insufficient funds for gas"
**Solution:** Get more Sepolia ETH from faucets

### Issue: "Network not configured"
**Solution:** Check `hardhat.config.ts` has sepolia network

### Issue: "Invalid private key"
**Solution:** Ensure private key in `.env` doesn't have `0x` prefix (it should)

### Issue: "Contract verification failed"
**Solution:** Run manual verification:
```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS DEPLOYER_ADDRESS
```

### Issue: "MetaMask shows wrong network"
**Solution:** Manually switch MetaMask to Sepolia network

### Issue: "IPFS images not loading"
**Solution:** 
1. Check Pinata API keys in `.env`
2. Wait 1-2 minutes for IPFS propagation
3. Try alternative gateway: `https://ipfs.io/ipfs/YOUR_HASH`

---

## 🎯 Next Steps

### For Production:

1. **Deploy to Mainnet** (when ready):
   ```bash
   npx hardhat run scripts/deploy.js --network mainnet
   ```

2. **Add Environment Switching**:
   - Create `.env.sepolia` and `.env.mainnet`
   - Use dotenv-flow for automatic switching

3. **Security Enhancements**:
   - Use hardware wallet for mainnet deployment
   - Never commit private keys to Git
   - Use environment variable management service

4. **Setup Multi-Sig Wallet** (recommended for production):
   ```bash
   npx hardhat run scripts/deployMultiSig.js --network sepolia
   ```

---

## 📚 Useful Commands

```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Verify contract
npm run verify:sepolia

# Run tests
npm test

# Check contract status
npx hardhat run scripts/checkContract.js --network sepolia

# Issue certificate
npx hardhat run scripts/issueCertificate.js --network sepolia
```

---

## 📞 Support & Resources

- **Sepolia Faucet:** https://sepoliafaucet.com/
- **Etherscan Sepolia:** https://sepolia.etherscan.io/
- **Hardhat Docs:** https://hardhat.org/docs
- **Pinata Docs:** https://docs.pinata.cloud/

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ Contract deployed on Sepolia
2. ✅ Contract verified on Etherscan
3. ✅ Frontend connects to Sepolia via MetaMask
4. ✅ Can mint certificates on Sepolia
5. ✅ Can verify certificates
6. ✅ IPFS images load correctly
7. ✅ All transactions visible on Etherscan

---

**🎉 Congratulations! Your Certificate NFT system is now live on Sepolia testnet!**
