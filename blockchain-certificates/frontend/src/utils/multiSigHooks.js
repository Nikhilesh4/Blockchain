import { useState } from 'react';
import { ethers } from 'ethers';
import { generateCertificateImage } from './certificateGenerator';
import { uploadImageToIPFS, uploadMetadataToIPFS } from './ipfsUpload';
import { fetchCertificateMetadata } from './resilientIpfsFetch';

// Import the MultiSig contract ABI
// You'll need to create this file after deployment
const MULTISIG_CONTRACT_ABI = [
    "function requestCertificate(address recipient, string tokenURI) returns (uint256)",
    "function approveCertificate(uint256 requestId)",
    "function executeMint(uint256 requestId)",
    "function getRequestDetails(uint256 requestId) view returns (address, string, uint256, bool, address, uint256)",
    "function hasApproved(uint256 requestId, address issuer) view returns (bool)",
    "function verifyCertificate(uint256 tokenId) view returns (bool)",
    "function getCertificateDetails(uint256 tokenId) view returns (address, uint256, bool, string)",
    "function isRevoked(uint256 tokenId) view returns (bool)",
    "function getTotalMinted() view returns (uint256)",
    "function revokeCertificate(uint256 tokenId)",
    "function requiredApprovals() view returns (uint256)",
    "function isIssuer(address account) view returns (bool)",
    "event CertificateRequested(uint256 indexed requestId, address indexed recipient, address indexed requestedBy)",
    "event CertificateApproved(uint256 indexed requestId, address indexed approver, uint256 currentApprovals, uint256 requiredApprovals)",
    "event CertificateMinted(uint256 indexed tokenId, address indexed recipient, string tokenURI)"
];

// Get contract address from environment or deployment file
const MULTISIG_CONTRACT_ADDRESS = import.meta.env.VITE_MULTISIG_CONTRACT_ADDRESS || 
    '0x5FbDB2315678afecb367f032d93F642f64180aa3';

/**
 * Hook for requesting certificate with multi-sig
 */
