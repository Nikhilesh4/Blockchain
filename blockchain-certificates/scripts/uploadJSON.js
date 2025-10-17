import ipfsService from "../services/ipfs.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const jsonPath = path.join(__dirname, "..", "a.json");
    const metadata = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    
    const result = await ipfsService.uploadMetadata(metadata, "certificate-metadata");
    
    console.log("\n📋 Result Summary:");
    console.log("Metadata Hash:", result.hash);
    console.log("Gateway URL:", result.url);
    console.log("IPFS URL (use for minting):", result.ipfsUrl);
}

main().catch(console.error);