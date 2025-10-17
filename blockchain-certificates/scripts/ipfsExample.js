import ipfsService from "../services/ipfs.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    try {
        // Test connection
        console.log("Testing Pinata connection...");
        await ipfsService.testConnection();
        
        // Example 1: Upload image only
        console.log("\n--- Example 1: Upload Image ---");
        const imagePath = path.join(__dirname, "..", "a.jpeg");
        const imageResult = await ipfsService.uploadCertificateImage(imagePath, "example-certificate");
        
        // Example 2: Upload metadata only
        console.log("\n--- Example 2: Upload Metadata ---");
        const metadata = {
            name: "Example Certificate",
            description: "This is an example certificate",
            image: imageResult.ipfsUrl,
            issuer: "Example University",
            attributes: [
                { trait_type: "Course", value: "Blockchain Development" },
                { trait_type: "Grade", value: "A+" }
            ]
        };
        const metadataResult = await ipfsService.uploadMetadata(metadata);
        
        // Example 3: Complete workflow
        console.log("\n--- Example 3: Complete Workflow ---");
        const completeResult = await ipfsService.uploadCompleteCertificate(
            imagePath,
            {
                name: "Complete Certificate Example",
                description: "Complete workflow example",
                issuer: "Example University"
            }
        );
        
        console.log("\n✅ All examples completed successfully!");
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

main();