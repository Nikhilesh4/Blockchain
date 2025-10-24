import React, { useState } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { generateCertificateImage } from '../../utils/certificateGenerator';
import { uploadImageToIPFS, uploadMetadataToIPFS } from '../../utils/ipfsUpload';
import { validateProposalData } from '../../utils/proposalUtils';
import './CreateProposal.css';

const CreateProposal = ({ contract, currentAccount, onProposalCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientAddress: '',
    grade: '',
    issuer: 'Blockchain University',
    description: '',
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [uploadProgress, setUploadProgress] = useState({ image: 0, metadata: 0 });
  const [generatedPreview, setGeneratedPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateAndPropose = async (e) => {
    e.preventDefault();
    
    // Validate form data
    const validation = validateProposalData({
      recipientAddress: formData.recipientAddress,
      recipientName: formData.recipientName,
      grade: formData.grade,
      metadataURI: 'temp', // Will be generated
    });
    
    if (!validation.valid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }
    
    setIsGenerating(true);
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
        name: formData.recipientName,
        grade: formData.grade,
        recipientAddress: formData.recipientAddress,
        issuedDate,
        issuer: formData.issuer,
        issuerAddress: currentAccount,
        tokenId: 'PENDING' // Proposal doesn't have token ID yet
      });
      
      setProgress('Uploading certificate to IPFS...');
      
      // Step 2: Upload image to IPFS
      const filename = `proposal-cert-${formData.recipientName.replace(/\s+/g, '-')}-${Date.now()}.png`;
      const imageResult = await uploadImageToIPFS(imageBlob, filename, (percent) => {
        setUploadProgress(prev => ({ ...prev, image: percent }));
      });
      
      console.log('✅ Certificate image uploaded:', imageResult.imageUrl);
      setGeneratedPreview(imageResult.imageUrl);
      
      // Step 3: Create metadata
      setProgress('Creating metadata...');
      const metadata = {
        name: `Certificate - ${formData.recipientName}`,
        description: formData.description || `Certificate for ${formData.recipientName} with grade ${formData.grade}`,
        image: imageResult.imageUrl,
        issuer: formData.issuer,
        issuerAddress: currentAccount,
        recipientAddress: formData.recipientAddress,
        status: 'PENDING_APPROVAL',
        attributes: [
          { trait_type: 'Recipient Name', value: formData.recipientName },
          { trait_type: 'Recipient Address', value: formData.recipientAddress },
          { trait_type: 'Issuer Name', value: formData.issuer },
          { trait_type: 'Issuer Address', value: currentAccount },
          { trait_type: 'Grade', value: formData.grade },
          { trait_type: 'Proposed Date', value: new Date().toISOString() },
          { trait_type: 'Status', value: 'Pending Multi-Sig Approval' }
        ]
      };
      
      // Step 4: Upload metadata to IPFS
      setProgress('Uploading metadata to IPFS...');
      const metadataResult = await uploadMetadataToIPFS(
        metadata,
        `${formData.recipientName}-metadata`,
        (percent) => {
          setUploadProgress(prev => ({ ...prev, metadata: percent }));
        }
      );
      
      console.log('✅ Metadata uploaded:', metadataResult.metadataUri);
      
      // Step 5: Create proposal on blockchain
      setProgress('Creating proposal on blockchain...');
      
      const gasEstimate = await contract.createProposal.estimateGas(
        formData.recipientAddress,
        formData.recipientName,
        formData.grade,
        metadataResult.metadataUri
      );
      
      const tx = await contract.createProposal(
        formData.recipientAddress,
        formData.recipientName,
        formData.grade,
        metadataResult.metadataUri,
        {
          gasLimit: Math.floor(Number(gasEstimate) * 1.2)
        }
      );
      
      setProgress('Waiting for transaction confirmation...');
      const receipt = await tx.wait();
      
      // Extract proposal ID from event
      const event = receipt.logs.find(log => {
        try {
          const parsedLog = contract.interface.parseLog(log);
          return parsedLog.name === 'ProposalCreated';
        } catch (e) {
          return false;
        }
      });
      
      let proposalId = null;
      if (event) {
        const parsedLog = contract.interface.parseLog(event);
        proposalId = Number(parsedLog.args.proposalId);
      }
      
      toast.success(`Proposal #${proposalId} created successfully! 🎉`);
      
      // Reset form
      setFormData({
        recipientName: '',
        recipientAddress: '',
        grade: '',
        issuer: 'Blockchain University',
        description: '',
      });
      setGeneratedPreview(null);
      
      // Notify parent
      if (onProposalCreated) {
        onProposalCreated(proposalId);
      }
      
    } catch (error) {
      console.error('Error creating proposal:', error);
      
      let errorMessage = 'Failed to create proposal';
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
      setProgress('');
      setUploadProgress({ image: 0, metadata: 0 });
    }
  };

  return (
    <div className="create-proposal-container">
      <div className="create-proposal-header">
        <h2>📝 Create Certificate Proposal</h2>
        <p className="subtitle">
          Create a proposal for certificate issuance. Other admins must approve before the certificate is minted.
        </p>
      </div>
      
      <form onSubmit={handleGenerateAndPropose} className="create-proposal-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="recipientName">Recipient Name *</label>
            <input
              type="text"
              id="recipientName"
              name="recipientName"
              value={formData.recipientName}
              onChange={handleChange}
              placeholder="John Doe"
              required
              disabled={isGenerating}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="recipientAddress">Recipient Address *</label>
            <input
              type="text"
              id="recipientAddress"
              name="recipientAddress"
              value={formData.recipientAddress}
              onChange={handleChange}
              placeholder="0x..."
              required
              disabled={isGenerating}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="grade">Grade *</label>
            <select
              id="grade"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              required
              disabled={isGenerating}
            >
              <option value="">Select Grade</option>
              <option value="A+">A+</option>
              <option value="A">A</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B">B</option>
              <option value="B-">B-</option>
              <option value="C+">C+</option>
              <option value="C">C</option>
              <option value="Pass">Pass</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="issuer">Issuer</label>
            <input
              type="text"
              id="issuer"
              name="issuer"
              value={formData.issuer}
              onChange={handleChange}
              placeholder="Blockchain University"
              disabled={isGenerating}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description (optional)</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Certificate description..."
            rows="3"
            disabled={isGenerating}
          />
        </div>
        
        {/* Progress Indicator */}
        {isGenerating && (
          <div className="progress-container">
            <p className="progress-text">{progress}</p>
            
            {uploadProgress.image > 0 && (
              <div className="progress-bar-wrapper">
                <div className="progress-label">
                  <span>Image Upload:</span>
                  <span>{uploadProgress.image}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-bar-fill"
                    style={{ width: `${uploadProgress.image}%` }}
                  />
                </div>
              </div>
            )}
            
            {uploadProgress.metadata > 0 && (
              <div className="progress-bar-wrapper">
                <div className="progress-label">
                  <span>Metadata Upload:</span>
                  <span>{uploadProgress.metadata}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-bar-fill metadata"
                    style={{ width: `${uploadProgress.metadata}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Preview */}
        {generatedPreview && (
          <div className="preview-container">
            <h3>Certificate Preview</h3>
            <img src={generatedPreview} alt="Certificate Preview" className="preview-image" />
          </div>
        )}
        
        {/* Info Banner */}
        <div className="info-banner">
          <strong>ℹ️ How it works:</strong>
          <ol>
            <li>Certificate image is generated and uploaded to IPFS</li>
            <li>Metadata is created and uploaded to IPFS</li>
            <li>Proposal is submitted to the blockchain</li>
            <li>Other admins review and approve the proposal</li>
            <li>Once threshold is reached, the certificate is automatically minted</li>
          </ol>
        </div>
        
        {/* Actions */}
        <div className="form-actions">
          {onCancel && (
            <button 
              type="button" 
              className="btn-secondary"
              onClick={onCancel}
              disabled={isGenerating}
            >
              Cancel
            </button>
          )}
          <button 
            type="submit" 
            className="btn-primary"
            disabled={isGenerating}
          >
            {isGenerating ? progress || 'Processing...' : '🎨 Generate & Create Proposal'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProposal;
