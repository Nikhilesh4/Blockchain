import { network } from "hardhat";
import certificateGenerator from "../services/certificateGenerator.js";
import ipfsService from "../services/ipfs.js";
import signatureVerification from "../services/signatureVerification.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { ethers } = await network.connect();

/**
 * Verify if the contract is deployed at the given address
 */
async function verifyContractDeployment(contractAddress, provider) {
    try {
        const code = await provider.getCode(contractAddress);
        if (code === "0x" || code === "0x0") {
            throw new Error(
                `❌ No contract deployed at address ${contractAddress}\n` +
                `   Please deploy the contract first using:\n` +
                `   npx hardhat run scripts/deploy.js --network ${network.name}`
            );
        }
        
        // Try to call a simple view function to verify it's our contract
        const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
        const certificate = CertificateNFT.attach(contractAddress);
        
        try {
            const name = await certificate.name();
            const symbol = await certificate.symbol();
            console.log(`✅ Contract verified: ${name} (${symbol})`);
            console.log(`   Address: ${contractAddress}`);
            console.log(`   Network: ${network.name}`);
        } catch (err) {
            throw new Error(
                `❌ Contract exists but doesn't match CertificateNFT interface\n` +
                `   Error: ${err.message}`
            );
        }
        
        return true;
    } catch (error) {
        throw new Error(`Contract verification failed: ${error.message}`);
    }
}

/**
 * Complete certificate issuance workflow with signature verification
 */
async function issueCertificate(certificateData, adminSignature) {
    const {
        name,
        recipientAddress,
        grade,
        timestamp,
        contractAddress,
        adminAddress
    } = certificateData;

    console.log("\n🎓 Starting Certificate Issuance Process");
    console.log("=" .repeat(60));
    console.log(`📛 Name: ${name}`);
    console.log(`👤 Recipient: ${recipientAddress}`);
    console.log(`📊 Grade: ${grade}`);
    console.log(`🔐 Admin: ${adminAddress}`);
    console.log(`📝 Contract: ${contractAddress}`);
    console.log(`🌐 Network: ${network.name}`);
    console.log("=" .repeat(60));

    try {
        // Step 0: Get provider and verify contract deployment
        console.log("\n⚙️  Step 0: Verifying contract deployment...");
        const provider = ethers.provider; // Use Hardhat's provider
        await verifyContractDeployment(contractAddress, provider);

        // Step 1: Verify admin signature
        console.log("\n⚙️  Step 1: Verifying admin signature...");
        const isValidSignature = await signatureVerification.verifyAdminSignature(
            { name, recipientAddress, grade, timestamp },
            adminSignature,
            adminAddress
        );

        if (!isValidSignature) {
            throw new Error("Invalid admin signature - signature verification failed");
        }
        console.log("✅ Admin signature verified successfully!");

        // Step 2: Generate certificate image
        console.log("\n⚙️  Step 2: Generating certificate image...");
        const issuedDate = new Date(timestamp * 1000).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        const imageBuffer = await certificateGenerator.generateCertificateImage({
            name,
            grade,
            recipientAddress,
            issuedDate
        });

        // Save locally for backup
        const filename = `certificate_${name.replace(/\s+/g, "_")}_${Date.now()}.png`;
        const localPath = await certificateGenerator.saveCertificateImage(imageBuffer, filename);
        console.log("✅ Certificate image generated!");

        // Step 3: Upload image to IPFS
        console.log("\n⚙️  Step 3: Uploading certificate image to IPFS...");
        
        // Convert buffer to readable stream for IPFS upload
        const { Readable } = await import("stream");
        const imageStream = Readable.from(imageBuffer);
        
        const imageResult = await ipfsService.uploadCertificateImage(
            imageStream,
            `certificate-${name.replace(/\s+/g, "-")}`
        );
        console.log("✅ Image uploaded to IPFS!");

        // Step 4: Create and upload metadata
        console.log("\n⚙️  Step 4: Creating and uploading metadata...");
        const metadata = {
            name: `Certificate - ${name}`,
            description: `Blockchain Development Course Certificate for ${name} with grade ${grade}`,
            image: imageResult.ipfsUrl,
            issuer: "Blockchain University",
            attributes: [
                {
                    trait_type: "Recipient Name",
                    value: name
                },
                {
                    trait_type: "Grade",
                    value: grade
                },
                {
                    trait_type: "Course",
                    value: "Blockchain Development"
                },
                {
                    trait_type: "Issue Date",
                    value: issuedDate
                },
                {
                    trait_type: "Verified",
                    value: "True"
                }
            ],
            external_url: `https://gateway.pinata.cloud/ipfs/${imageResult.hash}`,
            background_color: "1e3c72"
        };

        const metadataResult = await ipfsService.uploadMetadata(
            metadata,
            `certificate-metadata-${name.replace(/\s+/g, "-")}`
        );
        console.log("✅ Metadata uploaded to IPFS!");

        // Step 5: Mint NFT certificate
        console.log("\n⚙️  Step 5: Minting NFT certificate...");
        const [deployer] = await ethers.getSigners();
        
        console.log(`   Using signer: ${deployer.address}`);
        
        const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
        const certificate = CertificateNFT.attach(contractAddress);

        // Check if deployer is the owner
        let owner;
        try {
            owner = await certificate.owner();
            console.log(`   Contract owner: ${owner}`);
        } catch (err) {
            throw new Error(
                `❌ Failed to get contract owner. This usually means:\n` +
                `   1. Contract is not deployed at ${contractAddress}\n` +
                `   2. You're connected to the wrong network\n` +
                `   3. The contract address is incorrect\n\n` +
                `   Current network: ${network.name}\n` +
                `   Error: ${err.message}`
            );
        }
        
        if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
            throw new Error(
                `❌ Signer is not the contract owner\n` +
                `   Contract owner: ${owner}\n` +
                `   Your address:   ${deployer.address}\n\n` +
                `   Please use the owner's account to mint certificates.`
            );
        }

        const tx = await certificate.mintCertificate(recipientAddress, metadataResult.ipfsUrl);
        console.log("⏳ Waiting for transaction confirmation...");
        const receipt = await tx.wait();
        
        const tokenId = await certificate.getTotalMinted();
        console.log("✅ Certificate NFT minted successfully!");

        // Step 6: Save issuance record
        console.log("\n⚙️  Step 6: Saving issuance record...");
        const record = {
            certificateId: tokenId.toString(),
            name,
            recipientAddress,
            grade,
            issuedDate,
            adminAddress,
            adminSignature,
            imageIPFS: imageResult.ipfsUrl,
            metadataIPFS: metadataResult.ipfsUrl,
            imageGateway: imageResult.url,
            metadataGateway: metadataResult.url,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            contractAddress,
            timestamp: new Date().toISOString(),
            localImagePath: localPath
        };

        const recordsDir = path.join(process.cwd(), "issuance-records");
        if (!fs.existsSync(recordsDir)) {
            fs.mkdirSync(recordsDir, { recursive: true });
        }

        const recordPath = path.join(recordsDir, `certificate_${tokenId}_${timestamp}.json`);
        fs.writeFileSync(recordPath, JSON.stringify(record, null, 2));
        console.log(`✅ Record saved to: ${recordPath}`);

        // Print summary
        console.log("\n" + "=" .repeat(60));
        console.log("🎉 CERTIFICATE ISSUED SUCCESSFULLY!");
        console.log("=" .repeat(60));
        console.log(`📋 Certificate ID: ${tokenId}`);
        console.log(`👤 Recipient: ${recipientAddress}`);
        console.log(`📊 Grade: ${grade}`);
        console.log(`🔗 Transaction: ${receipt.hash}`);
        console.log(`📦 Block: ${receipt.blockNumber}`);
        console.log(`🖼️  Image: ${imageResult.url}`);
        console.log(`📄 Metadata: ${metadataResult.url}`);
        console.log(`💾 Local backup: ${localPath}`);
        console.log("=" .repeat(60) + "\n");

        return record;

    } catch (error) {
        console.error("\n❌ Certificate issuance failed!");
        console.error("Error:", error.message);
        
        // Provide helpful debug information
        console.error("\n🔍 Debug Information:");
        console.error(`   Network: ${network.name}`);
        console.error(`   Contract Address: ${contractAddress}`);
        console.error(`   Your Address: ${(await ethers.getSigners())[0]?.address || 'Unknown'}`);
        
        throw error;
    }
}

