# Fix MetaMask Security Warnings

## Problem
MetaMask is showing "Malicious address" warnings because you're using the default Hardhat test account which has a publicly known private key.

## Solution

### Option 1: Acknowledge It's a Local Test (Quick Fix)
If you're just testing locally and understand the risks:

1. **In MetaMask**: Check the box "I have acknowledged the alerts and still want to proceed"
2. Click "Confirm" to proceed
3. **IMPORTANT**: This is ONLY safe for local development. Never use this account with real funds!

### Option 2: Generate a New Test Account (Recommended)
Create a new test account with a unique private key:

#### Step 1: Generate a new wallet
```bash
# In your terminal
npx hardhat console --network localhost
```

Then in the console:
```javascript
// Generate a new wallet
const wallet = ethers.Wallet.createRandom()
console.log("Address:", wallet.address)
console.log("Private Key:", wallet.privateKey)
// Exit with Ctrl+C
```

#### Step 2: Fund the new account
After you have your new address:
```bash
# Start Hardhat node if not running
npx hardhat node

# In another terminal, fund your new account
npx hardhat console --network localhost
```

In the console:
```javascript
const [deployer] = await ethers.getSigners()
const newAddress = "YOUR_NEW_ADDRESS_HERE" // Replace with generated address
const tx = await deployer.sendTransaction({
  to: newAddress,
  value: ethers.parseEther("10.0") // Send 10 ETH
})
await tx.wait()
console.log("Funded!")
```

#### Step 3: Update your .env file
```env
# Replace the PRIVATE_KEY with your new one
PRIVATE_KEY=YOUR_NEW_PRIVATE_KEY_HERE
ADMIN_ADDRESSES=YOUR_NEW_ADDRESS_HERE
```

#### Step 4: Import to MetaMask
1. Open MetaMask
2. Click the account icon → "Import Account"
3. Paste your new private key
4. You should now have a funded account without warnings!

### Option 3: Use MetaMask Account Directly
Instead of using a hardcoded private key:

1. In MetaMask, use one of the Hardhat test accounts
2. Import any of these accounts using their private keys:
   - Account #2: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
   - Account #3: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

3. Fund them from Account #0 (the one you're using now)

## Why This Happens

The account you're using (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`) is the #1 Hardhat default account. Its private key is:
- Publicly available in Hardhat documentation
- Known to everyone who uses Hardhat
- Flagged by MetaMask as a security risk

**For local development only**, this is actually fine - the warning is overly cautious. But for any real deployment, you MUST use unique private keys.

## What To Do RIGHT NOW

**For Local Testing (Easiest):**
1. Acknowledge the MetaMask warning and proceed
2. Remember: Only for localhost, never with real funds!

**For Better Security (Recommended):**
1. Follow Option 2 above to create a new test account
2. This removes the warnings and is better practice

## Important Security Notes

⚠️ **NEVER use these accounts on real networks (mainnet, testnets)**
⚠️ **NEVER send real ETH to these addresses**
⚠️ **Always use fresh, unique accounts for production**

The warnings are there to protect you - they're just being extra careful about a well-known test account!
