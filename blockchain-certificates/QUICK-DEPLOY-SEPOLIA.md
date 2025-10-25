# ⚡ Quick Deploy to Sepolia - TL;DR

Fast track guide to deploy to Sepolia testnet in 5 minutes!

---

## 🎯 Prerequisites

- [ ] MetaMask installed
- [ ] Sepolia ETH in wallet (get from [sepoliafaucet.com](https://sepoliafaucet.com))
- [ ] Infura/Alchemy RPC URL

---

## 🚀 3 Steps to Deploy

### Step 1: Configure Environment

Update `.env` in root folder:
```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
SEPOLIA_PRIVATE_KEY=YOUR_METAMASK_PRIVATE_KEY
```

Update `frontend/.env`:
```bash
VITE_NETWORK_NAME=sepolia
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
VITE_CONTRACT_ADDRESS=
```

### Step 2: Deploy Contract

```bash
# Compile contracts
npm run compile

# Deploy to Sepolia
npm run deploy:sepolia
```

**Copy the contract address from the output!**

### Step 3: Update Frontend

Add contract address to `frontend/.env`:
```bash
VITE_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
```

---

## ✅ Test It!

```bash
# Start frontend
cd frontend
npm run dev
```

1. Open http://localhost:5173
2. Connect MetaMask (switch to Sepolia)
3. Mint a test certificate
4. Verify it works!

---

## 📊 Verify on Etherscan

Visit: `https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS`

---

## 🔄 Switch Back to Localhost

To test on localhost again, update `frontend/.env`:

```bash
VITE_NETWORK_NAME=localhost
VITE_CHAIN_ID=31337
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Insufficient funds | Get more ETH from [sepoliafaucet.com](https://sepoliafaucet.com) |
| Wrong network | Switch MetaMask to Sepolia |
| Contract not found | Update `VITE_CONTRACT_ADDRESS` in `frontend/.env` |
| Images not loading | Wait 1-2 mins for IPFS propagation |

---

## 📚 Need More Details?

See full guide: [SEPOLIA-DEPLOYMENT-GUIDE.md](./SEPOLIA-DEPLOYMENT-GUIDE.md)

---

**🎉 That's it! You're live on Sepolia!**
