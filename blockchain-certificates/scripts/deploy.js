import { network } from "hardhat";
import fs from "fs";
import path from "path";

const { ethers, run } = await network.connect();

/**
 * Save contract deployment information to a JSON file
 */
function saveDeploymentInfo(networkName, contractAddress, deployer) {
    const deploymentsDir = path.join(process.cwd(), "deployments");
    
    // Create deployments directory if it doesn't exist
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentInfo = {
        network: networkName,
        contractName: "CertificateNFT",
        contractAddress: contractAddress,
        address: contractAddress, // Add alias for compatibility
        deployer: deployer,
        deployedAt: new Date().toISOString(),
        blockNumber: null, // Will be filled after deployment
    };

    const filePath = path.join(deploymentsDir, `${networkName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`📄 Deployment info saved to: ${filePath}`);
}

/**
 * Save contract ABI to a JSON file
 */
function saveContractABI(contractName) {
    const artifactsDir = path.join(process.cwd(), "artifacts", "contracts", `${contractName}.sol`);
    const abiSource = path.join(artifactsDir, `${contractName}.json`);
    
    if (!fs.existsSync(abiSource)) {
        console.warn(`⚠️  ABI file not found at ${abiSource}`);
        return;
    }

    const artifact = JSON.parse(fs.readFileSync(abiSource, "utf8"));
    
    const abiDir = path.join(process.cwd(), "deployments", "abi");
    if (!fs.existsSync(abiDir)) {
        fs.mkdirSync(abiDir, { recursive: true });
    }

    const abiPath = path.join(abiDir, `${contractName}.json`);
    fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
    
    console.log(`📄 ABI saved to: ${abiPath}`);
}

/**
 * Verify contract on block explorer
 */
async function verifyContract(contractAddress, constructorArgs) {
    const networkName = network.name;
    
    // Skip verification for local networks
    if (networkName === "hardhat" || networkName === "localhost") {
        console.log("⏭️  Skipping verification on local network");
        return;
    }

    console.log("\n🔍 Verifying contract on block explorer...");
    
    try {
        // Wait a bit for the contract to be propagated
        console.log("⏳ Waiting for block confirmations...");
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: constructorArgs,
        });
        
        console.log("✅ Contract verified successfully!");
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log("✅ Contract is already verified!");
        } else {
            console.error("❌ Verification failed:", error.message);
            console.log("\n💡 You can verify manually using:");
            console.log(`npx hardhat verify --network ${networkName} ${contractAddress} ${constructorArgs.join(" ")}`);
        }
    }
}

/**
 * Get network-specific configuration
 */
function getNetworkConfig(networkName) {
    const configs = {
        hardhat: {
            name: "HardhatLocal",
            confirmations: 1,
            verify: false,
        },
        localhost: {
            name: "Localhost",
            confirmations: 1,
            verify: false,
        },
        sepolia: {
            name: "Sepolia Testnet",
            confirmations: 6,
            verify: true,
            explorer: "https://sepolia.etherscan.io",
        },
        mumbai: {
            name: "Mumbai Testnet",
            confirmations: 6,
            verify: true,
            explorer: "https://mumbai.polygonscan.com",
        },
        polygon: {
            name: "Polygon Mainnet",
            confirmations: 6,
            verify: true,
            explorer: "https://polygonscan.com",
        },
        mainnet: {
            name: "Ethereum Mainnet",
            confirmations: 6,
            verify: true,
            explorer: "https://etherscan.io",
        },
    };

    return configs[networkName] || configs.hardhat;
}

/**
 * Main deployment function
 */
async function main() {
    const networkName = network.name;
    const networkConfig = getNetworkConfig(networkName);
    
    console.log("\n🚀 Starting deployment...");
    console.log("=" .repeat(50));
    console.log(`📡 Network: ${networkConfig.name} (${networkName})`);
    console.log("=" .repeat(50));

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    const deployerAddress = deployer.address;
    const balance = await ethers.provider.getBalance(deployerAddress);
    
    console.log("\n👤 Deployer Information:");
    console.log(`   Address: ${deployerAddress}`);
    console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);

    // Check if deployer has enough balance
    if (balance === 0n) {
        throw new Error("❌ Deployer account has no balance!");
    }

    console.log("\n📦 Deploying CertificateNFT contract...");
    
    // Deploy contract
    const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
    const nft = await CertificateNFT.deploy(deployerAddress);
    
    console.log("⏳ Waiting for deployment transaction...");
    await nft.waitForDeployment();
    
    const contractAddress = await nft.getAddress();
    const deploymentTx = nft.deploymentTransaction();
    
    console.log("\n✅ Contract Deployed Successfully!");
    console.log("=" .repeat(50));
    console.log(`📍 Contract Address: ${contractAddress}`);
    console.log(`🔗 Transaction Hash: ${deploymentTx.hash}`);
    console.log(`⛽ Gas Used: ${deploymentTx.gasLimit.toString()}`);
    
    if (networkConfig.explorer) {
        console.log(`🔍 Explorer: ${networkConfig.explorer}/address/${contractAddress}`);
    }
    console.log("=" .repeat(50));

    // Wait for confirmations
    if (networkConfig.confirmations > 1) {
        console.log(`\n⏳ Waiting for ${networkConfig.confirmations} block confirmations...`);
        await deploymentTx.wait(networkConfig.confirmations);
        console.log("✅ Confirmations received!");
    }

    // Get contract details
    console.log("\n📋 Contract Details:");
    const name = await nft.name();
    const symbol = await nft.symbol();
    const owner = await nft.owner();
    const totalMinted = await nft.getTotalMinted();
    
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Owner: ${owner}`);
    console.log(`   Total Minted: ${totalMinted}`);

    // Save deployment info
    console.log("\n💾 Saving deployment artifacts...");
    saveDeploymentInfo(networkName, contractAddress, deployerAddress);
    saveContractABI("CertificateNFT");

    // Verify contract on block explorer
    if (networkConfig.verify) {
        await verifyContract(contractAddress, [deployerAddress]);
    }

    // Print summary
    console.log("\n" + "=" .repeat(50));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=" .repeat(50));
    console.log("\n📝 Next Steps:");
    console.log("   1. Test the contract by minting a certificate");
    console.log("   2. Check the deployment info in ./deployments folder");
    console.log("   3. Integrate the contract address in your frontend");
    
    if (networkConfig.verify && networkConfig.explorer) {
        console.log(`   4. View on explorer: ${networkConfig.explorer}/address/${contractAddress}`);
    }
    
    console.log("\n💡 Example commands:");
    console.log(`   - Mint: npx hardhat run scripts/mint.js --network ${networkName}`);
    console.log(`   - Verify manually: npx hardhat verify --network ${networkName} ${contractAddress} ${deployerAddress}`);
    console.log("\n");
}

// Execute deployment
main()
    .then(() => {
        console.log("✅ Script executed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed!");
        console.error("=" .repeat(50));
        console.error("Error:", error.message);
        if (error.stack) {
            console.error("\nStack trace:");
            console.error(error.stack);
        }
        console.error("=" .repeat(50));
        process.exit(1);
    });