# 🚀 Quick Start Guide - Serverless Certificate System

## ⚡ Get Running in 5 Minutes

### Step 1: Install Dependencies (1 min)

```bash
# Root directory
npm install

# Frontend directory
cd frontend
npm install
cd ..
```

### Step 2: Configure Pinata (1 min)

1. Go to [Pinata](https://pinata.cloud) and sign up (free tier is enough)
2. Get your API keys from dashboard
3. Create `frontend/.env`:

```env
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_PINATA_API_KEY=your_api_key_here
VITE_PINATA_SECRET_API_KEY=your_secret_key_here
```

### Step 3: Start Blockchain (1 min)

```bash
# Terminal 1
npx hardhat node
```

Keep this terminal running!

### Step 4: Deploy Contract (1 min)

```bash
# Terminal 2
npx hardhat run scripts/deploy.js --network localhost
```

**Copy the contract address** and update `frontend/.env` if different.

### Step 5: Start Frontend (1 min)

```bash
# Terminal 3
cd frontend
npm run dev
```

### Step 6: Use the App! 🎉

1. Open http://localhost:3000
2. Click "Connect MetaMask"
3. Select one of the Hardhat accounts
4. Fill the certificate form:
   - Recipient Name: John Doe
   - Recipient Address: (any address from Hardhat accounts)
   - Grade: A+
5. Click "Generate & Issue Certificate"
6. Approve transaction in MetaMask
7. Wait for certificate to be generated and minted! ✅

## 🎯 What You'll See

1. **Progress Bar** showing:
   - Generating certificate image...
   - Uploading to IPFS...
   - Minting on blockchain...

2. **Certificate Result** with:
   - Token ID
   - IPFS Image URL
   - Transaction Hash
   - Certificate Preview

3. **Verification** - Enter token ID to verify any certificate

## 🔍 Verify Your Certificate

1. Copy the Token ID from the result
2. Scroll to "Verify Certificate" section
3. Paste Token ID and click "Verify"
4. See the certificate details and image!

## 🚫 Revoke a Certificate (Admin Only)

1. Scroll to "Revoke Certificate" section
2. Enter Token ID
3. Click "Revoke Certificate"
4. Confirm in MetaMask
5. Certificate is now invalid!

## 🎨 Customize Certificate Design

Edit `frontend/src/utils/certificateGenerator.js` to change:
- Colors
- Layout
- Fonts
- Text
- Decorations

## 📊 View Statistics

The dashboard shows:
- Total certificates minted
- Contract owner address
- Network (localhost/testnet)

## 💡 Pro Tips

1. **Use Different Accounts**: Switch MetaMask accounts to test issuing to different recipients
2. **Check Console**: Open browser DevTools to see detailed logs
3. **MetaMask Reset**: If transactions fail, reset MetaMask account (Settings → Advanced → Reset Account)
4. **IPFS Loading**: Certificate images may take 5-10 seconds to load from IPFS

## 🐛 Common Issues

### "Pinata API not configured"
- Make sure `.env` file is in `frontend/` folder
- Restart dev server: `Ctrl+C` then `npm run dev`

### "Transaction failed"
- Check you're using the contract owner wallet
- Make sure Hardhat node is running
- Verify you're on localhost network (Chain ID: 31337)

### "Certificate image not loading"
- Wait a few seconds (IPFS can be slow)
- Check browser console for errors
- Verify Pinata API keys are correct

## 🎓 Next Steps

1. Try issuing multiple certificates
2. Verify different token IDs
3. Test revocation
4. Explore the code in `frontend/src/utils/`
5. Read the full documentation in `README-SERVERLESS.md`

## 📚 Learn More

- [Full Documentation](README-SERVERLESS.md)
- [Migration Guide](MIGRATION-GUIDE.md)
- [Smart Contract](contracts/CertificateNFT.sol)

---

**Enjoy your serverless blockchain certificate system! 🎉**

No backend. No servers. Pure Web3. ⚡
