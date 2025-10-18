import { createCanvas, loadImage, registerFont } from "canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ethers } from "ethers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a certificate image with user details
 * @param {Object} details - { name, grade, recipientAddress, issuedDate }
 * @returns {Promise<Buffer>} - Certificate image buffer
 */
export async function generateCertificateImage(details) {
    const { name, grade, recipientAddress, issuedDate } = details;
    
    // Create canvas (1920x1080 - standard certificate size)
    const width = 1920;
    const height = 1080;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#1e3c72");
    gradient.addColorStop(1, "#2a5298");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 20;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // Inner border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;
    ctx.strokeRect(60, 60, width - 120, height - 120);

    // Title
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 80px Arial";
    ctx.textAlign = "center";
    ctx.fillText("CERTIFICATE OF ACHIEVEMENT", width / 2, 200);

    // Subtitle
    ctx.fillStyle = "#ffffff";
    ctx.font = "italic 40px Arial";
    ctx.fillText("This is to certify that", width / 2, 300);

    // Recipient Name (larger and prominent)
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 90px Arial";
    ctx.fillText(name, width / 2, 430);

    // Achievement text
    ctx.fillStyle = "#ffffff";
    ctx.font = "35px Arial";
    ctx.fillText("has successfully completed the Blockchain Development Course", width / 2, 540);
    ctx.fillText(`with an outstanding grade of`, width / 2, 600);

    // Grade (highlighted)
    ctx.fillStyle = "#00ff00";
    ctx.font = "bold 70px Arial";
    ctx.fillText(grade, width / 2, 700);

    // Date
    ctx.fillStyle = "#ffffff";
    ctx.font = "30px Arial";
    ctx.fillText(`Issued on: ${issuedDate}`, width / 2, 800);

    // Wallet address (truncated)
    const truncatedAddress = `${recipientAddress.slice(0, 10)}...${recipientAddress.slice(-8)}`;
    ctx.font = "25px monospace";
    ctx.fillStyle = "#cccccc";
    ctx.fillText(`Wallet: ${truncatedAddress}`, width / 2, 860);

    // Blockchain verification text
    ctx.font = "italic 22px Arial";
    ctx.fillStyle = "#aaaaaa";
    ctx.fillText("Verified on Blockchain - Immutable & Permanent", width / 2, 920);

    // Decorative elements
    drawSeal(ctx, 300, 950, 80);
    drawSeal(ctx, width - 300, 950, 80);

    return canvas.toBuffer("image/png");
}

/**
 * Draw a decorative seal
 */
function drawSeal(ctx, x, y, radius) {
    // Outer circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd700";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
    ctx.strokeStyle = "#1e3c72";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Star in center
    drawStar(ctx, x, y, 5, radius * 0.5, radius * 0.25);
}

/**
 * Draw a star shape
 */
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = "#1e3c72";
    ctx.fill();
}

/**
 * Save certificate image to file
 */
export async function saveCertificateImage(imageBuffer, filename) {
    const outputDir = path.join(process.cwd(), "generated-certificates");
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, imageBuffer);
    
    console.log(`✅ Certificate saved to: ${filePath}`);
    return filePath;
}

/**
 * Create the message that needs to be signed
 * @param {Object} certificateData - { name, recipientAddress, grade, timestamp }
 * @returns {string} - Formatted message
 */
function createSignatureMessage(certificateData) {
    const { name, recipientAddress, grade, timestamp } = certificateData;
    
    return `Certificate Issuance Request
Name: ${name}
Recipient: ${recipientAddress}
Grade: ${grade}
Timestamp: ${timestamp}`;
}

/**
 * Verify admin signature
 * @param {Object} certificateData - { name, recipientAddress, grade, timestamp }
 * @param {string} signature - The signature from the admin
 * @param {string} expectedAdminAddress - The admin's wallet address
 * @returns {Promise<boolean>} - True if signature is valid
 */
async function verifyAdminSignature(certificateData, signature, expectedAdminAddress) {
    try {
        // Create the message that was signed
        const message = createSignatureMessage(certificateData);
        
        console.log("\n🔐 Verifying signature...");
        console.log("Message:", message);
        console.log("Signature:", signature);
        console.log("Expected signer:", expectedAdminAddress);
        
        // Recover the address from the signature
        const recoveredAddress = ethers.verifyMessage(message, signature);
        
        console.log("Recovered address:", recoveredAddress);
        
        // Compare addresses (case-insensitive)
        const isValid = recoveredAddress.toLowerCase() === expectedAdminAddress.toLowerCase();
        
        if (isValid) {
            console.log("✅ Signature verified successfully!");
        } else {
            console.log("❌ Signature verification failed!");
            console.log(`Expected: ${expectedAdminAddress}`);
            console.log(`Got: ${recoveredAddress}`);
        }
        
        return isValid;
        
    } catch (error) {
        console.error("❌ Signature verification error:", error.message);
        return false;
    }
}

/**
 * Sign a message (for testing purposes)
 * @param {Object} certificateData - Certificate data
 * @param {string} privateKey - Private key to sign with
 * @returns {Promise<string>} - Signature
 */
async function signMessage(certificateData, privateKey) {
    try {
        const message = createSignatureMessage(certificateData);
        const wallet = new ethers.Wallet(privateKey);
        const signature = await wallet.signMessage(message);
        
        console.log("\n🔏 Message signed successfully!");
        console.log("Signer address:", wallet.address);
        console.log("Signature:", signature);
        
        return signature;
        
    } catch (error) {
        console.error("❌ Signing error:", error.message);
        throw error;
    }
}

/**
 * Get the signer address from a signature
 * @param {Object} certificateData - Certificate data
 * @param {string} signature - Signature to verify
 * @returns {string} - Recovered address
 */
function getSignerAddress(certificateData, signature) {
    try {
        const message = createSignatureMessage(certificateData);
        return ethers.verifyMessage(message, signature);
    } catch (error) {
        console.error("❌ Error recovering signer:", error.message);
        throw error;
    }
}

export default {
    generateCertificateImage,
    saveCertificateImage,
    verifyAdminSignature,
    signMessage,
    getSignerAddress,
    createSignatureMessage
};