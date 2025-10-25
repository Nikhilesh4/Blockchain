import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

async function checkBalance() {
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.SEPOLIA_PRIVATE_KEY;

    if (!rpcUrl || !privateKey) {
        console.error("❌ Missing SEPOLIA_RPC_URL or SEPOLIA_PRIVATE_KEY in .env file");
        process.exit(1);
    }

    console.log("\n🔍 Checking Sepolia Wallet Balance...\n");

    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        
        const address = wallet.address;
        const balance = await provider.getBalance(address);
        const balanceInEth = ethers.formatEther(balance);

        console.log("📍 Wallet Address:", address);
        console.log("💰 Balance:", balanceInEth, "ETH");
        
        if (parseFloat(balanceInEth) === 0) {
            console.log("\n⚠️  WARNING: Your wallet has 0 ETH!");
            console.log("📍 Get Sepolia ETH from:");
            console.log("   - https://sepoliafaucet.com/");
            console.log("   - https://www.alchemy.com/faucets/ethereum-sepolia");
            console.log("   - https://www.infura.io/faucet/sepolia");
        } else if (parseFloat(balanceInEth) < 0.01) {
            console.log("\n⚠️  WARNING: Balance is low. Deployment may fail.");
            console.log("   Consider getting more Sepolia ETH from faucets.");
        } else {
            console.log("\n✅ Balance is sufficient for deployment!");
        }

        // Check network connection
        const network = await provider.getNetwork();
        console.log("\n🌐 Network:", network.name, `(Chain ID: ${network.chainId})`);
        
        // Check block number to verify connection
        const blockNumber = await provider.getBlockNumber();
        console.log("📦 Current Block:", blockNumber);
        
        console.log("\n✅ Connection to Sepolia successful!\n");
        
    } catch (error) {
        console.error("\n❌ Error checking balance:", error.message);
        console.log("\n💡 Troubleshooting:");
        console.log("   1. Check SEPOLIA_RPC_URL is correct");
        console.log("   2. Verify your Infura project ID is valid");
        console.log("   3. Check internet connection");
        process.exit(1);
    }
}

checkBalance();
