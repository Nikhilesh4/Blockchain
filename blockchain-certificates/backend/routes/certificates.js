const express = require('express');
const router = express.Router();
const multer = require('multer');
const Web3 = require('web3'); // Changed from: const { Web3 } = require('web3');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// =================================================================
// IMPORT MIDDLEWARE
// =================================================================
const { 
    validateAddress, 
    validateTokenId, 
    validateMetadata, 
    validateMintInput,
    validateRevocationInput,
    validateFileUpload,
    sanitizeInput 
} = require('../middleware/validation');

const { 
    asyncHandler 
} = require('../middleware/errorHandler');

const {
    uploadLimiter,
    strictLimiter,
    verificationLimiter,
    readOnlyLimiter
} = require('../middleware/rateLimit');

// =================================================================
// CONFIGURATION
// =================================================================
const contractJsonPath = path.resolve(__dirname, '../../artifacts/contracts/CertificateNFT.sol/CertificateNFT.json');
const contractABI = require(contractJsonPath).abi;
const contractAddress = process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const web3 = new Web3(process.env.RPC_URL || 'http://127.0.0.1:8545');

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not found in environment variables!');
    console.log('💡 Please add PRIVATE_KEY to your .env file');
}

const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);

// Pinata configuration
const pinataApiKey = process.env.PINATA_API_KEY;
const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

if (!pinataApiKey || !pinataSecretApiKey) {
    console.error('❌ Pinata API keys not found in environment variables!');
    console.log('💡 Please add PINATA_API_KEY and PINATA_SECRET_API_KEY to your .env file');
}

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// =================================================================
// ROUTES
// =================================================================

/**
 * @route   POST /api/certificates/upload-image
 * @desc    Uploads only the image to Pinata IPFS
 * @access  Public (rate limited)
 */
