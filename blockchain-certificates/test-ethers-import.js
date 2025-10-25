// Test importing ethers from hardhat/plugins
import hre from "hardhat";

console.log("hre keys:", Object.keys(hre));
console.log("hre.run:", typeof hre.run);

// Check tasks
if (hre.tasks) {
    console.log("\nTasks:");
    const taskNames = Object.keys(hre.tasks);
    console.log("Number of tasks:", taskNames.length);
    
    // Look for verify task
    const verifyTasks = taskNames.filter(t => t.includes('verify'));
    console.log("Verify-related tasks:", verifyTasks);
    
    // Check if verify:verify exists
    if (hre.tasks['verify:verify']) {
        console.log("\nFound verify:verify task!");
        console.log("Type:", typeof hre.tasks['verify:verify']);
    }
}


