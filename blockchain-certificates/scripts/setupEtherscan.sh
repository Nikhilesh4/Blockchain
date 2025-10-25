#!/bin/bash

# Script to add Etherscan API key to .env file

echo "=================================================="
echo "  🔍 Etherscan Contract Verification Setup"
echo "=================================================="
echo ""
echo "Your contract: 0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4"
echo ""
echo "Step 1: Get your FREE Etherscan API key"
echo "   → Go to: https://etherscan.io/myapikey"
echo "   → Login or create account"
echo "   → Create a new API key"
echo ""
read -p "Enter your Etherscan API key: " ETHERSCAN_KEY

if [ -z "$ETHERSCAN_KEY" ]; then
    echo "❌ No API key provided. Exiting."
    exit 1
fi

echo ""
echo "Adding Etherscan API key to .env file..."

# Check if ETHERSCAN_API_KEY already exists
if grep -q "ETHERSCAN_API_KEY=" .env; then
    echo "⚠️  ETHERSCAN_API_KEY already exists in .env"
    read -p "Do you want to replace it? (y/n): " REPLACE
    if [ "$REPLACE" = "y" ] || [ "$REPLACE" = "Y" ]; then
        # Remove old line and add new one
        sed -i '/ETHERSCAN_API_KEY=/d' .env
        echo "" >> .env
        echo "# Etherscan API Key (for contract verification)" >> .env
        echo "ETHERSCAN_API_KEY=$ETHERSCAN_KEY" >> .env
        echo "✅ Etherscan API key updated!"
    else
        echo "❌ Cancelled. Keeping existing API key."
        exit 0
    fi
else
    # Add new key
    echo "" >> .env
    echo "# Etherscan API Key (for contract verification)" >> .env
    echo "ETHERSCAN_API_KEY=$ETHERSCAN_KEY" >> .env
    echo "✅ Etherscan API key added to .env!"
fi

echo ""
echo "=================================================="
echo "  ✅ Setup Complete!"
echo "=================================================="
echo ""
echo "Now verify your contract with:"
echo ""
echo "  npx hardhat verify --network sepolia \\"
echo "    0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4 \\"
echo "    0x1841B167BF56B0A8cF999bE14197C51220cB952c"
echo ""
echo "Or use the npm script:"
echo ""
echo "  npm run verify:sepolia -- \\"
echo "    0x21a52497CfA2184AF8Eac91374DB4f4865c0d0c4 \\"
echo "    0x1841B167BF56B0A8cF999bE14197C51220cB952c"
echo ""
echo "=================================================="
