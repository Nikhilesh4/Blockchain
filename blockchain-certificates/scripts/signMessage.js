import { ethers } from "ethers";
import signatureVerification from "../services/signatureVerification.js";
import readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

/**
 * Interactive script to sign certificate issuance requests
 * This simulates what happens in MetaMask
 */
async function main() {
    console.log("\n🔐 Certificate Issuance Signature Tool");
    console.log("=" .repeat(60));
    console.log("This tool helps you generate admin signatures for testing.");
    console.log("In production, use MetaMask in the frontend.\n");

    try {
        // Get certificate details
        const name = await question("Enter recipient name: ");
        const recipientAddress = await question("Enter recipient address: ");
        const grade = await question("Enter grade (e.g., A+, B-, etc.): ");
        
        // Validate address
        if (!ethers.isAddress(recipientAddress)) {
            throw new Error("Invalid Ethereum address!");
        }

        const timestamp = Math.floor(Date.now() / 1000);

        console.log("\n📋 Certificate Details:");
        console.log(`   Name: ${name}`);
        console.log(`   Recipient: ${recipientAddress}`);
        console.log(`   Grade: ${grade}`);
        console.log(`   Timestamp: ${timestamp}`);

        // Create message
        const message = signatureVerification.createMessageHash({
            name,
            recipientAddress,
            grade,
            timestamp
        });

        console.log("\n📝 Message to sign:");
        console.log(message);

        // Choose signing method
        console.log("\n🔑 Select signing method:");
        console.log("   1. Use local private key (for testing)");
        console.log("   2. Generate MetaMask code (for production)");
        
        const choice = await question("\nEnter choice (1 or 2): ");

        if (choice === "1") {
            // Sign with local private key
            const privateKey = await question("\nEnter admin private key (or press Enter for default test key): ");
            
            let wallet;
            if (privateKey.trim()) {
                wallet = new ethers.Wallet(privateKey);
            } else {
                // Use default Hardhat account #0
                wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
                console.log("⚠️  Using default Hardhat test account");
            }

            const signature = await wallet.signMessage(message);
            const adminAddress = wallet.address;

            console.log("\n✅ Signature generated!");
            console.log("=" .repeat(60));
            console.log(`Admin Address: ${adminAddress}`);
            console.log(`Signature: ${signature}`);
            console.log("=" .repeat(60));

            // Verify signature
            const isValid = await signatureVerification.verifyAdminSignature(
                { name, recipientAddress, grade, timestamp },
                signature,
                adminAddress
            );

            if (isValid) {
                console.log("\n✅ Signature verified successfully!");
                
                // Save to file for easy use
                const data = {
                    certificateData: {
                        name,
                        recipientAddress,
                        grade,
                        timestamp,
                        adminAddress
                    },
                    signature,
                    message,
                    generatedAt: new Date().toISOString()
                };

                const fs = await import("fs");
                const path = await import("path");
                const outputFile = path.join(process.cwd(), "signature-output.json");
                fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
                
                console.log(`\n💾 Signature data saved to: ${outputFile}`);
                console.log("\n💡 You can now use this signature with:");
                console.log(`   ADMIN_SIGNATURE="${signature}" npx hardhat run scripts/issueCertificate.js --network localhost`);
            } else {
                console.log("\n❌ Signature verification failed!");
            }

        } else if (choice === "2") {
            // Generate MetaMask code
            console.log("\n📱 MetaMask Integration Code:");
            console.log("=" .repeat(60));
            console.log(`
// Frontend JavaScript code to sign with MetaMask

async function signCertificateRequest() {
    if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
    }

    try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Certificate data
        const data = {
            name: "${name}",
            recipientAddress: "${recipientAddress}",
            grade: "${grade}",
            timestamp: ${timestamp}
        };
        
        // Create message
        const message = \`Certificate Issuance Request
Name: \${data.name}
Recipient: \${data.recipientAddress}
Grade: \${data.grade}
Timestamp: \${data.timestamp}\`;
        
        // Sign with MetaMask
        const signature = await signer.signMessage(message);
        const adminAddress = await signer.getAddress();
        
        console.log("Admin Address:", adminAddress);
        console.log("Signature:", signature);
        
        // Send to backend
        const response = await fetch('/api/issue-certificate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                certificateData: {
                    ...data,
                    adminAddress,
                    contractAddress: "YOUR_CONTRACT_ADDRESS"
                },
                signature
            })
        });
        
        const result = await response.json();
        console.log("Certificate issued:", result);
        
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to sign: " + error.message);
    }
}

// Call the function
signCertificateRequest();
            `);
            console.log("=" .repeat(60));
            console.log("\n💡 Copy this code to your frontend and connect MetaMask!");

        } else {
            console.log("Invalid choice!");
        }

    } catch (error) {
        console.error("\n❌ Error:", error.message);
    } finally {
        rl.close();
    }
}

main();