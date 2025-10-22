import { useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contract';
import { generateCertificateImage } from './certificateGenerator';
import { uploadImageToIPFS, uploadMetadataToIPFS } from './ipfsUpload';

/**
 * Custom hook for minting certificates directly from the browser
 */
export function useMintCertificate() {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState('');
    const [uploadProgress, setUploadProgress] = useState({ image: 0, metadata: 0 });

    const mintCertificate = async (certificateData, signer) => {
        if (!signer) {
            throw new Error('Signer not provided. Please connect your wallet.');
        }

        const { recipientName, recipientAddress, grade, issuer, description, attributes } = certificateData;

        setIsLoading(true);
        setProgress('Generating certificate image...');
        setUploadProgress({ image: 0, metadata: 0 });

        try {
            // Get issuer address from signer
            const issuerAddress = await signer.getAddress();
            
            // Step 1: Generate certificate image
            const issuedDate = new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
            });

            const imageBlob = await generateCertificateImage({
                name: recipientName,
                grade,
                recipientAddress,
                issuedDate,
                issuer: issuer || 'Blockchain University',
                issuerAddress: issuerAddress,
                tokenId: null // Token ID not available yet
            });

            console.log('✅ Certificate image generated');

            // Step 2: Upload image to IPFS
            setProgress('Uploading certificate image to IPFS...');
            const filename = `certificate-${recipientName.replace(/\s+/g, '-')}-${Date.now()}.png`;
            
            const imageResult = await uploadImageToIPFS(imageBlob, filename, (percent) => {
                setUploadProgress(prev => ({ ...prev, image: percent }));
            });

            console.log('✅ Certificate image uploaded to IPFS');
            console.log(`   Image URL: ${imageResult.imageUrl}`);
            console.log(`   IPFS Hash: ${imageResult.ipfsHash}`);

            // Step 3: Create and upload metadata
            setProgress('Uploading metadata to IPFS...');
            
            const metadata = {
                name: `Certificate - ${recipientName}`,
                description: description || `Certificate for ${recipientName} with grade ${grade}`,
                image: imageResult.imageUrl,
                issuer: issuer || 'Blockchain University',
                issuerAddress: issuerAddress,
                recipientAddress: recipientAddress,
                attributes: attributes || [
                    { trait_type: 'Recipient Name', value: recipientName },
                    { trait_type: 'Recipient Address', value: recipientAddress },
                    { trait_type: 'Issuer Name', value: issuer || 'Blockchain University' },
                    { trait_type: 'Issuer Address', value: issuerAddress },
                    { trait_type: 'Grade', value: grade },
                    { trait_type: 'Issue Date', value: new Date().toISOString() },
                    { trait_type: 'Verified', value: 'True' }
                ]
            };

            const metadataResult = await uploadMetadataToIPFS(
                metadata,
                `${recipientName}-metadata`,
                (percent) => {
                    setUploadProgress(prev => ({ ...prev, metadata: percent }));
                }
            );

            console.log('✅ Metadata uploaded to IPFS');
            console.log(`   Metadata URI: ${metadataResult.metadataUri}`);

            // Step 4: Mint NFT on blockchain
            setProgress('Minting certificate NFT on blockchain...');
            
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            
            // Validate recipient address
            if (!ethers.isAddress(recipientAddress)) {
                throw new Error('Invalid recipient address');
            }

            // Estimate gas
            const gasEstimate = await contract.mintCertificate.estimateGas(
                recipientAddress,
                metadataResult.metadataUri
            );

            console.log(`   Estimated gas: ${gasEstimate.toString()}`);

            // Send transaction with 20% buffer
            const tx = await contract.mintCertificate(
                recipientAddress,
                metadataResult.metadataUri,
                {
                    gasLimit: Math.floor(Number(gasEstimate) * 1.2)
                }
            );

            setProgress('Waiting for transaction confirmation...');
            console.log(`   Transaction sent: ${tx.hash}`);

            // Wait for confirmation
            const receipt = await tx.wait();
            
            console.log('✅ Transaction confirmed!');
            console.log(`   Block number: ${receipt.blockNumber}`);

            // Extract token ID from event
            const event = receipt.logs.find(log => {
                try {
                    const parsedLog = contract.interface.parseLog(log);
                    return parsedLog.name === 'CertificateMinted';
                } catch (e) {
                    return false;
                }
            });

            let tokenId;
            if (event) {
                const parsedLog = contract.interface.parseLog(event);
                tokenId = parsedLog.args.tokenId.toString();
            } else {
                // Fallback: get total minted
                tokenId = await contract.getTotalMinted();
                tokenId = tokenId.toString();
            }

            console.log(`   Token ID: ${tokenId}`);

            setProgress('Certificate minted successfully!');

            // Return complete result
            return {
                success: true,
                tokenId,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                recipient: recipientAddress,
                recipientName,
                grade,
                imageUrl: imageResult.imageUrl,
                imageIpfsHash: imageResult.ipfsHash,
                metadataUrl: metadataResult.metadataUrl,
                metadataUri: metadataResult.metadataUri,
                gasUsed: receipt.gasUsed.toString(),
                issuedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error minting certificate:', error);
            
            let errorMessage = 'Failed to mint certificate';
            
            if (error.code === 'ACTION_REJECTED') {
                errorMessage = 'Transaction rejected by user';
            } else if (error.message.includes('insufficient funds')) {
                errorMessage = 'Insufficient funds for transaction';
            } else if (error.message.includes('execution reverted')) {
                errorMessage = 'Transaction reverted: ' + (error.reason || 'Unknown reason');
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        mintCertificate,
        isLoading,
        progress,
        uploadProgress
    };
}

/**
 * Custom hook for revoking certificates
 */
export function useRevokeCertificate() {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState('');

    const revokeCertificate = async (tokenId, signer) => {
        if (!signer) {
            throw new Error('Signer not provided. Please connect your wallet.');
        }

        setIsLoading(true);
        setProgress('Preparing revocation...');

        try {
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            // Check if certificate exists and is not already revoked
            setProgress('Checking certificate status...');
            
            const isRevoked = await contract.isRevoked(tokenId);
            if (isRevoked) {
                throw new Error('Certificate is already revoked');
            }

            // Estimate gas
            const gasEstimate = await contract.revokeCertificate.estimateGas(tokenId);
            console.log(`   Estimated gas: ${gasEstimate.toString()}`);

            // Send transaction
            setProgress('Revoking certificate...');
            const tx = await contract.revokeCertificate(tokenId, {
                gasLimit: Math.floor(Number(gasEstimate) * 1.2)
            });

            setProgress('Waiting for transaction confirmation...');
            console.log(`   Transaction sent: ${tx.hash}`);

            const receipt = await tx.wait();
            
            console.log('✅ Certificate revoked successfully!');
            console.log(`   Block number: ${receipt.blockNumber}`);

            setProgress('Certificate revoked successfully!');

            return {
                success: true,
                tokenId: tokenId.toString(),
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                revokedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error revoking certificate:', error);
            
            let errorMessage = 'Failed to revoke certificate';
            
            if (error.code === 'ACTION_REJECTED') {
                errorMessage = 'Transaction rejected by user';
            } else if (error.message.includes('Certificate does not exist')) {
                errorMessage = 'Certificate does not exist';
            } else if (error.message.includes('Certificate already revoked')) {
                errorMessage = 'Certificate is already revoked';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        revokeCertificate,
        isLoading,
        progress
    };
}

/**
 * Custom hook for verifying certificates
 */
export function useVerifyCertificate() {
    const [isLoading, setIsLoading] = useState(false);

    const verifyCertificate = async (tokenId, provider) => {
        if (!provider) {
            throw new Error('Provider not provided');
        }

        setIsLoading(true);

        try {
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

            // Verify certificate
            const isValid = await contract.verifyCertificate(tokenId);
            
            if (!isValid) {
                return {
                    tokenId: tokenId.toString(),
                    isValid: false,
                    status: 'INVALID',
                    reason: 'Certificate may be revoked or does not exist'
                };
            }

            // Get certificate details
            const details = await contract.getCertificateDetails(tokenId);
            const isRevoked = await contract.isRevoked(tokenId);

            // Fetch metadata from IPFS
            let metadata = null;
            let imageUrl = null;

            const tokenURI = details.uri;
            if (tokenURI.startsWith('ipfs://')) {
                try {
                    const ipfsHash = tokenURI.replace('ipfs://', '');
                    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
                    
                    const response = await fetch(metadataUrl);
                    metadata = await response.json();
                    
                    if (metadata && metadata.image) {
                        imageUrl = metadata.image;
                    }
                } catch (metadataError) {
                    console.warn('Could not fetch metadata:', metadataError.message);
                }
            }

            return {
                tokenId: tokenId.toString(),
                isValid: true,
                status: 'VALID',
                owner: details.owner,
                mintedAt: new Date(Number(details.mintedAt) * 1000).toISOString(),
                revoked: isRevoked,
                tokenURI: details.uri,
                metadata,
                imageUrl,
                verifiedAt: new Date().toISOString(),
                contractAddress: CONTRACT_ADDRESS
            };

        } catch (error) {
            console.error('Error verifying certificate:', error);
            
            if (error.message.includes('Certificate does not exist')) {
                return {
                    tokenId: tokenId.toString(),
                    isValid: false,
                    status: 'NOT_FOUND',
                    reason: 'Certificate does not exist'
                };
            }
            
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        verifyCertificate,
        isLoading
    };
}

/**
 * Custom hook for getting contract statistics
 */
export function useContractStats() {
    const [isLoading, setIsLoading] = useState(false);

    const getStats = async (provider) => {
        if (!provider) {
            throw new Error('Provider not provided');
        }

        setIsLoading(true);

        try {
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

            const totalMinted = await contract.getTotalMinted();
            const owner = await contract.owner();
            const name = await contract.name();
            const symbol = await contract.symbol();

            return {
                totalMinted: totalMinted.toString(),
                contractName: name,
                contractSymbol: symbol,
                contractOwner: owner,
                contractAddress: CONTRACT_ADDRESS,
                network: 'localhost' // You can get this from provider.getNetwork()
            };

        } catch (error) {
            console.error('Error fetching stats:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        getStats,
        isLoading
    };
}
