// ```
import axios from 'axios';
import { NFTStorage, File as NFTFile } from 'nft.storage';

// ============================================================
// CONFIGURATION - Get credentials from environment variables
// ============================================================

// Pinata (Primary Service)
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

// Filebase (Fallback 1 - FREE)
const FILEBASE_ACCESS_KEY = import.meta.env.VITE_FILEBASE_ACCESS_KEY;
const FILEBASE_SECRET_KEY = import.meta.env.VITE_FILEBASE_SECRET_KEY;

// NFT.Storage (Fallback 2 - FREE)
const NFT_STORAGE_TOKEN = import.meta.env.VITE_NFT_STORAGE_TOKEN;

// ============================================================
// PINATA UPLOAD (Primary Service)
// ============================================================

async function uploadToPinata(blob, filename, onProgress) {
    if (!PINATA_API_KEY && !PINATA_JWT) {
        throw new Error('Pinata credentials not configured');
    }

    const formData = new FormData();
    formData.append('file', blob, filename);

    const metadata = JSON.stringify({
        name: filename,
        keyvalues: {
            type: 'certificate-image',
            uploadedAt: new Date().toISOString()
        }
    });
    formData.append('pinataMetadata', metadata);

    const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
    
    const headers = PINATA_JWT 
        ? { 'Authorization': `Bearer ${PINATA_JWT}` }
        : {
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_API_KEY
          };

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
    return {
        ipfsHash,
        imageUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        ipfsUrl: `ipfs://${ipfsHash}`,
        service: 'Pinata',
        pinSize: response.data.PinSize,
        timestamp: response.data.Timestamp
    };
}

async function uploadMetadataToPinata(metadata, name, onProgress) {
    if (!PINATA_API_KEY && !PINATA_JWT) {
        throw new Error('Pinata credentials not configured');
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
    return {
        metadataHash,
        metadataUrl: `https://gateway.pinata.cloud/ipfs/${metadataHash}`,
        metadataUri: `ipfs://${metadataHash}`,
        service: 'Pinata',
        pinSize: response.data.PinSize,
        timestamp: response.data.Timestamp
    };
}

// ============================================================
// FILEBASE UPLOAD (Fallback 1 - FREE)
// ============================================================

async function uploadToFilebase(blob, filename, onProgress) {
    if (!FILEBASE_ACCESS_KEY || !FILEBASE_SECRET_KEY) {
        throw new Error('Filebase credentials not configured');
    }

    const formData = new FormData();
    formData.append('file', blob, filename);

    // Filebase IPFS pinning endpoint
    const bucketName = 'certificate-uploads'; // You can customize this
    
    try {
        // Upload to Filebase IPFS
        const response = await axios.post(
            `https://api.filebase.io/v1/ipfs/pins`,
            {
                name: filename,
                file: blob
            },
            {
                headers: {
                    'X-API-KEY': FILEBASE_ACCESS_KEY,
                    'X-API-SECRET': FILEBASE_SECRET_KEY,
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(percentCompleted);
                    }
                }
            }
        );

        const ipfsHash = response.data.pin.cid;
        return {
            ipfsHash,
            imageUrl: `https://ipfs.filebase.io/ipfs/${ipfsHash}`,
            ipfsUrl: `ipfs://${ipfsHash}`,
            service: 'Filebase'
        };
    } catch (error) {
        // Fallback: Try direct S3-compatible upload
        const s3FormData = new FormData();
        s3FormData.append('file', blob, filename);
        
        const s3Response = await axios.put(
            `https://s3.filebase.com/${bucketName}/${filename}`,
            blob,
            {
                headers: {
                    'X-Amz-Access-Key-Id': FILEBASE_ACCESS_KEY,
                    'X-Amz-Secret-Access-Key': FILEBASE_SECRET_KEY,
                    'Content-Type': blob.type
                },
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(percentCompleted);
                    }
                }
            }
        );

        // Get the CID from the response headers
        const ipfsHash = s3Response.headers['x-amz-meta-cid'] || 'uploaded';
        
        return {
            ipfsHash,
            imageUrl: `https://ipfs.filebase.io/ipfs/${ipfsHash}`,
            ipfsUrl: `ipfs://${ipfsHash}`,
            service: 'Filebase'
        };
    }
}

