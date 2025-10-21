import axios from 'axios';

// Pinata configuration - these should be in your .env file
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

/**
 * Upload an image file to IPFS via Pinata
 * @param {Blob} imageBlob - The image blob to upload
 * @param {string} filename - The filename for the upload
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Object>} - { ipfsHash, imageUrl, ipfsUrl }
 */
export async function uploadImageToIPFS(imageBlob, filename, onProgress) {
    if (!PINATA_API_KEY && !PINATA_JWT) {
        throw new Error('Pinata API credentials not configured. Please add VITE_PINATA_API_KEY and VITE_PINATA_SECRET_API_KEY or VITE_PINATA_JWT to your .env file');
    }

    const formData = new FormData();
    formData.append('file', imageBlob, filename);

    // Add metadata
    const metadata = JSON.stringify({
        name: filename,
        keyvalues: {
            type: 'certificate-image',
            uploadedAt: new Date().toISOString()
        }
    });
    formData.append('pinataMetadata', metadata);

    // Upload to Pinata
    const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
    
    const headers = PINATA_JWT 
        ? {
            'Authorization': `Bearer ${PINATA_JWT}`
          }
        : {
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_API_KEY
          };

    try {
        const response = await axios.post(url, formData, {
            headers,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            }
        });

        const ipfsHash = response.data.IpfsHash;
        const imageUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

        console.log('✅ Image uploaded to IPFS!');
        console.log(`   IPFS Hash: ${ipfsHash}`);
        console.log(`   Gateway URL: ${imageUrl}`);

        return {
            ipfsHash,
            imageUrl,
            ipfsUrl: `ipfs://${ipfsHash}`,
            pinSize: response.data.PinSize,
            timestamp: response.data.Timestamp
        };
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        throw new Error(`Failed to upload image to IPFS: ${error.response?.data?.error || error.message}`);
    }
}

/**
 * Upload JSON metadata to IPFS via Pinata
 * @param {Object} metadata - The metadata object to upload
 * @param {string} name - Name for the metadata
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Object>} - { metadataHash, metadataUrl, metadataUri }
 */
export async function uploadMetadataToIPFS(metadata, name, onProgress) {
    if (!PINATA_API_KEY && !PINATA_JWT) {
        throw new Error('Pinata API credentials not configured. Please add VITE_PINATA_API_KEY and VITE_PINATA_SECRET_API_KEY or VITE_PINATA_JWT to your .env file');
    }

    const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
    
    const headers = PINATA_JWT
        ? {
            'Authorization': `Bearer ${PINATA_JWT}`,
            'Content-Type': 'application/json'
          }
        : {
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_API_KEY,
            'Content-Type': 'application/json'
          };

    const data = {
        pinataContent: metadata,
        pinataMetadata: {
            name: name,
            keyvalues: {
                type: 'certificate-metadata',
                uploadedAt: new Date().toISOString()
            }
        }
    };

    try {
        if (onProgress) onProgress(0);

        const response = await axios.post(url, data, {
            headers,
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            }
        });

        if (onProgress) onProgress(100);

        const metadataHash = response.data.IpfsHash;
        const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataHash}`;

        console.log('✅ Metadata uploaded to IPFS!');
        console.log(`   Metadata Hash: ${metadataHash}`);
        console.log(`   Gateway URL: ${metadataUrl}`);

        return {
            metadataHash,
            metadataUrl,
            metadataUri: `ipfs://${metadataHash}`,
            pinSize: response.data.PinSize,
            timestamp: response.data.Timestamp
        };
    } catch (error) {
        console.error('Error uploading metadata to IPFS:', error);
        throw new Error(`Failed to upload metadata to IPFS: ${error.response?.data?.error || error.message}`);
    }
}

/**
 * Fetch metadata from IPFS
 * @param {string} ipfsHash - The IPFS hash or full ipfs:// URI
 * @returns {Promise<Object>} - The metadata object
 */
export async function fetchMetadataFromIPFS(ipfsHash) {
    // Handle both ipfs:// URIs and raw hashes
    const hash = ipfsHash.replace('ipfs://', '');
    const url = `https://gateway.pinata.cloud/ipfs/${hash}`;

    try {
        const response = await axios.get(url, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching metadata from IPFS:', error);
        throw new Error(`Failed to fetch metadata from IPFS: ${error.message}`);
    }
}

/**
 * Test Pinata connection
 * @returns {Promise<boolean>} - True if connection is successful
 */
export async function testPinataConnection() {
    if (!PINATA_API_KEY && !PINATA_JWT) {
        console.warn('Pinata API credentials not configured');
        return false;
    }

    try {
        const url = 'https://api.pinata.cloud/data/testAuthentication';
        
        const headers = PINATA_JWT
            ? { 'Authorization': `Bearer ${PINATA_JWT}` }
            : {
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_API_KEY
              };

        const response = await axios.get(url, { headers });
        console.log('✅ Pinata connection successful!', response.data);
        return true;
    } catch (error) {
        console.error('❌ Pinata connection failed:', error.response?.data || error.message);
        return false;
    }
}
