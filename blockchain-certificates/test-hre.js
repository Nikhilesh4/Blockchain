import hre from "hardhat";
import { ethers } from "ethers";

async function test() {
    console.log("Keys in hre:", Object.keys(hre));
    
    // Try to create a provider from network config
    const networkConfig = hre.config.networks.sepolia;
    console.log("\nNetwork config:", networkConfig);
    
    if (networkConfig && 'url' in networkConfig && networkConfig.url) {
        const provider = new ethers.JsonRpcProvider(networkConfig.url);
        console.log("\nCreated provider:", !!provider);
        
        const network = await provider.getNetwork();
        console.log("Network chainId:", network.chainId);
    }
}

test().catch(console.error);



