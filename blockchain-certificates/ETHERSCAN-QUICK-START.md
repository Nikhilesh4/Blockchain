# 🎯 Quick Guide: Show Your Contract on Etherscan

## Your Contract
**Address:** `0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4`  
**Network:** Sepolia Testnet

---

## ✅ Current Status

✅ **Deployed Successfully**  
✅ **Verified on Blockscout** - https://eth-sepolia.blockscout.com/address/0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4  
⏳ **Not Yet on Etherscan** - Needs verification

---

## 🚀 3 Steps to Show on Etherscan

### Step 1: Get FREE Etherscan API Key (2 minutes)

1. Visit: **https://etherscan.io/register**
2. Create account (or login)
3. Go to: **https://etherscan.io/myapikey**
4. Click **"+ Add"** button
5. Copy your API key

### Step 2: Add API Key to Your Project

Open your `.env` file and add:

```bash
# Etherscan API Key
ETHERSCAN_API_KEY=YOUR_API_KEY_HERE
```

**Or use the automated script:**
```bash
bash scripts/setupEtherscan.sh
```

### Step 3: Verify Contract

Run this command:

```bash
npx hardhat verify --network sepolia 0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4 0x1841B167BF56B0A8cF999bE14197C51220cB952c
```

---

## ✅ Done!

After verification, your contract will appear on:
**https://sepolia.etherscan.io/address/0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4#code**

With:
- ✅ Green checkmark badge
- ✅ Source code visible
- ✅ Read/Write contract tabs
- ✅ Searchable on Google

---

## 🔗 Links

**Get API Key:** https://etherscan.io/myapikey  
**Unverified View:** https://sepolia.etherscan.io/address/0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4  
**Blockscout (Already Verified):** https://eth-sepolia.blockscout.com/address/0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4

---

## 💡 Why Verify?

- **Trust** - Users can see your contract code
- **Transparency** - Full code visibility
- **Integration** - Better dApp integration  
- **Professional** - Green checkmark badge
- **Searchable** - Appears in Etherscan search

---

**Total Time: ~5 minutes** ⏱️  
**Cost: FREE** 💰  
**Difficulty: Easy** ✨
