import pinataSDK from "@pinata/sdk";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Pinata with environment variables
const pinata = new pinataSDK(
    process.env.PINATA_API_KEY,
    process.env.PINATA_SECRET_API_KEY
);

/**
 * Test Pinata connection
 */
export async function testConnection() {
    try {
        const result = await pinata.testAuthentication();
        console.log("✅ Pinata connection successful:", result);
        return true;
    } catch (error) {
        console.error("❌ Pinata connection failed:", error.message);
        return false;
    }
}

/**
 * Upload certificate image to IPFS
 * @param {string|ReadableStream} file - File path or readable stream
 * @param {string} filename - Optional custom filename
 * @returns {Promise<Object>} - { hash, url, pinSize, timestamp }
 */
export async function uploadCertificateImage(file, filename = "certificate") {
    try {
        console.log("📤 Uploading certificate image to IPFS...");
        
        // If file is a string path, create a readable stream
        const readableStream = typeof file === 'string' 
            ? fs.createReadStream(file)
            : file;
        
        const options = {
            pinataMetadata: {
                name: filename,
                keyvalues: {
                    type: "certificate-image",
                    project: "Blockchain Certificate NFT",
                    uploadedAt: new Date().toISOString()
                }
            },
            pinataOptions: {
                cidVersion: 1
            }
        };

        const result = await pinata.pinFileToIPFS(readableStream, options);
        
        const response = {
            hash: result.IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
            ipfsUrl: `ipfs://${result.IpfsHash}`,
            pinSize: result.PinSize,
            timestamp: result.Timestamp
        };
        
        console.log("✅ Image uploaded successfully!");
        console.log(`   Hash: ${response.hash}`);
        console.log(`   URL: ${response.url}`);
        
        return response;
    } catch (error) {
        console.error("❌ Error uploading image:", error.message);
        throw error;
    }
}

/**
 * Upload certificate metadata JSON to IPFS
 * @param {Object} jsonData - Certificate metadata object
 * @param {string} name - Optional metadata name
 * @returns {Promise<Object>} - { hash, url, pinSize, timestamp }
 */
export async function uploadMetadata(jsonData, name = "certificate-metadata") {
    try {
        console.log("📤 Uploading metadata to IPFS...");
        
        // Validate metadata structure
        if (!jsonData.name || !jsonData.image) {
            throw new Error("Metadata must include 'name' and 'image' fields");
        }
        
        const options = {
            pinataMetadata: {
                name: name,
                keyvalues: {
                    type: "certificate-metadata",
                    project: "Blockchain Certificate NFT",
                    uploadedAt: new Date().toISOString(),
                    certificateName: jsonData.name
                }
            },
            pinataOptions: {
                cidVersion: 1
            }
        };

        const result = await pinata.pinJSONToIPFS(jsonData, options);
        
        const response = {
            hash: result.IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
            ipfsUrl: `ipfs://${result.IpfsHash}`,
            pinSize: result.PinSize,
            timestamp: result.Timestamp
        };
        
        console.log("✅ Metadata uploaded successfully!");
        console.log(`   Hash: ${response.hash}`);
        console.log(`   URL: ${response.url}`);
        
        return response;
    } catch (error) {
        console.error("❌ Error uploading metadata:", error.message);
        throw error;
    }
}

/**
 * Pin existing content by CID (ensure permanence)
 * @param {string} cid - Content Identifier (IPFS hash)
 * @param {string} name - Optional pin name
 * @returns {Promise<Object>} - Pin status
 */
export async function pinContent(cid, name = "pinned-content") {
    try {
        console.log(`📌 Pinning content: ${cid}...`);
        
        const options = {
            pinataMetadata: {
                name: name,
                keyvalues: {
                    type: "pinned-content",
                    pinnedAt: new Date().toISOString()
                }
            }
        };

        const result = await pinata.pinByHash(cid, options);
        
        console.log("✅ Content pinned successfully!");
        console.log(`   Hash: ${result.IpfsHash}`);
        
        return {
            hash: result.IpfsHash,
            status: result.status,
            pinned: true
        };
    } catch (error) {
        console.error("❌ Error pinning content:", error.message);
        throw error;
    }
}

/**
 * Unpin content from Pinata
 * @param {string} cid - Content Identifier to unpin
 * @returns {Promise<boolean>}
 */
export async function unpinContent(cid) {
    try {
        console.log(`🗑️  Unpinning content: ${cid}...`);
        await pinata.unpin(cid);
        console.log("✅ Content unpinned successfully!");
        return true;
    } catch (error) {
        console.error("❌ Error unpinning content:", error.message);
        throw error;
    }
}

/**
 * Get list of all pinned items
 * @param {Object} filters - Optional filters (status, metadata, etc.)
 * @returns {Promise<Array>}
 */
export async function listPinnedContent(filters = {}) {
    try {
        const result = await pinata.pinList(filters);
        return result.rows;
    } catch (error) {
        console.error("❌ Error listing pinned content:", error.message);
        throw error;
    }
}

/**
 * Upload complete certificate workflow
 * @param {string} imagePath - Path to certificate image
 * @param {Object} metadata - Certificate metadata (without image field)
 * @returns {Promise<Object>} - { imageHash, metadataHash, metadataUrl }
 */
export async function uploadCompleteCertificate(imagePath, metadata) {
    try {
        console.log("\n🚀 Starting complete certificate upload workflow...\n");
        
        // Step 1: Upload image
        const imageResult = await uploadCertificateImage(imagePath, metadata.name);
        
        // Step 2: Create complete metadata with image
        const completeMetadata = {
            ...metadata,
            image: imageResult.ipfsUrl
        };
        
        // Step 3: Upload metadata
        const metadataResult = await uploadMetadata(
            completeMetadata,
            `${metadata.name}-metadata`
        );
        
        console.log("\n✅ Complete certificate upload workflow finished!");
        console.log("=" .repeat(50));
        console.log("Image Hash:", imageResult.hash);
        console.log("Metadata Hash:", metadataResult.hash);
        console.log("Metadata URL:", metadataResult.url);
        console.log("Use this for minting:", metadataResult.ipfsUrl);
        console.log("=" .repeat(50) + "\n");
        
        return {
            imageHash: imageResult.hash,
            imageUrl: imageResult.url,
            metadataHash: metadataResult.hash,
            metadataUrl: metadataResult.url,
            metadataIpfsUrl: metadataResult.ipfsUrl
        };
    } catch (error) {
        console.error("❌ Complete certificate upload failed:", error.message);
        throw error;
    }
}

export default {
    testConnection,
    uploadCertificateImage,
    uploadMetadata,
    pinContent,
    unpinContent,
    listPinnedContent,
    uploadCompleteCertificate
};