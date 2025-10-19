const { ethers } = require('ethers');

/**
 * Verify admin wallet signature middleware
 * Validates that the request is signed by an authorized admin wallet
 */
const verifyAdminSignature = async (req, res, next) => {
    try {
        const { signature, message, adminAddress } = req.body;

        // Check if required fields are present
        if (!signature || !message || !adminAddress) {
            return res.status(401).json({
                success: false,
                error: 'Authentication failed',
                message: 'Missing required authentication fields: signature, message, or adminAddress'
            });
        }

        // Verify the signature
        const recoveredAddress = ethers.verifyMessage(message, signature);

        // Compare recovered address with provided admin address (case-insensitive)
        if (recoveredAddress.toLowerCase() !== adminAddress.toLowerCase()) {
            console.warn(`⚠️  Authentication failed: Address mismatch`);
            console.warn(`   Expected: ${adminAddress}`);
            console.warn(`   Recovered: ${recoveredAddress}`);
            
            return res.status(401).json({
                success: false,
                error: 'Authentication failed',
                message: 'Invalid signature or unauthorized address'
            });
        }

        // Check if the admin address is authorized (optional - implement your own logic)
        const authorizedAdmins = process.env.AUTHORIZED_ADMINS 
            ? process.env.AUTHORIZED_ADMINS.split(',').map(addr => addr.toLowerCase())
            : []; // Empty array means all addresses are allowed

        if (authorizedAdmins.length > 0 && !authorizedAdmins.includes(adminAddress.toLowerCase())) {
            console.warn(`⚠️  Unauthorized admin attempt: ${adminAddress}`);
            return res.status(403).json({
                success: false,
                error: 'Authorization failed',
                message: 'Address is not authorized to perform admin operations'
            });
        }

        // Attach verified admin address to request for later use
        req.verifiedAdmin = recoveredAddress;
        
        console.log(`✅ Authentication successful: ${recoveredAddress}`);
        next();

    } catch (error) {
        console.error('❌ Authentication error:', error.message);
        return res.status(401).json({
            success: false,
            error: 'Authentication failed',
            message: error.message
        });
    }
};

/**
 * Verify contract owner middleware
 * Ensures the authenticated user is the contract owner
 */
const verifyContractOwner = async (req, res, next) => {
    try {
        const { Web3 } = require('web3');
        const path = require('path');
        
        const contractJsonPath = path.resolve(__dirname, '../../artifacts/contracts/CertificateNFT.sol/CertificateNFT.json');
        const contractABI = require(contractJsonPath).abi;
        const contractAddress = process.env.CONTRACT_ADDRESS;
        
        const web3 = new Web3(process.env.RPC_URL || 'http://127.0.0.1:8545');
        const contract = new web3.eth.Contract(contractABI, contractAddress);
        
        const owner = await contract.methods.owner().call();
        
        // Check if verified admin is the contract owner
        if (!req.verifiedAdmin || req.verifiedAdmin.toLowerCase() !== owner.toLowerCase()) {
            console.warn(`⚠️  Not contract owner: ${req.verifiedAdmin}`);
            console.warn(`   Contract owner: ${owner}`);
            
            return res.status(403).json({
                success: false,
                error: 'Authorization failed',
                message: 'Only contract owner can perform this operation'
            });
        }

        console.log(`✅ Contract owner verified: ${owner}`);
        next();

    } catch (error) {
        console.error('❌ Contract owner verification error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Verification failed',
            message: error.message
        });
    }
};

/**
 * Optional: Create signature message helper
 * Used by frontend to create consistent messages for signing
 */
const createSignatureMessage = (data) => {
    const { action, timestamp, ...otherData } = data;
    
    let message = `Action: ${action}\n`;
    message += `Timestamp: ${timestamp}\n`;
    
    Object.keys(otherData).forEach(key => {
        message += `${key}: ${otherData[key]}\n`;
    });
    
    return message.trim();
};

module.exports = {
    verifyAdminSignature,
    verifyContractOwner,
    createSignatureMessage
};