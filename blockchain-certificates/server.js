import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import hre from "hardhat";
import { ethers as Ethers } from "ethers"; // NEW: fallback ethers import

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Only take network from HRE; ethers may be missing
const { network } = hre;

// Helper: always return a working provider
function getProvider() {
    if (hre?.ethers?.provider) return hre.ethers.provider;
    const rpcUrl =
        process.env.HARDHAT_RPC_URL ||
        process.env.RPC_URL ||
        hre?.network?.config?.url ||
        "http://127.0.0.1:8545";
    console.warn(`⚠️  Using JSON-RPC provider at ${rpcUrl}`);
    return new Ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Get contract address from deployment
 */
function getContractAddress() {
    const projectRoot = path.join(__dirname);
    const deploymentsDir = path.join(projectRoot, "deployments");
    let networkName = hre?.network?.name;

    if (!networkName || networkName === "undefined") {
        networkName = "localhost";
        console.log(`⚠️  Network name was undefined, defaulting to 'localhost'`);
    }

    console.log(`📂 Looking for deployments in: ${deploymentsDir}`);

    if (!fs.existsSync(deploymentsDir)) {
        throw new Error(
            `❌ Deployments directory not found at: ${deploymentsDir}\n` +
                `   Please deploy the contract first:\n` +
                `   npx hardhat run scripts/deploy.js --network localhost`
        );
    }

    const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);

    if (fs.existsSync(deploymentFile)) {
        const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
        console.log(`📍 Using contract from ${networkName}: ${deployment.contractAddress}`);
        return deployment.contractAddress;
    }

    const undefinedFile = path.join(deploymentsDir, "undefined.json");
    if (fs.existsSync(undefinedFile)) {
        const deployment = JSON.parse(fs.readFileSync(undefinedFile, "utf8"));
        console.warn(`⚠️  Using contract from undefined.json: ${deployment.contractAddress}`);
        return deployment.contractAddress;
    }

    const availableFiles = fs.readdirSync(deploymentsDir);
    throw new Error(
        `❌ No deployment found for network: ${networkName}\n` +
            `   Deployments directory: ${deploymentsDir}\n` +
            `   Available files: ${availableFiles.join(", ")}\n` +
            `   Please deploy the contract first:\n` +
            `   npx hardhat run scripts/deploy.js --network localhost`
    );
}

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Backend server is running" });
});

// Get contract info
app.get("/api/contract-info", async (req, res) => {
    try {
        const contractAddress = getContractAddress();
        const provider = getProvider();
        const networkInfo = await provider.getNetwork();

        const code = await provider.getCode(contractAddress);
        const isDeployed = code !== "0x" && code !== "0x0";

        res.json({
            contractAddress,
            network: network?.name || "localhost",
            chainId: networkInfo.chainId.toString(),
            isDeployed,
            rpcUrl:
                hre?.network?.config?.url ||
                process.env.HARDHAT_RPC_URL ||
                process.env.RPC_URL ||
                "http://127.0.0.1:8545",
        });
    } catch (error) {
        console.error("Error fetching contract info:", error);
        res.status(500).json({
            error: error.message,
            hint: "Make sure Hardhat node is running and contract is deployed",
        });
    }
});

// Get all certificates
app.get("/api/certificates", async (req, res) => {
    try {
        const recordsDir = path.join(__dirname, "../records");
        if (!fs.existsSync(recordsDir)) {
            return res.json({ success: true, data: [] });
        }
        const files = fs.readdirSync(recordsDir).filter((f) => f.endsWith(".json"));
        const certificates = files
            .map((file) => {
                const data = JSON.parse(fs.readFileSync(path.join(recordsDir, file), "utf8"));
                return data;
            })
            .sort((a, b) => b.timestamp - a.timestamp);

        res.json({ success: true, data: certificates });
    } catch (error) {
        console.error("Error fetching certificates:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// Issue certificate endpoint
app.post("/api/issue-certificate", async (req, res) => {
    try {
        console.log("📥 Received request body:", JSON.stringify(req.body, null, 2));

        const { certificateData, signature } = req.body;

        if (!certificateData || !signature) {
            return res.status(400).json({
                error: "Missing certificateData or signature in request body",
            });
        }

        const { name, recipientAddress, grade, timestamp, adminAddress } = certificateData;

        if (!name || !recipientAddress || !grade || !adminAddress) {
            console.error("❌ Missing fields:", { name, recipientAddress, grade, adminAddress });
            return res.status(400).json({
                error: "Missing required fields in certificateData",
                required: ["name", "recipientAddress", "grade", "adminAddress"],
                received: certificateData,
            });
        }

        const contractAddress = getContractAddress();
        const provider = getProvider();

        const code = await provider.getCode(contractAddress);
        if (code === "0x" || code === "0x0") {
            return res.status(500).json({
                error: "Contract not deployed",
                contractAddress,
                hint: "Deploy the contract using: npx hardhat run scripts/deploy.js --network localhost",
            });
        }

        const fullCertificateData = {
            name,
            recipientAddress,
            grade,
            timestamp: timestamp || Math.floor(Date.now() / 1000),
            contractAddress,
            adminAddress,
        };

        console.log("✅ Processing certificate:", fullCertificateData);

        const { default: issueCertificate } = await import("./scripts/issueCertificate.js");
        const record = await issueCertificate(fullCertificateData, signature);

        res.json({
            success: true,
            message: "Certificate issued successfully",
            data: record,
        });
    } catch (error) {
        console.error("Certificate issuance error:", error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        });
    }
});

// Start server and keep it running
const server = app.listen(PORT, () => {
    console.log("\n" + "=".repeat(60));
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`🌐 Network: ${network?.name || "undefined"}`);
    console.log(`📂 Project Root: ${path.join(__dirname, "..")}`);

    try {
        const contractAddress = getContractAddress();
        console.log(`📝 Contract Address: ${contractAddress}`);
    } catch (error) {
        console.log(`⚠️  ${error.message}`);
    }

    console.log("=".repeat(60) + "\n");
    console.log("💡 Server is ready to accept requests");
    console.log("   Press Ctrl+C to stop the server\n");
});

// Handle graceful shutdown
process.on("SIGINT", () => {
    console.log("\n\n🛑 Shutting down server...");
    server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
    });
});

// Keep the process running
process.stdin.resume();

export default app;