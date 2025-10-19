const express = require('express');
const router = express.Router();
const Web3 = require('web3');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');

// =================================================================
// IMPORT MIDDLEWARE
// =================================================================
const { 
    validateAddress, 
    validateTokenId, 
    validateMetadata, 
    validateMintInput,
    validateRevocationInput
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

const {
    verifyAdminSignature,
    verifyContractOwner
} = require('../middleware/auth');

// Import certificate generator - FIXED PATH
const certificateGenerator = require('../services/certificateGenerator');

// =================================================================
// CONFIGURATION
// =================================================================
const contractJsonPath = path.resolve(__dirname, '../../artifacts/contracts/CertificateNFT.sol/CertificateNFT.json');
const contractABI = require(contractJsonPath).abi;
const contractAddress = process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// Initialize Web3 with provider
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_URL || 'http://127.0.0.1:8545'));

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

// =================================================================
// HELPER FUNCTION: Generate Certificate Image
// =================================================================
async function generateAndUploadCertificateImage(certificateData) {
    const { name, grade, recipientAddress, issuer } = certificateData;
    
    const issuedDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    console.log('🎨 Generating certificate image...');
    
    // Generate image buffer using the imported module
    const imageBuffer = await certificateGenerator.generateCertificateImage({
        name,
        grade,
        recipientAddress,
        issuedDate
    });

    console.log('📤 Uploading certificate image to IPFS...');
    
    // Convert buffer to readable stream for IPFS upload
    const { Readable } = require('stream');
    const imageStream = Readable.from(imageBuffer);
    
    // Upload to Pinata
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    
    const formData = new FormData();
    formData.append('file', imageStream, {
        filename: `certificate-${name.replace(/\s+/g, '-')}.png`,
        contentType: 'image/png'
    });

    const metadata = JSON.stringify({
        name: `certificate-${name.replace(/\s+/g, '-')}`,
        keyvalues: {
            type: 'certificate-image',
            recipientName: name,
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

    console.log('✅ Certificate image generated and uploaded!');
    console.log(`   IPFS Hash: ${ipfsHash}`);

    return {
        ipfsHash,
        imageUrl,
        ipfsUrl: `ipfs://${ipfsHash}`,
        pinSize: response.data.PinSize,
        timestamp: response.data.Timestamp
    };
}

// =================================================================
// ROUTES
// =================================================================

/**
 * @route   POST /api/certificates/issue
 * @desc    Complete certificate issuance workflow (Admin only)
 * @access  Private - Requires admin signature and contract owner verification
 */
router.post('/issue',
    strictLimiter,
    verifyAdminSignature,
    verifyContractOwner,
    asyncHandler(async (req, res) => {
        const { 
            recipientName, 
            recipientAddress, 
            grade, 
            issuer, 
            description,
            attributes 
        } = req.body;
        
        console.log('🎓 Starting certificate issuance...');
        console.log('   Recipient:', recipientName);
        console.log('   Address:', recipientAddress);
        console.log('   Grade:', grade);
        console.log('   Admin:', req.verifiedAdmin);

        // Validate required fields
        if (!recipientName || !recipientAddress || !grade) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                required: ['recipientName', 'recipientAddress', 'grade']
            });
        }

        // Validate Ethereum address
        if (!web3.utils.isAddress(recipientAddress)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Ethereum address'
            });
        }

        // Step 1: Generate and upload certificate image
        const imageResult = await generateAndUploadCertificateImage({
            name: recipientName,
            grade,
            recipientAddress,
            issuer: issuer || 'Blockchain University'
        });

        // ✨ CLEAR CONSOLE LOGGING FOR IMAGE URL
        console.log('\n╔═══════════════════════════════════════════════════════════════╗');
        console.log('║           📸 CERTIFICATE IMAGE GENERATED                      ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝');
        console.log('📍 IMAGE URL:');
        console.log(`   ${imageResult.imageUrl}`);
        console.log('\n🔗 IPFS HASH:');
        console.log(`   ${imageResult.ipfsHash}`);
        console.log('\n📦 IPFS URI:');
        console.log(`   ${imageResult.ipfsUrl}`);
        console.log('\n📏 FILE SIZE:');
        console.log(`   ${imageResult.pinSize} bytes`);
        console.log('\n⏰ UPLOAD TIMESTAMP:');
        console.log(`   ${imageResult.timestamp}`);
        console.log('╚═══════════════════════════════════════════════════════════════╝\n');

        // Step 2: Create and upload metadata
        console.log('📝 Generating metadata...');
        
        const metadata = {
            name: `Certificate - ${recipientName}`,
            description: description || `Certificate for ${recipientName} with grade ${grade}`,
            image: imageResult.imageUrl,
            issuer: issuer || 'Blockchain University',
            attributes: attributes || [
                {
                    trait_type: 'Recipient Name',
                    value: recipientName
                },
                {
                    trait_type: 'Grade',
                    value: grade
                },
                {
                    trait_type: 'Issue Date',
                    value: new Date().toISOString()
                },
                {
                    trait_type: 'Verified',
                    value: 'True'
                }
            ]
        };

        console.log('📤 Uploading metadata to IPFS...');
        
        const metadataUrl = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
        const pinataMetadata = {
            name: `${recipientName}-metadata`,
            keyvalues: {
                type: 'certificate-metadata',
                certificateName: recipientName,
                uploadedAt: new Date().toISOString()
            }
        };

        const metadataResponse = await axios.post(metadataUrl, metadata, {
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey,
                'Content-Type': 'application/json'
            },
            params: {
                pinataMetadata: JSON.stringify(pinataMetadata)
            }
        });

        const metadataHash = metadataResponse.data.IpfsHash;
        const metadataUri = `ipfs://${metadataHash}`;

        console.log('✅ Metadata uploaded successfully!');
        console.log(`   Metadata Hash: ${metadataHash}`);

        // Step 3: Mint certificate NFT
        console.log('🎨 Minting certificate NFT...');
        
        const contract = new web3.eth.Contract(contractABI, contractAddress);
        const ownerAddress = account.address;

        console.log('   Contract:', contractAddress);
        console.log('   Owner:', ownerAddress);

        // Estimate gas
        const gasEstimate = await contract.methods
            .mintCertificate(recipientAddress, metadataUri)
            .estimateGas({ from: ownerAddress });

        console.log(`   Estimated gas: ${gasEstimate}`);

        const gasLimit = Math.floor(Number(gasEstimate) * 1.2);

        // Send transaction
        const transaction = await contract.methods
            .mintCertificate(recipientAddress, metadataUri)
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
            message: 'Certificate issued successfully!',
            data: {
                tokenId: tokenId.toString(),
                transactionHash: transaction.transactionHash,
                blockNumber: Number(transaction.blockNumber),
                recipient: recipientAddress,
                recipientName,
                grade,
                imageUrl: imageResult.imageUrl,
                imageIpfsHash: imageResult.ipfsHash,
                metadataUrl: `https://gateway.pinata.cloud/ipfs/${metadataHash}`,
                metadataUri: metadataUri,
                gasUsed: transaction.gasUsed.toString(),
                issuedBy: req.verifiedAdmin,
                issuedAt: new Date().toISOString()
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
 * @desc    Verify certificate authenticity and status with image
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
        const tokenURI = await contract.methods.tokenURI(tokenId).call();

        // Fetch metadata from IPFS
        let metadata = null;
        let imageUrl = null;
        let localImagePath = null;

        if (tokenURI.startsWith('ipfs://')) {
            try {
                const ipfsHash = tokenURI.replace('ipfs://', '');
                const metadataUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
                
                console.log('📥 Fetching metadata from IPFS...');
                const metadataResponse = await axios.get(metadataUrl, { timeout: 10000 });
                metadata = metadataResponse.data;

                // Get image URL from metadata
                if (metadata && metadata.image) {
                    imageUrl = metadata.image;
                    console.log('🖼️  Image URL found:', imageUrl);

                    // Download and save image locally
                    try {
                        console.log('💾 Downloading certificate image...');
                        
                        // Create uploads directory if it doesn't exist
                        const uploadsDir = path.join(__dirname, '../../uploads');
                        await fs.mkdir(uploadsDir, { recursive: true });

                        // Generate filename
                        const fileName = `certificate-${tokenId}-${Date.now()}.png`;
                        const filePath = path.join(uploadsDir, fileName);

                        // Download image
                        const imageResponse = await axios({
                            method: 'get',
                            url: imageUrl,
                            responseType: 'stream',
                            timeout: 15000
                        });

                        // Save to file
                        const writer = createWriteStream(filePath);
                        await pipeline(imageResponse.data, writer);

                        localImagePath = `/uploads/${fileName}`;
                        
                        console.log('✅ Certificate image saved successfully!');
                        console.log('\n╔═══════════════════════════════════════════════════════════════╗');
                        console.log('║           💾 CERTIFICATE IMAGE SAVED                          ║');
                        console.log('╚═══════════════════════════════════════════════════════════════╝');
                        console.log('📍 IPFS IMAGE URL:');
                        console.log(`   ${imageUrl}`);
                        console.log('\n💻 LOCAL IMAGE PATH:');
                        console.log(`   ${filePath}`);
                        console.log('\n🌐 PUBLIC URL:');
                        console.log(`   http://localhost:${process.env.PORT || 5000}${localImagePath}`);
                        console.log('╚═══════════════════════════════════════════════════════════════╝\n');

                    } catch (downloadError) {
                        console.warn(`⚠️  Could not download image: ${downloadError.message}`);
                    }
                }
            } catch (metadataError) {
                console.warn(`⚠️  Could not fetch metadata: ${metadataError.message}`);
            }
        }

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
                contractAddress: contractAddress,
                metadata: metadata,
                imageUrl: imageUrl,
                localImageUrl: localImagePath ? `http://localhost:${process.env.PORT || 5000}${localImagePath}` : null
            }
        });
    })
);

/**
 * @route   POST /api/certificates/revoke/:tokenId
 * @desc    Revoke a certificate (owner only)
 * @access  Private - Requires admin signature and contract owner verification
 */
router.post('/revoke/:tokenId',
    strictLimiter,
    verifyAdminSignature,
    verifyContractOwner,
    validateTokenId,
    validateRevocationInput,
    asyncHandler(async (req, res) => {
        const tokenId = req.validatedTokenId;
        const { reason } = req.body;

        console.log(`🚫 Revoking certificate Token ID: ${tokenId}`);
        console.log(`   Admin: ${req.verifiedAdmin}`);
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
                revokedBy: req.verifiedAdmin,
                revokedAt: new Date().toISOString(),
                reason: reason || 'Not specified',
                gasUsed: transaction.gasUsed ? transaction.gasUsed.toString() : undefined
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