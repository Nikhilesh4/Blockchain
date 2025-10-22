// Test Public Certificate Verification
// This script demonstrates verifying certificates WITHOUT a wallet

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Contract details
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

async function testPublicVerification() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         PUBLIC CERTIFICATE VERIFICATION TEST                   ║');
  console.log('║         (No Wallet Required!)                                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Create public read-only provider (NO WALLET NEEDED!)
    console.log('📡 Connecting to public RPC endpoint...');
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    console.log('✅ Connected! (No wallet required)\n');

    // 2. Load contract ABI
    console.log('📄 Loading contract ABI...');
    const abiPath = path.join(__dirname, '..', 'deployments', 'abi', 'CertificateNFT.json');
    const contractABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    console.log('✅ ABI loaded\n');

    // 3. Create contract instance (read-only)
    console.log('📝 Creating contract instance...');
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
    console.log(`✅ Contract connected: ${CONTRACT_ADDRESS}\n`);

    // 4. Get total minted certificates
    console.log('📊 Fetching statistics...');
    const totalMinted = await contract.getTotalMinted();
    console.log(`✅ Total certificates minted: ${totalMinted.toString()}\n`);

    // 5. Test verification for different scenarios
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔍 TESTING CERTIFICATE VERIFICATION\n');

    if (totalMinted > 0) {
      // Test valid certificate
      const tokenId = 1;
      console.log(`📋 Test 1: Verifying certificate #${tokenId}`);
      console.log('─'.repeat(60));
      
      const isValid = await contract.verifyCertificate(tokenId);
      console.log(`Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);

      if (isValid) {
        const details = await contract.getCertificateDetails(tokenId);
        const isRevoked = await contract.isRevoked(tokenId);
        
        console.log('\n📜 Certificate Details:');
        console.log(`   Owner: ${details.owner}`);
        console.log(`   Minted: ${new Date(Number(details.mintedAt) * 1000).toLocaleString()}`);
        console.log(`   Revoked: ${isRevoked ? 'Yes ❌' : 'No ✅'}`);
        console.log(`   Token URI: ${details.uri.substring(0, 50)}...`);
        
        // Try to fetch IPFS metadata
        if (details.uri.startsWith('ipfs://')) {
          const ipfsHash = details.uri.replace('ipfs://', '');
          const metadataUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
          
          console.log('\n🌐 Fetching metadata from IPFS...');
          try {
            const response = await fetch(metadataUrl);
            const metadata = await response.json();
            
            console.log('✅ Metadata retrieved:');
            console.log(`   Name: ${metadata.name}`);
            console.log(`   Description: ${metadata.description}`);
            
            if (metadata.attributes) {
              console.log('   Attributes:');
              metadata.attributes.forEach(attr => {
                console.log(`     - ${attr.trait_type}: ${attr.value}`);
              });
            }
          } catch (metadataError) {
            console.log('⚠️  Could not fetch metadata:', metadataError.message);
          }
        }
      }

      console.log('\n' + '─'.repeat(60) + '\n');
    }

    // Test non-existent certificate
    const nonExistentId = 99999;
    console.log(`📋 Test 2: Verifying non-existent certificate #${nonExistentId}`);
    console.log('─'.repeat(60));
    
    try {
      const isValid = await contract.verifyCertificate(nonExistentId);
      console.log(`Result: ${isValid ? '✅ VALID' : '❌ INVALID (Does not exist)'}`);
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    console.log('\n' + '─'.repeat(60) + '\n');

    // Summary
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ PUBLIC VERIFICATION TEST COMPLETE!\n');
    console.log('Key Takeaways:');
    console.log('  ✅ No wallet connection required');
    console.log('  ✅ No gas fees (read-only operations)');
    console.log('  ✅ Full certificate details accessible');
    console.log('  ✅ IPFS metadata can be fetched');
    console.log('  ✅ Anyone can verify certificates\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nMake sure:');
    console.error('  1. Hardhat node is running (npx hardhat node)');
    console.error('  2. Contract is deployed');
    console.error('  3. At least one certificate is minted\n');
  }
}

// Run the test
testPublicVerification();