router.post('/upload-image', 
    uploadLimiter,
    upload.single('template'),
    validateFileUpload,
    asyncHandler(async (req, res) => {
        console.log('📤 Uploading image to Pinata IPFS...');
        console.log(`   File: ${req.file.originalname}`);
        console.log(`   Size: ${(req.file.size / 1024).toFixed(2)} KB`);

        const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
        
        const formData = new FormData();
        const fileStream = require('stream').Readable.from(req.file.buffer);
        fileStream.path = req.file.originalname;
        formData.append('file', fileStream);

        const metadata = JSON.stringify({
            name: req.file.originalname,
            keyvalues: {
                type: 'certificate-image',
                uploadedAt: new Date().toISOString()
            }
        });
        formData.append('pinataMetadata', metadata);

        const response = await axios.post(url, formData, {
            headers: {
                ...formData.getHeaders(),
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey,
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        const ipfsHash = response.data.IpfsHash;
        const imageUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

        console.log('✅ Image uploaded successfully!');
        console.log(`   IPFS Hash: ${ipfsHash}`);

        res.status(200).json({
            success: true,
            message: 'Image uploaded to Pinata successfully!',
            data: {
                ipfsHash: ipfsHash,
                imageUrl: imageUrl,
                ipfsUrl: `ipfs://${ipfsHash}`,
                pinSize: response.data.PinSize,
                timestamp: response.data.Timestamp
            }
        });
    })
);

/**
 * @route   POST /api/certificates/generate-metadata
 * @desc    Creates metadata, uploads it to Pinata, and returns the metadata IPFS hash
 * @access  Public (rate limited)
 */
router.post('/generate-metadata',
    uploadLimiter,
    sanitizeInput,
    validateMetadata,
    asyncHandler(async (req, res) => {
        const { name, description, imageUrl, issuer, attributes } = req.body;
        
        console.log('📝 Generating certificate metadata...');
        console.log('   Received data:', { name, description, imageUrl, issuer });

        const metadata = { 
            name, 
            description, 
            image: imageUrl,
            issuer: issuer || 'Unknown Issuer',
            attributes: attributes || []
        };

        console.log('📤 Uploading metadata to Pinata...');
        
        const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
        const pinataMetadata = {
            name: `${name}-metadata`,
            keyvalues: {
                type: 'certificate-metadata',
                certificateName: name,
                uploadedAt: new Date().toISOString()
            }
        };

        const response = await axios.post(url, metadata, {
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey,
                'Content-Type': 'application/json'
            },
            params: {
                pinataMetadata: JSON.stringify(pinataMetadata)
            }
        });

        const metadataHash = response.data.IpfsHash;
        const metadataUrl = `ipfs://${metadataHash}`;

        console.log('✅ Metadata uploaded successfully!');
        console.log(`   Metadata Hash: ${metadataHash}`);

        res.status(200).json({
            success: true,
            message: 'Metadata uploaded successfully!',
            data: {
                metadataHash: metadataHash,
                metadataUrl: metadataUrl,
                gatewayUrl: `https://gateway.pinata.cloud/ipfs/${metadataHash}`,
                pinSize: response.data.PinSize,
                timestamp: response.data.Timestamp
            }
        });
    })
);

/**
 * @route   POST /api/certificates/mint
 * @desc    Triggers smart contract minting with the metadata URL from Pinata
 * @access  Private (requires valid transaction, rate limited)
 */
router.post('/mint',
    strictLimiter,
    sanitizeInput,
    validateMintInput,
    asyncHandler(async (req, res) => {
        const { recipientAddress, metadataUrl } = req.body;
        
        console.log('🎨 Minting certificate NFT...');
        console.log('   Recipient:', recipientAddress);
        console.log('   Metadata URL:', metadataUrl);

        const contract = new web3.eth.Contract(contractABI, contractAddress);
        const ownerAddress = account.address;

        console.log('   Contract:', contractAddress);
        console.log('   Owner:', ownerAddress);

        // Estimate gas first
        const gasEstimate = await contract.methods
            .mintCertificate(recipientAddress, metadataUrl)
            .estimateGas({ from: ownerAddress });

        console.log(`   Estimated gas: ${gasEstimate}`);

        const gasLimit = Math.floor(Number(gasEstimate) * 1.2);

        // Send transaction
        const transaction = await contract.methods
            .mintCertificate(recipientAddress, metadataUrl)
            .send({ 
                from: ownerAddress, 
                gas: gasLimit
            });

        const tokenId = transaction.events.CertificateMinted.returnValues.tokenId;

        console.log('✅ Certificate minted successfully!');
        console.log(`   Token ID: ${tokenId}`);
        console.log(`   Transaction: ${transaction.transactionHash}`);

        res.status(200).json({
            success: true,
            message: 'Certificate minted successfully!',
            data: {
                tokenId: tokenId.toString(),
                transactionHash: transaction.transactionHash,
                blockNumber: Number(transaction.blockNumber),
                recipient: recipientAddress,
                metadataUrl: metadataUrl,
                gasUsed: transaction.gasUsed.toString(),
                effectiveGasPrice: transaction.effectiveGasPrice ? transaction.effectiveGasPrice.toString() : undefined
            }
        });
    })
);

/**
 * @route   GET /api/certificates/:tokenId
 * @desc    Retrieve certificate details from blockchain
 * @access  Public (rate limited)
 */
router.get('/:tokenId',
    readOnlyLimiter,
    validateTokenId,
    asyncHandler(async (req, res) => {
        const tokenId = req.validatedTokenId;

        console.log(`🔍 Fetching certificate details for Token ID: ${tokenId}`);

        const contract = new web3.eth.Contract(contractABI, contractAddress);

        // Get certificate details
        const details = await contract.methods.getCertificateDetails(tokenId).call();
        
        // Get additional info
        const tokenURI = await contract.methods.tokenURI(tokenId).call();
        const isRevoked = await contract.methods.isRevoked(tokenId).call();

        // Fetch metadata from IPFS if available
        let metadata = null;
        if (tokenURI.startsWith('ipfs://')) {
            try {
                const ipfsHash = tokenURI.replace('ipfs://', '');
                const metadataUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
                const metadataResponse = await axios.get(metadataUrl, { timeout: 5000 });
                metadata = metadataResponse.data;
            } catch (metadataError) {
                console.warn(`⚠️  Could not fetch metadata: ${metadataError.message}`);
            }
        }

        console.log('✅ Certificate details retrieved successfully');

        res.status(200).json({
            success: true,
            message: 'Certificate details retrieved successfully',
            data: {
                tokenId: tokenId,
                owner: details.owner,
                mintedAt: new Date(Number(details.mintedAt) * 1000).toISOString(),
                revoked: details.revoked,
                tokenURI: tokenURI,
                metadata: metadata,
                isValid: !isRevoked,
                contractAddress: contractAddress
            }
        });
    })
);

/**
 * @route   GET /api/certificates/verify/:tokenId
 * @desc    Verify certificate authenticity and status
 * @access  Public (rate limited)
 */
router.get('/verify/:tokenId',
    verificationLimiter,
    validateTokenId,
    asyncHandler(async (req, res) => {
        const tokenId = req.validatedTokenId;

        console.log(`✓ Verifying certificate Token ID: ${tokenId}`);

        const contract = new web3.eth.Contract(contractABI, contractAddress);

        // Verify certificate
        const isValid = await contract.methods.verifyCertificate(tokenId).call();
        
        if (!isValid) {
            console.log(`❌ Certificate ${tokenId} is not valid`);
            return res.status(200).json({
                success: true,
                message: 'Certificate verification complete',
                data: {
                    tokenId: tokenId,
                    isValid: false,
                    status: 'INVALID',
                    reason: 'Certificate may be revoked or does not exist'
                }
            });
        }

        // Get additional details if valid
        const details = await contract.methods.getCertificateDetails(tokenId).call();
        const isRevoked = await contract.methods.isRevoked(tokenId).call();

        console.log(`✅ Certificate ${tokenId} is valid`);

        res.status(200).json({
            success: true,
            message: 'Certificate is valid and authentic',
            data: {
                tokenId: tokenId,
                isValid: true,
                status: 'VALID',
                owner: details.owner,
                mintedAt: new Date(Number(details.mintedAt) * 1000).toISOString(),
                revoked: isRevoked,
                tokenURI: details.uri,
                verifiedAt: new Date().toISOString(),
                contractAddress: contractAddress
            }
        });
    })
);

/**
 * @route   POST /api/certificates/revoke/:tokenId
 * @desc    Revoke a certificate (owner only)
 * @access  Private (rate limited)
 */
router.post('/revoke/:tokenId',
    strictLimiter,
    validateTokenId,
    validateRevocationInput,
    asyncHandler(async (req, res) => {
        const tokenId = req.validatedTokenId;
        const { reason } = req.body;

        console.log(`🚫 Revoking certificate Token ID: ${tokenId}`);
        if (reason) {
            console.log(`   Reason: ${reason}`);
        }

        const contract = new web3.eth.Contract(contractABI, contractAddress);
        const ownerAddress = account.address;

        // Check if certificate exists and is not already revoked
        const isRevoked = await contract.methods.isRevoked(tokenId).call();
        if (isRevoked) {
            return res.status(400).json({
                success: false,
                message: 'Certificate is already revoked'
            });
        }

        // Estimate gas
        const gasEstimate = await contract.methods
            .revokeCertificate(tokenId)
            .estimateGas({ from: ownerAddress });

        console.log(`   Estimated gas: ${gasEstimate}`);

        const gasLimit = Math.floor(Number(gasEstimate) * 1.2);

        // Revoke certificate
        const transaction = await contract.methods
            .revokeCertificate(tokenId)
            .send({ 
                from: ownerAddress,
                gas: gasLimit
            });

        console.log('✅ Certificate revoked successfully!');
        console.log(`   Transaction: ${transaction.transactionHash}`);

        res.status(200).json({
            success: true,
            message: 'Certificate revoked successfully',
            data: {
                tokenId: tokenId.toString(),
                transactionHash: transaction.transactionHash,
                blockNumber: transaction.blockNumber ? Number(transaction.blockNumber) : undefined,
                revokedBy: ownerAddress,
                revokedAt: new Date().toISOString(),
                reason: reason || 'Not specified',
                gasUsed: transaction.gasUsed ? transaction.gasUsed.toString() : undefined,
                effectiveGasPrice: transaction.effectiveGasPrice ? transaction.effectiveGasPrice.toString() : undefined
            }
        });
    })
);

/**
 * @route   GET /api/certificates/stats/overview
 * @desc    Get overall certificate statistics
 * @access  Public (rate limited)
 */
router.get('/stats/overview',
    readOnlyLimiter,
    asyncHandler(async (req, res) => {
        console.log('📊 Fetching certificate statistics...');

        const contract = new web3.eth.Contract(contractABI, contractAddress);

        const totalMinted = await contract.methods.getTotalMinted().call();
        const contractOwner = await contract.methods.owner().call();
        const contractName = await contract.methods.name().call();
        const contractSymbol = await contract.methods.symbol().call();

        console.log('✅ Statistics retrieved successfully');

        res.status(200).json({
            success: true,
            message: 'Statistics retrieved successfully',
            data: {
                totalMinted: totalMinted.toString(),
                contractName: contractName,
                contractSymbol: contractSymbol,
                contractOwner: contractOwner,
                contractAddress: contractAddress,
                network: process.env.NETWORK || 'localhost'
            }
        });
    })
);

/**
 * @route   GET /api/certificates/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', asyncHandler(async (req, res) => {
    // Check web3 connection
    const blockNumber = await web3.eth.getBlockNumber();
    
    // Check contract
    const contract = new web3.eth.Contract(contractABI, contractAddress);
    const totalMinted = await contract.methods.getTotalMinted().call();

    res.status(200).json({
        success: true,
        message: 'Backend is healthy',
        data: {
            status: 'operational',
            blockchain: {
                connected: true,
                blockNumber: blockNumber.toString()
            },
            contract: {
                address: contractAddress,
                accessible: true,
                totalMinted: totalMinted.toString()
            },
            pinata: {
                configured: !!(pinataApiKey && pinataSecretApiKey)
            },
            timestamp: new Date().toISOString()
        }
    });
}));

module.exports = router;