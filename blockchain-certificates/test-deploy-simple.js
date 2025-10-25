// Simple test to deploy using direct ethers import
import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
    console.log("Network:", hre.network.name);
    
    // Get the network config
    const networkConfig = hre.config.networks.sepolia;
    console.log("Network config type:", networkConfig.type);
    
    // Try to access network provider through hre.network
    if (hre.network.provider) {
        console.log("✅ Network provider available!");
        
        // In Hardhat 3, we might need to create ethers wrapper manually
        const provider = new ethers.BrowserProvider(hre.network.provider);
        console.log("Created ethers provider");
        
        const signer = await provider.getSigner();
        console.log("Signer address:", await signer.getAddress());
    } else {
        console.log("❌ No network provider");
    }
}

main().catch(console.error);