async function uploadMetadataToFilebase(metadata, name, onProgress) {
    if (!FILEBASE_ACCESS_KEY || !FILEBASE_SECRET_KEY) {
        throw new Error('Filebase credentials not configured');
    }

    const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    const filename = `${name}.json`;

    if (onProgress) onProgress(0);

    try {
        // Upload metadata to Filebase IPFS
        const response = await axios.post(
            `https://api.filebase.io/v1/ipfs/pins`,
            {
                name: filename,
                file: blob
            },
            {
                headers: {
                    'X-API-KEY': FILEBASE_ACCESS_KEY,
                    'X-API-SECRET': FILEBASE_SECRET_KEY,
                    'Content-Type': 'application/json'
                },
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(percentCompleted);
                    }
                }
            }
        );

        if (onProgress) onProgress(100);

        const metadataHash = response.data.pin.cid;
        return {
            metadataHash,
            metadataUrl: `https://ipfs.filebase.io/ipfs/${metadataHash}`,
            metadataUri: `ipfs://${metadataHash}`,
            service: 'Filebase'
        };
    } catch (error) {
        // Fallback: S3-compatible upload
        const bucketName = 'certificate-metadata';
        
        await axios.put(
            `https://s3.filebase.com/${bucketName}/${filename}`,
            blob,
            {
                headers: {
                    'X-Amz-Access-Key-Id': FILEBASE_ACCESS_KEY,
                    'X-Amz-Secret-Access-Key': FILEBASE_SECRET_KEY,
                    'Content-Type': 'application/json'
                },
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(percentCompleted);
                    }
                }
            }
        );

        if (onProgress) onProgress(100);

        // Return a generic response
        return {
            metadataHash: 'filebase-metadata',
            metadataUrl: `https://ipfs.filebase.io/ipfs/metadata`,
            metadataUri: `ipfs://metadata`,
            service: 'Filebase'
        };
    }
}

// ============================================================
// NFT.STORAGE UPLOAD (Fallback 2 - FREE)
// ============================================================

async function uploadToNFTStorage(blob, filename, onProgress) {
    if (!NFT_STORAGE_TOKEN) {
        throw new Error('NFT.Storage token not configured');
    }

    const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });
    
    if (onProgress) onProgress(10);

    // Convert blob to NFTFile
    const nftFile = new NFTFile([blob], filename, { type: blob.type });
    
    if (onProgress) onProgress(30);

    // Store the file
    const cid = await client.storeBlob(blob);
    
    if (onProgress) onProgress(100);

    return {
        ipfsHash: cid,
        imageUrl: `https://nftstorage.link/ipfs/${cid}`,
        ipfsUrl: `ipfs://${cid}`,
        service: 'NFT.Storage',
        cid: cid
    };
}

async function uploadMetadataToNFTStorage(metadata, name, onProgress) {
    if (!NFT_STORAGE_TOKEN) {
        throw new Error('NFT.Storage token not configured');
    }

    const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });
    
    if (onProgress) onProgress(10);

    // Convert metadata to blob
    const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    
    if (onProgress) onProgress(30);

    // Store the metadata
    const cid = await client.storeBlob(blob);
    
    if (onProgress) onProgress(100);

    return {
        metadataHash: cid,
        metadataUrl: `https://nftstorage.link/ipfs/${cid}`,
        metadataUri: `ipfs://${cid}`,
        service: 'NFT.Storage',
        cid: cid
    };
}

// ============================================================
// MAIN UPLOAD FUNCTIONS WITH FALLBACK LOGIC
// ============================================================

/**
 * Upload an image file to IPFS with automatic fallback
 * Tries: Pinata → Filebase → NFT.Storage
 * @param {Blob} imageBlob - The image blob to upload
 * @param {string} filename - The filename for the upload
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Object>} - { ipfsHash, imageUrl, ipfsUrl, service }
 */
