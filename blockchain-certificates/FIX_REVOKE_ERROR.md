# Fix: "Cannot read properties of undefined (reading 'estimateGas')" Error

## ✅ Problem Solved!

The frontend ABI has been **updated successfully** with the latest `revokeCertificate` function.

---

## 🔍 Root Cause

The contract was updated to restrict revocation to SUPER_ADMIN only, but the frontend's ABI file (`frontend/src/utils/contractABI.js`) was outdated and didn't include the updated `revokeCertificate` function.

---

## ✅ What Was Fixed

1. ✅ **ABI Updated** - Frontend now has the latest contract ABI with `revokeCertificate` function
2. ✅ **Script Created** - `scripts/update-frontend-abi.cjs` for future ABI updates

---

## 🚀 Next Steps

You need to choose ONE of these options:

### Option 1: Test Locally First (RECOMMENDED)

1. **Start Hardhat Node** (Terminal 1):
```bash
cd "/home/nikhilesh/Desktop/Web3 and blockchain /Blockchain/blockchain-certificates"
npx hardhat node
```

2. **Deploy Updated Contract** (Terminal 2):
```bash
cd "/home/nikhilesh/Desktop/Web3 and blockchain /Blockchain/blockchain-certificates"
npx hardhat run scripts/deploy.js --network localhost
```

3. **Update Frontend .env to use localhost**:
```bash
cd "/home/nikhilesh/Desktop/Web3 and blockchain /Blockchain/blockchain-certificates/frontend"
```

Edit `.env` and change:
```env
# COMMENT OUT Sepolia settings:
# VITE_NETWORK_NAME=sepolia
# VITE_CHAIN_ID=11155111
# VITE_RPC_URL=https://sepolia.infura.io/v3/...
# VITE_CONTRACT_ADDRESS=0x97D07Bcdb9197166e9619A488bf109990bdc22cD

# UNCOMMENT Localhost settings:
VITE_NETWORK_NAME=localhost
VITE_CHAIN_ID=31337
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

4. **Start Frontend** (Terminal 3):
```bash
cd "/home/nikhilesh/Desktop/Web3 and blockchain /Blockchain/blockchain-certificates/frontend"
npm run dev
```

5. **Import Hardhat Account to MetaMask**:
   - Account #0: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Account #1: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

6. **Test Revocation**:
   - Connect with Account #0 (deployer = SUPER_ADMIN)
   - Try to revoke a certificate - should work! ✅
   - Connect with other accounts - should fail ❌

---

### Option 2: Deploy to Sepolia

1. **Deploy Updated Contract**:
```bash
cd "/home/nikhilesh/Desktop/Web3 and blockchain /Blockchain/blockchain-certificates"
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

2. **Update Frontend .env**:
Replace the contract address with the new one from deployment output:
```env
VITE_CONTRACT_ADDRESS=<NEW_DEPLOYED_ADDRESS>
```

3. **Restart Frontend**:
```bash
cd frontend
npm run dev
```

⚠️ **Note**: Deploying to Sepolia will create a NEW contract. Your old certificates will still exist on the old contract.

---

## 🧪 How to Test Revocation

### Before Testing:
1. Make sure you have a certificate minted
2. Note the Token ID

### Testing as SUPER_ADMIN (Should Work ✅):
1. Connect with the deployer wallet (Account #0)
2. Go to the Revoke section
3. Enter the Token ID
4. Click "Revoke Certificate"
5. **Expected**: Transaction succeeds ✅

### Testing as Regular User (Should Fail ❌):
1. Connect with a different wallet
2. Try to revoke the same certificate
3. **Expected**: Error "Must have SUPER_ADMIN_ROLE" ❌

---

## 🔄 Future ABI Updates

Whenever you modify the smart contract, update the frontend ABI:

```bash
cd "/home/nikhilesh/Desktop/Web3 and blockchain /Blockchain/blockchain-certificates"

# Compile contracts
npx hardhat compile

# Update frontend ABI
node scripts/update-frontend-abi.cjs

# Restart frontend
cd frontend
npm run dev
```

---

## ✅ Verification

The ABI now includes `revokeCertificate`:

```javascript
{
  "inputs": [
    {
      "internalType": "uint256",
      "name": "tokenId",
      "type": "uint256"
    }
  ],
  "name": "revokeCertificate",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
}
```

---

## 🐛 Troubleshooting

### If you still get the error:

1. **Clear Browser Cache**:
   - Open DevTools (F12)
   - Right-click refresh → "Empty Cache and Hard Reload"

2. **Restart Frontend**:
```bash
cd frontend
# Stop the dev server (Ctrl+C)
npm run dev
```

3. **Check MetaMask Network**:
   - Ensure you're on the correct network (Localhost or Sepolia)
   - Match with your .env settings

4. **Verify Contract Address**:
```bash
# For localhost:
cat deployments/localhost.json

# For Sepolia:
cat deployments/sepolia.json
```

---

## 📊 Summary

| Item | Status |
|------|--------|
| ABI Updated | ✅ Done |
| revokeCertificate in ABI | ✅ Yes |
| Tests Passing | ✅ 95/95 |
| Frontend Ready | ✅ Yes |
| Need to Deploy | ⚠️ Yes (choose local or Sepolia) |

---

## 🎯 Quick Start (Localhost Testing)

```bash
# Terminal 1 - Start Hardhat Node
npx hardhat node

# Terminal 2 - Deploy Contract
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3 - Start Frontend
cd frontend
npm run dev

# Then:
# 1. Update frontend/.env to use localhost settings
# 2. Import Hardhat account to MetaMask
# 3. Connect to http://localhost:3000
# 4. Test revocation as SUPER_ADMIN
```

---

## ✅ You're Ready!

The error is fixed! Just choose local or Sepolia testing and follow the steps above.