export function useRequestCertificate() {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState('');
    const [uploadProgress, setUploadProgress] = useState({ image: 0, metadata: 0 });

    const requestCertificate = async (certificateData, signer) => {
        if (!signer) {
            throw new Error('Signer not provided. Please connect your wallet.');
        }

        const { recipientName, recipientAddress, grade, issuer, description, attributes } = certificateData;

        setIsLoading(true);
        setProgress('Generating certificate image...');
        setUploadProgress({ image: 0, metadata: 0 });

        try {
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
                issuer: issuer || 'Blockchain University'
            });

            console.log('✅ Certificate image generated');

            // Step 2: Upload to IPFS
            setProgress('Uploading certificate image to IPFS...');
            const filename = `certificate-${recipientName.replace(/\s+/g, '-')}-${Date.now()}.png`;
            
            const imageResult = await uploadImageToIPFS(imageBlob, filename, (percent) => {
                setUploadProgress(prev => ({ ...prev, image: percent }));
            });

            console.log('✅ Image uploaded to IPFS');

            // Step 3: Upload metadata
            setProgress('Uploading metadata to IPFS...');
            
            const metadata = {
                name: `Certificate - ${recipientName}`,
                description: description || `Certificate for ${recipientName} with grade ${grade}`,
                image: imageResult.imageUrl,
                issuer: issuer || 'Blockchain University',
                attributes: attributes || [
                    { trait_type: 'Recipient Name', value: recipientName },
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

            // Step 4: Submit request to multi-sig contract
            setProgress('Submitting certificate request...');
            
            const contract = new ethers.Contract(
                MULTISIG_CONTRACT_ADDRESS, 
                MULTISIG_CONTRACT_ABI, 
                signer
            );
            
            // Validate recipient address
            if (!ethers.isAddress(recipientAddress)) {
                throw new Error('Invalid recipient address');
            }

            // Check if user is an issuer
            const issuerAddress = await signer.getAddress();
            const isIssuer = await contract.isIssuer(issuerAddress);
            
            if (!isIssuer) {
                throw new Error('You are not authorized as an issuer');
            }

            // Request certificate (auto-approves from requester)
            const tx = await contract.requestCertificate(
                recipientAddress,
                metadataResult.metadataUri
            );

            setProgress('Waiting for transaction confirmation...');
            console.log(`   Transaction sent: ${tx.hash}`);

            const receipt = await tx.wait();
            console.log('✅ Request submitted!');

            // Extract request ID from event
            const event = receipt.logs.find(log => {
                try {
                    const parsedLog = contract.interface.parseLog(log);
                    return parsedLog.name === 'CertificateRequested';
                } catch (e) {
                    return false;
                }
            });

            let requestId;
            if (event) {
                const parsedLog = contract.interface.parseLog(event);
                requestId = parsedLog.args.requestId.toString();
            }

            // Check if it was auto-minted (if only 1 approval needed)
            const requiredApprovals = await contract.requiredApprovals();
            const autoMinted = Number(requiredApprovals) === 1;

            setProgress(autoMinted ? 'Certificate minted!' : 'Request submitted - awaiting additional approvals');

            return {
                success: true,
                requestId,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                recipient: recipientAddress,
                recipientName,
                grade,
                imageUrl: imageResult.imageUrl,
                imageIpfsHash: imageResult.ipfsHash,
                metadataUrl: metadataResult.metadataUrl,
                metadataUri: metadataResult.metadataUri,
                requiredApprovals: Number(requiredApprovals),
                currentApprovals: 1,
                autoMinted,
                issuedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error requesting certificate:', error);
            
            let errorMessage = 'Failed to request certificate';
            
            if (error.code === 'ACTION_REJECTED') {
                errorMessage = 'Transaction rejected by user';
            } else if (error.message.includes('not authorized')) {
                errorMessage = 'You are not authorized as an issuer';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        requestCertificate,
        isLoading,
        progress,
        uploadProgress
    };
}

/**
 * Hook for approving certificate requests
 */
export function useApproveCertificate() {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState('');

    const approveCertificate = async (requestId, signer) => {
        if (!signer) {
            throw new Error('Signer not provided');
        }

        setIsLoading(true);
        setProgress('Checking request status...');

        try {
            const contract = new ethers.Contract(
                MULTISIG_CONTRACT_ADDRESS,
                MULTISIG_CONTRACT_ABI,
                signer
            );

            // Check if user is an issuer
            const issuerAddress = await signer.getAddress();
            const isIssuer = await contract.isIssuer(issuerAddress);
            
            if (!isIssuer) {
                throw new Error('You are not authorized as an issuer');
            }

            // Check if already approved
            const hasApproved = await contract.hasApproved(requestId, issuerAddress);
            if (hasApproved) {
                throw new Error('You have already approved this request');
            }

            // Get request details
            const details = await contract.getRequestDetails(requestId);
            if (details[3]) { // executed
                throw new Error('Request has already been executed');
            }

            // Approve
            setProgress('Submitting approval...');
            const tx = await contract.approveCertificate(requestId);

            setProgress('Waiting for confirmation...');
            const receipt = await tx.wait();

            console.log('✅ Approval confirmed!');

            // Check if it triggered minting
            const mintEvent = receipt.logs.find(log => {
                try {
                    const parsedLog = contract.interface.parseLog(log);
                    return parsedLog.name === 'CertificateMinted';
                } catch (e) {
                    return false;
                }
            });

            const wasMinted = !!mintEvent;
            let tokenId;

            if (wasMinted) {
                const parsedLog = contract.interface.parseLog(mintEvent);
                tokenId = parsedLog.args.tokenId.toString();
                setProgress('Certificate minted successfully!');
            } else {
                setProgress('Approval recorded - more approvals needed');
            }

            return {
                success: true,
                requestId: requestId.toString(),
                transactionHash: receipt.hash,
                wasMinted,
                tokenId,
                approvedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error approving certificate:', error);
            throw new Error(error.message || 'Failed to approve certificate');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        approveCertificate,
        isLoading,
        progress
    };
}

/**
 * Hook for getting pending requests
 */
export function usePendingRequests() {
    const [isLoading, setIsLoading] = useState(false);

    const getPendingRequests = async (provider, fromRequestId = 1, toRequestId = 100) => {
        setIsLoading(true);

        try {
            const contract = new ethers.Contract(
                MULTISIG_CONTRACT_ADDRESS,
                MULTISIG_CONTRACT_ABI,
                provider
            );

            const pending = [];

            // Query requests (in production, use events for better performance)
            for (let i = fromRequestId; i <= toRequestId; i++) {
                try {
                    const details = await contract.getRequestDetails(i);
                    
                    if (details[4] !== ethers.ZeroAddress && !details[3]) {
                        // Request exists and not executed
                        pending.push({
                            requestId: i,
                            recipient: details[0],
                            tokenURI: details[1],
                            approvalCount: Number(details[2]),
                            executed: details[3],
                            requestedBy: details[4],
                            requestedAt: new Date(Number(details[5]) * 1000).toISOString()
                        });
                    }
                } catch (e) {
                    // Request doesn't exist, continue
                    break;
                }
            }

            return pending;

        } catch (error) {
            console.error('Error fetching pending requests:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        getPendingRequests,
        isLoading
    };
}

/**
 * Hook for multi-sig verification (same as regular verification)
 */
export function useMultiSigVerify() {
    const [isLoading, setIsLoading] = useState(false);

    const verifyCertificate = async (tokenId, provider) => {
        if (!provider) {
            throw new Error('Provider not provided');
        }

        setIsLoading(true);

        try {
            const contract = new ethers.Contract(
                MULTISIG_CONTRACT_ADDRESS,
                MULTISIG_CONTRACT_ABI,
                provider
            );

            const isValid = await contract.verifyCertificate(tokenId);
            
            if (!isValid) {
                return {
                    tokenId: tokenId.toString(),
                    isValid: false,
                    status: 'INVALID'
                };
            }

            const details = await contract.getCertificateDetails(tokenId);
            const isRevoked = await contract.isRevoked(tokenId);

            // Fetch metadata using multi-gateway
            let metadata = null;
            let imageUrl = null;

            const tokenURI = details[3];
            if (tokenURI.startsWith('ipfs://')) {
                try {
                    metadata = await fetchCertificateMetadata(tokenURI);
                    if (metadata && metadata.image) {
                        imageUrl = metadata.image;
                    }
                } catch (error) {
                    console.warn('Could not fetch metadata:', error.message);
                }
            }

            return {
                tokenId: tokenId.toString(),
                isValid: true,
                status: 'VALID',
                owner: details[0],
                mintedAt: new Date(Number(details[1]) * 1000).toISOString(),
                revoked: isRevoked,
                tokenURI: details[3],
                metadata,
                imageUrl,
                verifiedAt: new Date().toISOString(),
                contractAddress: MULTISIG_CONTRACT_ADDRESS
            };

        } catch (error) {
            console.error('Error verifying certificate:', error);
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

export { MULTISIG_CONTRACT_ADDRESS, MULTISIG_CONTRACT_ABI };