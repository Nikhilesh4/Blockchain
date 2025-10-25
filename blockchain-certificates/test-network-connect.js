import { network } from "hardhat";

console.log("network object:", network);
console.log("network.name:", network.name);
console.log("network.connect:", typeof network.connect);

const connected = await network.connect();
console.log("connected keys:", Object.keys(connected));
console.log("ethers:", !!connected.ethers);
console.log("run:", !!connected.run);

// Try destructuring
try {
    const { ethers } = connected;
    console.log("\nethers from destructuring:", !!ethers);
    if (ethers) {
        console.log("ethers.provider:", !!ethers.provider);
        console.log("ethers.getSigners:", typeof ethers.getSigners);
    }
} catch (e) {
    console.log("Error destructuring:", e.message);
}

