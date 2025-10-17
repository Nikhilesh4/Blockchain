import ipfsService from "../services/ipfs.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const filePath = path.join(__dirname, "..", "a.jpeg");
    const result = await ipfsService.uploadCertificateImage(filePath, "MyCertificateImage");
    
    console.log("\n📋 Result Summary:");
    console.log("IPFS Hash:", result.hash);
    console.log("Gateway URL:", result.url);
    console.log("IPFS URL:", result.ipfsUrl);
}

main().catch(console.error);