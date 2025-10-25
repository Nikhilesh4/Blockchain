const fs = require('fs');
const path = require('path');

console.log('🔄 Updating frontend ABI...');

// Read the compiled contract artifact
const artifactPath = path.join(__dirname, '../artifacts/contracts/CertificateNFT.sol/CertificateNFT.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

// Extract just the ABI
const abi = artifact.abi;

// Create the ABI file content
const abiFileContent = `export const CONTRACT_ABI = ${JSON.stringify(abi, null, 2)};\n`;

// Write to frontend
const frontendAbiPath = path.join(__dirname, '../frontend/src/utils/contractABI.js');
fs.writeFileSync(frontendAbiPath, abiFileContent);

console.log('✅ Frontend ABI updated successfully!');
console.log(`   Functions in ABI: ${abi.filter(item => item.type === 'function').length}`);

// Check if revokeCertificate exists
const hasRevoke = abi.some(item => item.name === 'revokeCertificate');
console.log(`   revokeCertificate function: ${hasRevoke ? '✅ Found' : '❌ Missing'}`);

if (hasRevoke) {
  const revokeFunc = abi.find(item => item.name === 'revokeCertificate');
  console.log(`   revokeCertificate inputs:`, JSON.stringify(revokeFunc.inputs, null, 2));
}
