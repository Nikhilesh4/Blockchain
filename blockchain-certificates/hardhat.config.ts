import type { HardhatUserConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatToolbox from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Get configuration from environment
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

// Debug: Check if environment variables are loaded
console.log("🔍 Etherscan API Key:", ETHERSCAN_API_KEY ? `Found (${ETHERSCAN_API_KEY.substring(0, 10)}...)` : "❌ Not found in .env");
console.log("🔍 Sepolia RPC URL:", SEPOLIA_RPC_URL ? `Found (${SEPOLIA_RPC_URL.substring(0, 30)}...)` : "❌ Not found in .env");
console.log("🔍 Sepolia Private Key:", SEPOLIA_PRIVATE_KEY ? `Found (${SEPOLIA_PRIVATE_KEY.substring(0, 10)}...)` : "❌ Not found in .env");

// Helper function to validate Sepolia config when needed
function getSepoliaConfig() {
  if (!SEPOLIA_RPC_URL) {
    console.warn("⚠️  Warning: SEPOLIA_RPC_URL not set in .env file");
  }
  if (!SEPOLIA_PRIVATE_KEY) {
    console.warn("⚠️  Warning: SEPOLIA_PRIVATE_KEY not set in .env file");
  }
  
  return {
    url: SEPOLIA_RPC_URL,
    accounts: SEPOLIA_PRIVATE_KEY ? [SEPOLIA_PRIVATE_KEY] : [],
  };
}

const config: HardhatUserConfig = {
  plugins: [hardhatEthers, hardhatToolbox, hardhatVerify],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
    },
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
      chainType: "l1",
    },
    sepolia: {
      type: "http",
      url: SEPOLIA_RPC_URL,
      accounts: SEPOLIA_PRIVATE_KEY ? [SEPOLIA_PRIVATE_KEY] : [],
      chainId: 11155111,
      chainType: "l1",
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },
  sourcify: {
    enabled: true,
  },
} as any;

export default config;