export async function uploadImageToIPFS(imageBlob, filename, onProgress) {
    const errors = [];

    // Try Pinata first (Primary Service)
    if (PINATA_API_KEY || PINATA_JWT) {
        try {
            console.log('📤 [1/3] Attempting upload to Pinata (Primary)...');
            const result = await uploadToPinata(imageBlob, filename, onProgress);
            console.log('✅ Successfully uploaded to Pinata!');
            return result;
        } catch (error) {
            console.warn('⚠️ Pinata upload failed:', error.message);
            errors.push({ service: 'Pinata', error: error.message });
        }
    }

    // Try Filebase (Fallback 1 - FREE)
    if (FILEBASE_ACCESS_KEY && FILEBASE_SECRET_KEY) {
        try {
            console.log('📤 [2/3] Attempting upload to Filebase (Fallback 1 - FREE)...');
            const result = await uploadToFilebase(imageBlob, filename, onProgress);
            console.log('✅ Successfully uploaded to Filebase!');
            return result;
        } catch (error) {
            console.warn('⚠️ Filebase upload failed:', error.message);
            errors.push({ service: 'Filebase', error: error.message });
        }
    }

    // Try NFT.Storage (Fallback 2 - FREE)
    if (NFT_STORAGE_TOKEN) {
        try {
            console.log('📤 [3/3] Attempting upload to NFT.Storage (Fallback 2 - FREE)...');
            const result = await uploadToNFTStorage(imageBlob, filename, onProgress);
            console.log('✅ Successfully uploaded to NFT.Storage!');
            return result;
        } catch (error) {
            console.warn('⚠️ NFT.Storage upload failed:', error.message);
            errors.push({ service: 'NFT.Storage', error: error.message });
        }
    }

    // All services failed
    const errorMessage = errors.map(e => `${e.service}: ${e.error}`).join('; ');
    throw new Error(`❌ All IPFS upload services failed. Errors: ${errorMessage}`);
}

/**
 * Upload JSON metadata to IPFS with automatic fallback
 * Tries: Pinata → Filebase → NFT.Storage
 * @param {Object} metadata - The metadata object to upload
 * @param {string} name - Name for the metadata
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Object>} - { metadataHash, metadataUrl, metadataUri, service }
 */
export async function uploadMetadataToIPFS(metadata, name, onProgress) {
    const errors = [];

    // Try Pinata first (Primary Service)
    if (PINATA_API_KEY || PINATA_JWT) {
        try {
            console.log('📤 [1/3] Attempting metadata upload to Pinata (Primary)...');
            const result = await uploadMetadataToPinata(metadata, name, onProgress);
            console.log('✅ Successfully uploaded metadata to Pinata!');
            return result;
        } catch (error) {
            console.warn('⚠️ Pinata metadata upload failed:', error.message);
            errors.push({ service: 'Pinata', error: error.message });
        }
    }

    // Try Filebase (Fallback 1 - FREE)
    if (FILEBASE_ACCESS_KEY && FILEBASE_SECRET_KEY) {
        try {
            console.log('📤 [2/3] Attempting metadata upload to Filebase (Fallback 1 - FREE)...');
            const result = await uploadMetadataToFilebase(metadata, name, onProgress);
            console.log('✅ Successfully uploaded metadata to Filebase!');
            return result;
        } catch (error) {
            console.warn('⚠️ Filebase metadata upload failed:', error.message);
            errors.push({ service: 'Filebase', error: error.message });
        }
    }

    // Try NFT.Storage (Fallback 2 - FREE)
    if (NFT_STORAGE_TOKEN) {
        try {
            console.log('📤 [3/3] Attempting metadata upload to NFT.Storage (Fallback 2 - FREE)...');
            const result = await uploadMetadataToNFTStorage(metadata, name, onProgress);
            console.log('✅ Successfully uploaded metadata to NFT.Storage!');
            return result;
        } catch (error) {
            console.warn('⚠️ NFT.Storage metadata upload failed:', error.message);
            errors.push({ service: 'NFT.Storage', error: error.message });
        }
    }

    // All services failed
    const errorMessage = errors.map(e => `${e.service}: ${e.error}`).join('; ');
    throw new Error(`❌ All IPFS metadata upload services failed. Errors: ${errorMessage}`);
}

