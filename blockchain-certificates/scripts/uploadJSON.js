import pinataSDK from "@pinata/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Replace with your Pinata API keys
const pinata = new pinataSDK("c0259b922ede324d6f00", "34997e502475eddff752bc1852a663420090cebc20b3ecee6f19e9a14323fd64");

async function uploadJSON() {
    try {
        // ES modules don't have __dirname, so we need to recreate it
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        
        // Path to a.json in the parent directory
        const jsonPath = path.join(__dirname, "..", "a.json");
        const metadata = JSON.parse(fs.readFileSync(jsonPath)); // read a.json
        const result = await pinata.pinJSONToIPFS(metadata);
        console.log("Metadata uploaded successfully!");
        console.log("Metadata IPFS Hash (CID):", result.IpfsHash);
        console.log("Metadata URL:", `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`);
    } catch (error) {
        console.error("Error uploading JSON:", error);
    }
}

uploadJSON();
