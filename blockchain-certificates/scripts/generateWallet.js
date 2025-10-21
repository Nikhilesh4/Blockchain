/**
 * Generate a new random wallet for local development
 * This creates a fresh wallet with a unique private key
 * that won't trigger MetaMask security warnings
 */

import { ethers } from "ethers";
import fs from "fs";
import path from "path";

async function main() {
    console.log("\n🔐 Generating New Wallet for Local Development");
    console.log("=".repeat(60));

    // Generate a new random wallet
    const wallet = ethers.Wallet.createRandom();

    console.log("\n✅ New Wallet Generated:");
    console.log("-".repeat(60));
    console.log(`📍 Address:     ${wallet.address}`);
    console.log(`🔑 Private Key: ${wallet.privateKey}`);
    console.log("-".repeat(60));

    // Create .env.new file with the new credentials
    const envContent = `# New Generated Wallet (Safe for Local Development)
# Generated on: ${new Date().toISOString()}

# Server Configuration
PORT=5000
NODE_ENV=development

# Blockchain Configuration
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
RPC_URL=http://127.0.0.1:8545
NETWORK=localhost

# Pinata API Credentials (Get from https://pinata.cloud/)
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_API_KEY=your_pinata_secret_key_here

# NEW Generated Admin Wallet (Replace in your .env)
PRIVATE_KEY=${wallet.privateKey}
ADMIN_ADDRESSES=${wallet.address}

# Sepolia Configuration (Optional - for testnet deployment)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
SEPOLIA_PRIVATE_KEY=${wallet.privateKey}

# IPFS Configuration
IPFS_HOST=ipfs.infura.io
IPFS_PORT=5001
IPFS_PROTOCOL=https

# Security
CORS_ORIGIN=http://localhost:3000,http://localhost:5000
`;

    const envFilePath = path.join(process.cwd(), ".env.new");
    fs.writeFileSync(envFilePath, envContent);

    console.log("\n📄 Configuration saved to .env.new");
    console.log("\n📋 Next Steps:");
    console.log("-".repeat(60));
    console.log("1. Fund your new account:");
    console.log("   npx hardhat console --network localhost");
    console.log("   Then run:");
    console.log(`   const [deployer] = await ethers.getSigners()`);
    console.log(`   const tx = await deployer.sendTransaction({`);
    console.log(`     to: "${wallet.address}",`);
    console.log(`     value: ethers.parseEther("10.0")`);
    console.log(`   })`);
    console.log(`   await tx.wait()`);
    console.log("");
    console.log("2. Replace your .env file:");
    console.log("   mv .env .env.backup");
    console.log("   mv .env.new .env");
    console.log("");
    console.log("3. Import to MetaMask:");
    console.log("   - Open MetaMask");
    console.log("   - Click account icon → 'Import Account'");
    console.log("   - Paste the private key shown above");
    console.log("");
    console.log("4. Redeploy your contract:");
    console.log("   npx hardhat run scripts/deploy.js --network localhost");
    console.log("-".repeat(60));

    console.log("\n⚠️  IMPORTANT SECURITY NOTES:");
    console.log("   - This is for LOCAL DEVELOPMENT ONLY");
    console.log("   - Never use this wallet with real funds");
    console.log("   - Never commit private keys to git");
    console.log("   - For production, use a hardware wallet or secure key management");
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error generating wallet:", error);
        process.exit(1);
    });