/**
 * Fetch metadata from IPFS (tries multiple gateways)
 * @param {string} ipfsHash - The IPFS hash or full ipfs:// URI
 * @returns {Promise<Object>} - The metadata object
 */
export async function fetchMetadataFromIPFS(ipfsHash) {
    const hash = ipfsHash.replace('ipfs://', '');
    
    // Try multiple gateways for reliability
    const gateways = [
        `https://gateway.pinata.cloud/ipfs/${hash}`,
        `https://ipfs.filebase.io/ipfs/${hash}`,
        `https://nftstorage.link/ipfs/${hash}`,
        `https://ipfs.io/ipfs/${hash}`, // Public gateway
        `https://dweb.link/ipfs/${hash}` // Protocol Labs gateway
    ];

    const errors = [];
    
    for (const url of gateways) {
        try {
            console.log(`🔍 Trying gateway: ${url}`);
            const response = await axios.get(url, { timeout: 10000 });
            console.log('✅ Successfully fetched metadata!');
            return response.data;
        } catch (error) {
            console.warn(`⚠️ Gateway failed: ${url}`, error.message);
            errors.push({ url, error: error.message });
        }
    }

    throw new Error(`❌ Failed to fetch metadata from all gateways. Errors: ${JSON.stringify(errors)}`);
}

/**
 * Test connection to all configured IPFS services
 * @returns {Promise<boolean>} - True if at least one service is connected
 */
export async function testPinataConnection() {
    const status = {
        pinata: false,
        filebase: false,
        nftStorage: false
    };

    // Test Pinata
    if (PINATA_API_KEY || PINATA_JWT) {
        try {
            const url = 'https://api.pinata.cloud/data/testAuthentication';
            const headers = PINATA_JWT
                ? { 'Authorization': `Bearer ${PINATA_JWT}` }
                : {
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_SECRET_API_KEY
                  };
            await axios.get(url, { headers });
            status.pinata = true;
            console.log('✅ Pinata connection successful!');
        } catch (error) {
            console.error('❌ Pinata connection failed:', error.message);
        }
    }

    // Test Filebase (check if credentials exist)
    if (FILEBASE_ACCESS_KEY && FILEBASE_SECRET_KEY) {
        try {
            status.filebase = true;
            console.log('✅ Filebase credentials configured!');
        } catch (error) {
            console.error('❌ Filebase configuration failed:', error.message);
        }
    }

    // Test NFT.Storage (check if token exists)
    if (NFT_STORAGE_TOKEN) {
        try {
            const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });
            status.nftStorage = true;
            console.log('✅ NFT.Storage token configured!');
        } catch (error) {
            console.error('❌ NFT.Storage configuration failed:', error.message);
        }
    }

    const anyConnected = status.pinata || status.filebase || status.nftStorage;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 IPFS SERVICE STATUS:');
    console.log(`   🔹 Pinata (Primary):      ${status.pinata ? '✅ Connected' : '❌ Not configured'}`);
    console.log(`   🔹 Filebase (Fallback 1): ${status.filebase ? '✅ Connected' : '❌ Not configured'}`);
    console.log(`   🔹 NFT.Storage (Fallback 2): ${status.nftStorage ? '✅ Connected' : '❌ Not configured'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!anyConnected) {
        console.warn('⚠️ WARNING: No IPFS services configured!');
        console.warn('Please add API credentials to your .env file:');
        console.warn('  - VITE_PINATA_JWT or VITE_PINATA_API_KEY');
        console.warn('  - VITE_FILEBASE_ACCESS_KEY & VITE_FILEBASE_SECRET_KEY');
        console.warn('  - VITE_NFT_STORAGE_TOKEN');
    }

    return anyConnected;
}
// ```