/**
 * Script to setup roles after contract deployment
 * This script should be run immediately after deploying the contract
 * to assign initial roles to key personnel
 */

import { network } from 'hardhat';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { ethers } = await network.connect();

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Role constants (must match contract)
const ROLES = {
  SUPER_ADMIN: ethers.keccak256(ethers.toUtf8Bytes("SUPER_ADMIN_ROLE")),
  ADMIN: ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")),
  ISSUER: ethers.keccak256(ethers.toUtf8Bytes("ISSUER_ROLE")),
  REVOKER: ethers.keccak256(ethers.toUtf8Bytes("REVOKER_ROLE")),
  VERIFIER: ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE")),
};

const ROLE_NAMES = {
  [ROLES.SUPER_ADMIN]: 'SUPER_ADMIN',
  [ROLES.ADMIN]: 'ADMIN',
  [ROLES.ISSUER]: 'ISSUER',
  [ROLES.REVOKER]: 'REVOKER',
  [ROLES.VERIFIER]: 'VERIFIER',
};

/**
 * Load role assignments from configuration file
 */
function loadRoleConfig() {
  const configPath = path.join(__dirname, '../config/roles.json');
  
  // Create default config if it doesn't exist
  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      superAdmins: [],
      admins: [],
      issuers: [],
      revokers: [],
      verifiers: [],
      notes: "Add wallet addresses for each role. SuperAdmins get SUPER_ADMIN_ROLE, etc."
    };
    
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    
    console.log(`\n📝 Created default config file at: ${configPath}`);
    console.log('Please edit this file to add wallet addresses for each role.\n');
    return defaultConfig;
  }
  
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

/**
 * Save role assignment record
 */
function saveRoleAssignment(address, role, txHash, timestamp) {
  const recordsPath = path.join(__dirname, '../logs/role-assignments.json');
  
  let records = [];
  if (fs.existsSync(recordsPath)) {
    records = JSON.parse(fs.readFileSync(recordsPath, 'utf8'));
  } else {
    fs.mkdirSync(path.dirname(recordsPath), { recursive: true });
  }
  
  records.push({
    address,
    role: ROLE_NAMES[role],
    roleHash: role,
    transactionHash: txHash,
    timestamp,
    assignedBy: 'deployment-script'
  });
  
  fs.writeFileSync(recordsPath, JSON.stringify(records, null, 2));
}

/**
 * Grant a role to an address
 */
