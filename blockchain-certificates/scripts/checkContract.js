import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
    const contractAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
    
    console.log("Checking contract at:", contractAddress);
    
    // Check if there's code at the address
    const code = await ethers.provider.getCode(contractAddress);
    console.log("Contract code length:", code.length);
    console.log("Has code:", code !== "0x");
    
    if (code === "0x") {
        console.log("❌ NO CONTRACT DEPLOYED AT THIS ADDRESS!");
        console.log("The local Hardhat node was probably restarted.");
        console.log("Please redeploy using: npx hardhat run scripts/deploy.js --network localhost");
        return;
    }
    
    // Try to interact with the contract
    try {
        const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
        const contract = CertificateNFT.attach(contractAddress);
        
        const name = await contract.name();
        const symbol = await contract.symbol();
        const owner = await contract.owner();
        const totalMinted = await contract.getTotalMinted();
        
        console.log("\n✅ Contract is deployed and working!");
        console.log("Name:", name);
        console.log("Symbol:", symbol);
        console.log("Owner:", owner);
        console.log("Total Minted:", totalMinted.toString());
    } catch (error) {
        console.error("❌ Error interacting with contract:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
