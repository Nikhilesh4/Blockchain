const express = require('express');
const router = express.Router();
const multer = require('multer');
const Web3 = require('web3');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// =================================================================
// IMPORTANT: CONFIGURE YOUR DETAILS HERE
// =================================================================
const contractJsonPath = path.resolve(__dirname, '../../artifacts/contracts/CertificateNFT.sol/CertificateNFT.json');
const contractABI = require(contractJsonPath).abi;
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// For MetaMask: Use the network you deployed to
// Options:
// - 'http://127.0.0.1:8545' for Hardhat local node
// - 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY' for Sepolia testnet
// - 'https://polygon-amoy.infura.io/v3/YOUR_INFURA_KEY' for Polygon Amoy testnet
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'));

// IMPORTANT: Add your MetaMask account's private key (NEVER commit this!)
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Add this to your .env file
const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
// =================================================================

// Get Pinata keys from .env file
const pinataApiKey = process.env.PINATA_API_KEY;
const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

// Use multer to handle file uploads in memory, not saving to disk
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * @route   POST /api/certificates/upload-image
 * @desc    Uploads only the image to Pinata IPFS
 */
router.post('/upload-image', upload.single('template'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    try {
        const formData = new FormData();
        // The readable stream is needed for Pinata's API
        const fileStream = require('stream').Readable.from(req.file.buffer);
        fileStream.path = req.file.originalname;
        formData.append('file', fileStream);

        const response = await axios.post(url, formData, {
            headers: {
                ...formData.getHeaders(),
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey,
            },
        });

        const ipfsHash = response.data.IpfsHash;
        const imageUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

        res.status(200).json({
            message: 'Image uploaded to Pinata successfully!',
            ipfsHash: ipfsHash,
            imageUrl: imageUrl, // Use this URL in the next step
        });
    } catch (error) {
        console.error('Error uploading to Pinata:', error);
        res.status(500).json({ message: 'Error uploading image to Pinata', error: error.message });
    }
});

/**
 * @route   POST /api/certificates/generate-metadata
 * @desc    Creates metadata, uploads it to Pinata, and returns the metadata IPFS hash
 */
router.post('/generate-metadata', async (req, res) => {
    const { name, description, imageUrl } = req.body;
    console.log("Received metadata:", req.body);
    if (!name || !description || !imageUrl) {
        return res.status(400).json({ message: 'Missing required metadata fields.' });
    }

    const metadata = { name, description, image: imageUrl };
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;

    try {
        const response = await axios.post(url, metadata, {
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey,
            },
        });

        const metadataHash = response.data.IpfsHash;
        const metadataUrl = `ipfs://${metadataHash}`;

        res.status(200).json({
            message: 'Metadata uploaded successfully!',
            metadataHash: metadataHash,
            metadataUrl: metadataUrl, // This is the tokenURI for minting
        });
    } catch (error) {
        console.error('Error uploading metadata to Pinata:', error);
        res.status(500).json({ message: 'Error uploading metadata to Pinata', error: error.message });
    }
});

/**
 * @route   POST /api/certificates/mint
 * @desc    Triggers smart contract minting with the metadata URL from Pinata
 */
router.post('/mint', async (req, res) => {
    console.log("Minting request received:", req.body);
    const { recipientAddress, metadataUrl } = req.body;

    try {
        const contract = new web3.eth.Contract(contractABI, contractAddress);
        
        // Use the account from private key instead of web3.eth.getAccounts()
        const ownerAddress = account.address;

        const transaction = await contract.methods.mintCertificate(recipientAddress, metadataUrl).send({ 
            from: ownerAddress, 
            gas: 500000 
        });
        
        const tokenId = transaction.events.Transfer.returnValues.tokenId;

        res.status(200).json({
            message: 'Certificate minted successfully!',
            transactionHash: transaction.transactionHash,
            tokenId: tokenId,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error minting certificate', error: error.message });
    }
});


// The remaining endpoints do not change as they only interact with the blockchain.
router.get('/:tokenId', async (req, res) => { /* ... same as before ... */ });
router.get('/verify/:tokenId', async (req, res) => { /* ... same as before ... */ });
router.post('/revoke/:tokenId', async (req, res) => { /* ... same as before ... */ });

module.exports = router;