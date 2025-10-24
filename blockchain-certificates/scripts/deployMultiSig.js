import { network } from "hardhat";
import fs from "fs";
import path from "path";

const { ethers, run } = await network.connect();

/**
 * Deploy Multi-Signature Certificate NFT
 * This replaces the single-owner contract with multi-sig governance
 */

async function main() {
    console.log("\n🔐 Deploying Multi-Signature Certificate NFT");
    console.log("=" .repeat(60));

    // Get deployer account
    const [deployer, issuer1, issuer2, issuer3] = await ethers.getSigners();
    const deployerAddress = deployer.address;
    const balance = await ethers.provider.getBalance(deployerAddress);
    
    console.log("\n👤 Deployer Information:");
    console.log(`   Address: ${deployerAddress}`);
    console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);

    // Check if deployer has enough balance
    if (balance === 0n) {
        throw new Error("❌ Deployer account has no balance!");
    }

    console.log("\n📦 Deploying MultiSigCertificateNFT contract...");
    
    // Deploy contract with deployer as initial admin
    const MultiSigCertificateNFT = await ethers.getContractFactory("MultiSigCertificateNFT");
    const certificate = await MultiSigCertificateNFT.deploy(deployerAddress);
    
    console.log("⏳ Waiting for deployment transaction...");
    await certificate.waitForDeployment();
    
    const contractAddress = await certificate.getAddress();
    const deploymentTx = certificate.deploymentTransaction();
    
    console.log("\n✅ Contract Deployed Successfully!");
    console.log("=" .repeat(60));
    console.log(`📍 Contract Address: ${contractAddress}`);
    console.log(`🔗 Transaction Hash: ${deploymentTx.hash}`);
    console.log("=" .repeat(60));

    // Get contract details
    console.log("\n📋 Initial Contract Configuration:");
    const name = await certificate.name();
    const symbol = await certificate.symbol();
    const requiredApprovals = await certificate.requiredApprovals();
    
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Required Approvals: ${requiredApprovals}`);
    console.log(`   Initial Admin: ${deployerAddress}`);

    // Setup additional issuers (if running on localhost with multiple accounts)
    if (network.name === "localhost" || network.name === "hardhat") {
        console.log("\n👥 Setting up additional issuers (for testing)...");
        
        try {
            // Add issuer1
            if (issuer1) {
                console.log(`   Adding issuer: ${issuer1.address}`);
                await certificate.addIssuer(issuer1.address);
            }
            
            // Add issuer2
            if (issuer2) {
                console.log(`   Adding issuer: ${issuer2.address}`);
                await certificate.addIssuer(issuer2.address);
            }
            
            console.log("✅ Additional issuers added successfully!");
            
            console.log("\n🔐 Multi-Signature Setup:");
            console.log(`   Issuer 1 (Admin): ${deployerAddress}`);
            console.log(`   Issuer 2: ${issuer1.address}`);
            console.log(`   Issuer 3: ${issuer2.address}`);
            console.log(`   Required Approvals: ${requiredApprovals} out of 3 issuers`);
            
        } catch (error) {
            console.log("⚠️  Could not add additional issuers (may not have enough test accounts)");
        }
    }

    // Save deployment info
    console.log("\n💾 Saving deployment artifacts...");
    saveDeploymentInfo(network.name, contractAddress, deployerAddress);
    saveContractABI("MultiSigCertificateNFT");

    // Print usage instructions
    console.log("\n" + "=" .repeat(60));
    console.log("🎉 MULTI-SIG DEPLOYMENT COMPLETE!");
    console.log("=" .repeat(60));
    
    console.log("\n📝 How Multi-Sig Works:");
    console.log("   1. Any issuer can REQUEST a certificate");
    console.log("   2. Minimum 2 issuers must APPROVE the request");
    console.log("   3. Once threshold met, certificate is AUTO-MINTED");
    console.log("   4. No single person can issue certificates alone");
    
    console.log("\n💡 Example Usage:");
    console.log("   // Issuer 1 requests certificate");
    console.log(`   await contract.requestCertificate(recipient, metadataURI);`);
    console.log("   ");
    console.log("   // Issuer 2 approves (auto-mints when threshold met)");
    console.log(`   await contract.approveCertificate(requestId);`);
    
    console.log("\n🔧 Management Commands:");
    console.log("   Add issuer:    contract.addIssuer(address)");
    console.log("   Remove issuer: contract.removeIssuer(address)");
    console.log("   Update threshold: contract.updateRequiredApprovals(newNumber)");
    
    console.log("\n📁 Deployment Files:");
    console.log(`   Contract Address: deployments/${network.name}.json`);
    console.log(`   ABI: deployments/abi/MultiSigCertificateNFT.json`);
    
    console.log("\n");
}

/**
 * Save contract deployment information
 */
function saveDeploymentInfo(networkName, contractAddress, deployer) {
    const deploymentsDir = path.join(process.cwd(), "deployments");
    
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentInfo = {
        network: networkName,
        contractName: "MultiSigCertificateNFT",
        contractAddress: contractAddress,
        deployer: deployer,
        deployedAt: new Date().toISOString(),
        blockNumber: null,
        isMultiSig: true,
        requiredApprovals: 2
    };

    const filePath = path.join(deploymentsDir, `${networkName}-multisig.json`);
    fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`📄 Deployment info saved to: ${filePath}`);
}

/**
 * Save contract ABI
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

// Execute deployment
main()
    .then(() => {
        console.log("✅ Deployment script completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed!");
        console.error("=" .repeat(60));
        console.error("Error:", error.message);
        if (error.stack) {
            console.error("\nStack trace:");
            console.error(error.stack);
        }
        console.error("=" .repeat(60));
        process.exit(1);
    });