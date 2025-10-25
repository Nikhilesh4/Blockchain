# 🔧 MetaMask Network Connection Fix

## Issue: MetaMask showing "localhost" instead of Sepolia

---

## ✅ Solution Steps

### Step 1: Check Environment Variables
Your `frontend/.env` should have:
```bash
VITE_NETWORK_NAME=sepolia
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://sepolia.infura.io/v3/c5e5b4b204b24547a39af9634e49e4f5
VITE_CONTRACT_ADDRESS=0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4
```

### Step 2: Restart Frontend Server
**IMPORTANT:** Environment variables are loaded when the server starts!

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd frontend
npm run dev
```

### Step 3: Clear Browser Cache
```
1. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
2. Or clear browser cache completely
3. Close and reopen the browser tab
```

### Step 4: Switch MetaMask Network Manually
```
1. Open MetaMask
2. Click the network dropdown at the top
3. Select "Sepolia test network"
4. If not visible:
   - Click Settings > Advanced > Show test networks (ON)
   - Go back and select Sepolia
```

### Step 5: Reconnect Wallet
```
1. Disconnect wallet if already connected
2. Click "Connect MetaMask" again
3. Select your account
4. Confirm connection
```

---

## 🔍 Verify It's Working

After connecting, you should see:
- ✅ Network shows "Sepolia" in your app
- ✅ MetaMask shows "Sepolia test network"
- ✅ Balance shows your Sepolia ETH (0.036 ETH)
- ✅ Contract address: 0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4

---

## 🚨 Common Issues

### Issue 1: Still shows "localhost"
**Cause:** Frontend server not restarted after .env change
**Solution:** 
```bash
# Kill all running dev servers
pkill -f "vite"
# Restart
cd frontend && npm run dev
```

### Issue 2: "Switch to Sepolia Testnet" button appears
**Cause:** MetaMask is on wrong network
**Solution:** Click the button! It will switch automatically

### Issue 3: "Wrong network" error
**Cause:** ChainID mismatch
**Solution:** 
1. Check MetaMask is on Sepolia (Chain ID: 11155111)
2. Check `.env` has VITE_CHAIN_ID=11155111
3. Restart frontend server

### Issue 4: Can't find Sepolia in MetaMask
**Solution:**
1. MetaMask > Settings > Advanced
2. Enable "Show test networks"
3. Go back to network dropdown
4. Select "Sepolia test network"

---

## 📊 Quick Checklist

Before testing, verify:
- [ ] `.env` file has Sepolia configuration
- [ ] Frontend dev server restarted after .env changes
- [ ] Browser cache cleared (hard refresh)
- [ ] MetaMask switched to Sepolia network
- [ ] Wallet has Sepolia ETH (check on MetaMask)

---

## 🎯 Test Your Setup

1. **Open app:** http://localhost:3002 (or your port)
2. **Connect MetaMask**
3. **Check displayed info:**
   - Network should show "sepolia"
   - Chain ID should be 11155111
   - Address should match your MetaMask
4. **Try verifying a certificate** (no wallet needed!)
5. **Try minting** (if you have ADMIN role)

---

## 🆘 Still Not Working?

### Debug Mode:
Open browser console (F12) and check for:
```javascript
// You should see:
console.log(import.meta.env.VITE_NETWORK_NAME) // "sepolia"
console.log(import.meta.env.VITE_CHAIN_ID) // "11155111"
console.log(import.meta.env.VITE_CONTRACT_ADDRESS) // "0x21a52..."
```

If these show `undefined`:
1. Check variable names start with `VITE_`
2. Restart dev server
3. Check `.env` file location (must be in `frontend/` folder)

---

## ✅ Success Indicators

When everything works correctly:
- 🟢 MetaMask shows "Sepolia test network"
- 🟢 App shows Sepolia network name
- 🟢 Can verify certificates
- 🟢 Transactions go to Sepolia (check Etherscan)
- 🟢 No "switch network" warnings

---

## 🔗 Useful Links

- **Your Contract:** https://sepolia.etherscan.io/address/0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4
- **Blockscout:** https://eth-sepolia.blockscout.com/address/0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4
- **Get Sepolia ETH:** https://sepoliafaucet.com/
- **Infura Dashboard:** https://infura.io/dashboard

---

## 📝 Notes

- Environment variables in Vite must start with `VITE_`
- Changes to `.env` require server restart
- Browser caching can show old values
- MetaMask network must match app configuration