async function grantRoleToAddress(contract, address, role, roleName) {
  try {
    // Check if address already has the role
    const hasRole = await contract.hasRole(role, address);
    
    if (hasRole) {
      console.log(`   ⏭️  ${address} already has ${roleName} role`);
      return { success: true, skipped: true };
    }
    
    console.log(`   ⏳ Granting ${roleName} to ${address}...`);
    const tx = await contract.grantRole(role, address);
    const receipt = await tx.wait();
    
    console.log(`   ✅ ${roleName} granted successfully!`);
    console.log(`   📝 Transaction: ${receipt.hash}`);
    
    // Save record
    saveRoleAssignment(address, role, receipt.hash, new Date().toISOString());
    
    return { success: true, receipt };
  } catch (error) {
    console.error(`   ❌ Error granting ${roleName}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Batch grant roles
 */
async function batchGrantRoles(contract, addresses, roles) {
  if (addresses.length === 0) return { success: true, count: 0 };
  
  try {
    console.log(`   ⏳ Batch granting ${addresses.length} roles...`);
    const tx = await contract.batchGrantRoles(addresses, roles);
    const receipt = await tx.wait();
    
    console.log(`   ✅ Batch grant successful!`);
    console.log(`   📝 Transaction: ${receipt.hash}`);
    
    // Save records
    for (let i = 0; i < addresses.length; i++) {
      saveRoleAssignment(addresses[i], roles[i], receipt.hash, new Date().toISOString());
    }
    
    return { success: true, receipt, count: addresses.length };
  } catch (error) {
    console.error(`   ❌ Error in batch grant:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Verify role assignment
 */
async function verifyRole(contract, address, role, roleName) {
  const hasRole = await contract.hasRole(role, address);
  const status = hasRole ? '✅' : '❌';
  console.log(`   ${status} ${address}: ${roleName} - ${hasRole ? 'ASSIGNED' : 'NOT ASSIGNED'}`);
  return hasRole;
}

/**
 * Main setup function
 */
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                 ROLE SETUP SCRIPT                             ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  // Get network name
  const networkName = network.name;
  console.log(`📡 Network: ${networkName}\n`);
  
  // Get contract address from deployments
  const deploymentPath = path.join(__dirname, `../deployments/${networkName}.json`);
  if (!fs.existsSync(deploymentPath)) {
    console.error('❌ Deployment file not found. Please deploy the contract first.');
    console.error(`   Looking for: ${deploymentPath}`);
    return;
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const contractAddress = deployment.contractAddress || deployment.address;
  
  if (!contractAddress) {
    console.error('❌ Contract address not found in deployment file.');
    console.error(`   File content:`, deployment);
    return;
  }
  
  console.log(`📍 Contract Address: ${contractAddress}\n`);
  
  // Get contract instance
  const CertificateNFT = await ethers.getContractFactory('CertificateNFT');
  const contract = CertificateNFT.attach(contractAddress);
  
  // Load role configuration
  const config = loadRoleConfig();
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}\n`);
  
  // Check deployer already has SUPER_ADMIN
  const deployerHasSuperAdmin = await contract.hasRole(ROLES.SUPER_ADMIN, deployer.address);
  console.log(`Deployer SUPER_ADMIN status: ${deployerHasSuperAdmin ? '✅ ASSIGNED' : '❌ NOT ASSIGNED'}\n`);
  
  let totalAssigned = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  
  // Assign SUPER_ADMIN roles
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1️⃣  SUPER_ADMIN Role Assignment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (config.superAdmins.length === 0) {
    console.log('   ⚠️  No SUPER_ADMIN addresses configured\n');
  } else {
    for (const address of config.superAdmins) {
      if (!ethers.isAddress(address)) {
        console.log(`   ❌ Invalid address: ${address}\n`);
        totalFailed++;
        continue;
      }
      
      const result = await grantRoleToAddress(contract, address, ROLES.SUPER_ADMIN, 'SUPER_ADMIN');
      if (result.success) {
        if (result.skipped) totalSkipped++;
        else totalAssigned++;
      } else {
        totalFailed++;
      }
      console.log('');
    }
  }
  
  // Assign ADMIN roles
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣  ADMIN Role Assignment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (config.admins.length === 0) {
    console.log('   ⚠️  No ADMIN addresses configured\n');
  } else {
    for (const address of config.admins) {
      if (!ethers.isAddress(address)) {
        console.log(`   ❌ Invalid address: ${address}\n`);
        totalFailed++;
        continue;
      }
      
      const result = await grantRoleToAddress(contract, address, ROLES.ADMIN, 'ADMIN');
      if (result.success) {
        if (result.skipped) totalSkipped++;
        else totalAssigned++;
      } else {
        totalFailed++;
      }
      console.log('');
    }
  }
  
  // Assign ISSUER roles (using batch if multiple)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3️⃣  ISSUER Role Assignment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (config.issuers.length === 0) {
    console.log('   ⚠️  No ISSUER addresses configured\n');
  } else {
    // Filter valid addresses
    const validIssuers = config.issuers.filter(addr => {
      if (!ethers.isAddress(addr)) {
        console.log(`   ❌ Invalid address: ${addr}`);
        totalFailed++;
        return false;
      }
      return true;
    });
    
    if (validIssuers.length > 3) {
      // Use batch grant for efficiency
      const roles = validIssuers.map(() => ROLES.ISSUER);
      const result = await batchGrantRoles(contract, validIssuers, roles);
      if (result.success) {
        totalAssigned += result.count;
      } else {
        totalFailed += validIssuers.length;
      }
    } else {
      // Grant individually
      for (const address of validIssuers) {
        const result = await grantRoleToAddress(contract, address, ROLES.ISSUER, 'ISSUER');
        if (result.success) {
          if (result.skipped) totalSkipped++;
          else totalAssigned++;
        } else {
          totalFailed++;
        }
        console.log('');
      }
    }
    console.log('');
  }
  
  // Assign REVOKER roles
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4️⃣  REVOKER Role Assignment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (config.revokers.length === 0) {
    console.log('   ⚠️  No REVOKER addresses configured\n');
  } else {
    for (const address of config.revokers) {
      if (!ethers.isAddress(address)) {
        console.log(`   ❌ Invalid address: ${address}\n`);
        totalFailed++;
        continue;
      }
      
      const result = await grantRoleToAddress(contract, address, ROLES.REVOKER, 'REVOKER');
      if (result.success) {
        if (result.skipped) totalSkipped++;
        else totalAssigned++;
      } else {
        totalFailed++;
      }
      console.log('');
    }
  }
  
  // Assign VERIFIER roles
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('5️⃣  VERIFIER Role Assignment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (config.verifiers.length === 0) {
    console.log('   ⚠️  No VERIFIER addresses configured\n');
  } else {
    for (const address of config.verifiers) {
      if (!ethers.isAddress(address)) {
        console.log(`   ❌ Invalid address: ${address}\n`);
        totalFailed++;
        continue;
      }
      
      const result = await grantRoleToAddress(contract, address, ROLES.VERIFIER, 'VERIFIER');
      if (result.success) {
        if (result.skipped) totalSkipped++;
        else totalAssigned++;
      } else {
        totalFailed++;
      }
      console.log('');
    }
  }
  
  // Verification Summary
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                 VERIFICATION SUMMARY                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log('Verifying all role assignments...\n');
  
  // Verify deployer
  console.log('👤 Deployer:', deployer.address);
  await verifyRole(contract, deployer.address, ROLES.SUPER_ADMIN, 'SUPER_ADMIN');
  console.log('');
  
  // Verify all configured addresses
  for (const address of config.superAdmins) {
    if (ethers.isAddress(address)) {
      await verifyRole(contract, address, ROLES.SUPER_ADMIN, 'SUPER_ADMIN');
    }
  }
  console.log('');
  
  for (const address of config.admins) {
    if (ethers.isAddress(address)) {
      await verifyRole(contract, address, ROLES.ADMIN, 'ADMIN');
    }
  }
  console.log('');
  
  for (const address of config.issuers) {
    if (ethers.isAddress(address)) {
      await verifyRole(contract, address, ROLES.ISSUER, 'ISSUER');
    }
  }
  console.log('');
  
  for (const address of config.revokers) {
    if (ethers.isAddress(address)) {
      await verifyRole(contract, address, ROLES.REVOKER, 'REVOKER');
    }
  }
  console.log('');
  
  for (const address of config.verifiers) {
    if (ethers.isAddress(address)) {
      await verifyRole(contract, address, ROLES.VERIFIER, 'VERIFIER');
    }
  }
  
  // Final Summary
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                   SETUP COMPLETE                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`✅ Total roles assigned: ${totalAssigned}`);
  console.log(`⏭️  Total skipped (already assigned): ${totalSkipped}`);
  console.log(`❌ Total failed: ${totalFailed}`);
  console.log(`\n📋 Role assignment records saved to: logs/role-assignments.json`);
  console.log(`📝 Configuration file: config/roles.json\n`);
  
  if (totalFailed > 0) {
    console.log('⚠️  Some role assignments failed. Please check the errors above.\n');
  } else {
    console.log('🎉 All roles assigned successfully!\n');
  }
}

// Execute main function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
