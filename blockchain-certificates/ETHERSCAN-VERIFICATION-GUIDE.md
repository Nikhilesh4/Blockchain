# 🔍 How to Verify Your Contract on Etherscan

Your contract is deployed at: **`0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4`**

Currently verified on: ✅ **Blockscout**
https://eth-sepolia.blockscout.com/address/0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4

---

## 📋 Steps to Verify on Etherscan

### Step 1: Get Etherscan API Key (FREE)

1. Go to: https://etherscan.io/register
2. Create a free account
3. Verify your email
4. Go to: https://etherscan.io/myapikey
5. Click "Add" to create a new API key
6. Copy your API key (looks like: `ABC123DEF456...`)

---

### Step 2: Add API Key to Configuration

Add this line to your root `.env` file:

```bash
# Etherscan API Key (for contract verification)
ETHERSCAN_API_KEY=YOUR_API_KEY_HERE
```

Your `.env` should look like:
```bash
# Sepolia Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/c5e5b4b204b24547a39af9634e49e4f5
SEPOLIA_PRIVATE_KEY=ce2c29162bdbd6db2197c383cd6a12e33c3a7c00fddbd4f21f26dd5388627330

# Etherscan API Key
ETHERSCAN_API_KEY=YOUR_API_KEY_HERE
```

---

### Step 3: Update Hardhat Config

Your `hardhat.config.ts` will be automatically updated to include Etherscan configuration.

---

### Step 4: Verify Contract

Run this command:

```bash
npx hardhat verify --network sepolia 0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4 0x1841B167BF56B0A8cF999bE14197C51220cB952c
```

This tells Etherscan:
- Contract address: `0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4`
- Constructor argument: `0x1841B167BF56B0A8cF999bE14197C51220cB952c` (your deployer address)

---

## ✅ Success Indicators

After verification, you'll see:

1. **On Terminal:**
   ```
   Successfully verified contract CertificateNFT on Etherscan.
   https://sepolia.etherscan.io/address/0x21a52497...#code
   ```

2. **On Etherscan:**
   - ✅ Green checkmark next to contract
   - ✅ "Contract" tab with source code
   - ✅ "Read Contract" tab to view functions
   - ✅ "Write Contract" tab to interact

---

## 🔗 View Your Contract

**Before Verification:**
https://sepolia.etherscan.io/address/0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4

**After Verification:**
https://sepolia.etherscan.io/address/0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4#code

---

## 🎯 Quick Commands

```bash
# Get Etherscan API key from https://etherscan.io/myapikey

# Add to .env
echo "ETHERSCAN_API_KEY=YOUR_KEY" >> .env

# Verify contract
npm run verify:sepolia -- 0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4 0x1841B167BF56B0A8cF999bE14197C51220cB952c
```

---

## 🆘 Troubleshooting

### Error: "Already Verified"
**Solution:** Your contract is already verified! Just view it on Etherscan.

### Error: "Invalid API Key"
**Solution:** 
1. Double-check your API key from https://etherscan.io/myapikey
2. Make sure no extra spaces in `.env` file
3. Restart terminal/command prompt

### Error: "Unable to verify"
**Solution:**
1. Wait 1-2 minutes after deployment
2. Check contract address is correct
3. Verify constructor arguments match deployment

---

## 💡 Benefits of Etherscan Verification

✅ **Transparency** - Anyone can read your contract code  
✅ **Trust** - Users can verify contract functionality  
✅ **Interaction** - Use "Read/Write Contract" tabs  
✅ **Integration** - Better integration with dApps  
✅ **SEO** - Contract appears in search results  

---

## 📊 Your Contract Info

**Contract Address:** `0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4`  
**Network:** Sepolia Testnet  
**Deployer:** `0x1841B167BF56B0A8cF999bE14197C51220cB952c`  
**Contract Name:** CertificateNFT  
**Compiler:** Solidity 0.8.28  

---

## 🎉 After Verification

Your contract will be:
- ✅ Viewable on Etherscan with source code
- ✅ Verifiable by anyone
- ✅ Searchable on Google
- ✅ Trusted by users
- ✅ Featured in Etherscan contract directory

**Go get your API key and verify now!** 🚀
