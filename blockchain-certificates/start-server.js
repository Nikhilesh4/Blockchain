import hre from "hardhat";

async function main() {
    console.log("🚀 Starting backend server through Hardhat...\n");
    
    // Import and start the server
    const { default: app } = await import("./server.js");
    
    // Keep the process running
    await new Promise(() => {}); // Never resolves, keeps server alive
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});