/**
 * Get the correct contract address for the current network
 */
function getContractAddressForNetwork() {
    const deploymentsDir = path.join(process.cwd(), "deployments");
    let networkName = network.name;
    
    // Fix for undefined network
    if (!networkName || networkName === 'undefined') {
        networkName = 'localhost';
        console.log(`⚠️  Network name was undefined, defaulting to 'localhost'`);
    }
    
    const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);

    if (fs.existsSync(deploymentFile)) {
        const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
        console.log(`📍 Using contract from ${networkName} deployment: ${deployment.contractAddress}`);
        return deployment.contractAddress;
    }
    
    // Check for undefined.json (common when network detection fails)
    const undefinedFile = path.join(deploymentsDir, "undefined.json");
    if (fs.existsSync(undefinedFile)) {
        const deployment = JSON.parse(fs.readFileSync(undefinedFile, "utf8"));
        console.log(`⚠️  Found deployment in undefined.json: ${deployment.contractAddress}`);
        console.log(`   This usually means the network wasn't properly detected during deployment.`);
        return deployment.contractAddress;
    }
    
    throw new Error(
        `❌ No deployment found for network: ${networkName}\n` +
        `   Please deploy the contract first:\n` +
        `   npx hardhat run scripts/deploy.js --network ${networkName}`
    );
}

/**
 * Example usage with command line arguments
 */
async function main() {
    const networkInfo = await ethers.provider.getNetwork();
    console.log(`\n🌐 Current Network: ${network.name || 'localhost'}`);
    console.log(`📡 Chain ID: ${networkInfo.chainId}`);
    
    // Get contract address from deployment
    let contractAddress;
    try {
        contractAddress = getContractAddressForNetwork();
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }

    // Example certificate data
    // In production, this would come from your API/frontend
    const certificateData = {
        name: "John Doe",
        recipientAddress: "0xcd3b766ccdd6ae721141f452c550ca635964ce71",
        grade: "A+",
        timestamp: Math.floor(Date.now() / 1000),
        contractAddress: contractAddress,
        adminAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" // Replace with actual admin
    };

    // Example signature - In production, this comes from MetaMask
    // To generate this, use the frontend code or run the signing script
    const adminSignature = process.env.ADMIN_SIGNATURE || 
        "0x_REPLACE_WITH_ACTUAL_SIGNATURE_FROM_METAMASK";

    if (adminSignature.startsWith("0x_REPLACE")) {
        console.error("\n❌ ERROR: Please provide a valid admin signature!");
        console.log("\n💡 To generate a signature:");
        console.log("   1. Run: node scripts/signMessage.js");
        console.log("   2. Or use the frontend with MetaMask");
        console.log("   3. Set ADMIN_SIGNATURE environment variable\n");
        process.exit(1);
    }

    await issueCertificate(certificateData, adminSignature);
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main()
        .then(() => {
            console.log("✅ Script completed successfully");
            process.exit(0);
        })
        .catch((error) => {
            console.error("Script failed:", error);
            process.exit(1);
        });
}

export default issueCertificate;