/**
 * Fund a specific address from the Hardhat default account
 * Use this to fund your newly generated wallet
 */

import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
    // Get the address to fund from environment variable or process.env
    const targetAddress = process.env.TARGET_ADDRESS || process.env.ADMIN_ADDRESSES;
    const amount = process.env.AMOUNT || "10.0"; // Default 10 ETH

    if (!targetAddress) {
        console.error("\n❌ Error: No address provided!");
        console.log("\nUsage:");
        console.log("  TARGET_ADDRESS=0x... npx hardhat run scripts/fundAccount.js --network localhost");
        console.log("\nOr with custom amount:");
        console.log("  TARGET_ADDRESS=0x... AMOUNT=5.0 npx hardhat run scripts/fundAccount.js --network localhost");
        console.log("\nExample:");
        console.log("  TARGET_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb npx hardhat run scripts/fundAccount.js --network localhost");
        process.exit(1);
    }

    // Validate address
    if (!ethers.isAddress(targetAddress)) {
        console.error(`\n❌ Error: Invalid Ethereum address: ${targetAddress}`);
        process.exit(1);
    }

    console.log("\n💰 Funding Account");
    console.log("=".repeat(60));
    console.log(`📍 Target Address: ${targetAddress}`);
    console.log(`💵 Amount:         ${amount} ETH`);
    console.log("=".repeat(60));

    // Get the default signer (Hardhat account #0)
    const [deployer] = await ethers.getSigners();
    console.log(`\n👤 Funding from:   ${deployer.address}`);

    // Check deployer balance
    const deployerBalance = await ethers.provider.getBalance(deployer.address);
    console.log(`   Balance:        ${ethers.formatEther(deployerBalance)} ETH`);

    // Check if deployer has enough balance
    const amountWei = ethers.parseEther(amount);
    if (deployerBalance < amountWei) {
        console.error(`\n❌ Error: Insufficient balance! Need ${amount} ETH but have ${ethers.formatEther(deployerBalance)} ETH`);
        process.exit(1);
    }

    // Check target balance before
    const balanceBefore = await ethers.provider.getBalance(targetAddress);
    console.log(`\n📊 Target balance before: ${ethers.formatEther(balanceBefore)} ETH`);

    // Send transaction
    console.log("\n⏳ Sending transaction...");
    const tx = await deployer.sendTransaction({
        to: targetAddress,
        value: amountWei,
    });

    console.log(`📝 Transaction hash: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

    // Check target balance after
    const balanceAfter = await ethers.provider.getBalance(targetAddress);
    console.log(`\n📊 Target balance after:  ${ethers.formatEther(balanceAfter)} ETH`);
    console.log(`💚 Successfully funded:   ${ethers.formatEther(balanceAfter - balanceBefore)} ETH`);

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Account funded successfully!");
    console.log("=".repeat(60));
    console.log("\n💡 Next steps:");
    console.log("   1. Import this account to MetaMask using its private key");
    console.log("   2. Make sure MetaMask is connected to localhost:8545");
    console.log("   3. You should now be able to interact without warnings!");
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error funding account:", error);
        process.exit(1);
    });
