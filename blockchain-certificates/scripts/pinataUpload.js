import PinataSDK from "@pinata/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const pinata = new PinataSDK(
    "c0259b922ede324d6f00", 
    "34997e502475eddff752bc1852a663420090cebc20b3ecee6f19e9a14323fd64"
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, "..", "a.jpeg"); // Your file path
const readableStreamForFile = fs.createReadStream(filePath);

// Add metadata options
const options = {
    pinataMetadata: {
        name: "MyCertificateImage", // filename or custom name
        keyvalues: {
            project: "Blockchain Certificate NFT"
        }
    },
    pinataOptions: {
        cidVersion: 1
    }
};

async function uploadFile() {
    try {
        const result = await pinata.pinFileToIPFS(readableStreamForFile, options);
        console.log("File uploaded:", result.IpfsHash);
        console.log("IPFS URL:", `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`);
    } catch (error) {
        console.error("Error uploading file:", error);
    }
}

uploadFile();
