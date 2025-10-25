import type { HardhatUserConfig } from "hardhat/config";

import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Get configuration from environment
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

// Debug: Check if Etherscan API key is loaded
console.log("🔍 Etherscan API Key:", ETHERSCAN_API_KEY ? `Found (${ETHERSCAN_API_KEY.substring(0, 10)}...)` : "❌ Not found in .env");

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
  plugins: [hardhatToolboxMochaEthersPlugin],
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
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      ...getSepoliaConfig(),
    },
  },
} as any;

// Add Etherscan configuration for contract verification
(config as any).etherscan = {
  apiKey: {
    sepolia: ETHERSCAN_API_KEY,
  },
};

// Enable Sourcify verification
(config as any).sourcify = {
  enabled: true,
};

export default config;
