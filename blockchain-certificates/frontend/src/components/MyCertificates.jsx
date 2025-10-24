import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './MyCertificates.css';

const MyCertificates = ({ contract, currentAccount, provider }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    if (contract && currentAccount) {
      loadMyCertificates();
    }
  }, [contract, currentAccount]);

  const loadMyCertificates = async () => {
    setLoading(true);
    try {
      console.log('🔍 Searching certificates for:', currentAccount);
      
      const totalMinted = await contract.getTotalMinted();
      const total = Number(totalMinted);
      
      console.log(`📊 Total certificates minted: ${total}`);
      
      if (total === 0) {
        setCertificates([]);
        setLoading(false);
        return;
      }

      const owned = [];
      
      for (let tokenId = 1; tokenId <= total; tokenId++) {
        try {
          const owner = await contract.ownerOf(tokenId);
          
          if (owner.toLowerCase() === currentAccount.toLowerCase()) {
            console.log(`✅ Found certificate #${tokenId}`);
            
            const details = await contract.getCertificateDetails(tokenId);
            const isRevoked = await contract.isRevoked(tokenId);
            
            let metadata = null;
            let imageUrl = null;
            
            if (details.uri.startsWith('ipfs://')) {
              try {
                const ipfsHash = details.uri.replace('ipfs://', '');
                const metadataUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
                
                const response = await fetch(metadataUrl, { timeout: 5000 });
                metadata = await response.json();
                imageUrl = metadata.image;
              } catch (metadataError) {
                console.warn(`Could not fetch metadata for #${tokenId}`);
              }
            }
            
            owned.push({
              tokenId: tokenId.toString(),
              owner,
              mintedAt: Number(details.mintedAt) * 1000,
              isRevoked,
              tokenURI: details.uri,
              metadata,
              imageUrl,
            });
          }
        } catch (error) {
          console.warn(`Skipping token #${tokenId}:`, error.message);
        }
      }
      
      owned.sort((a, b) => b.mintedAt - a.mintedAt);
      
      console.log(`📜 Found ${owned.length} certificates`);
      setCertificates(owned);
      
    } catch (error) {
      console.error('Error loading certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = (cert) => {
    if (!cert.imageUrl) return;
    
    const link = document.createElement('a');
    link.href = cert.imageUrl;
    link.download = `certificate-${cert.tokenId}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  if (loading) {
    return (
      <div className="my-certificates-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your certificates...</p>
        </div>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="my-certificates-container">
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <h2>No Certificates Yet</h2>
          <p>You don't have any certificates in your wallet.</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            Wallet: <code>{currentAccount.slice(0, 10)}...{currentAccount.slice(-8)}</code>
          </p>
          <button onClick={loadMyCertificates} className="btn-refresh">
            🔄 Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-certificates-container">
      <div className="certificates-header">
        <div className="header-left">
          <h1>📜 My Certificates</h1>
          <p className="subtitle">
            {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="header-right">
          <button 
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="btn-view-toggle"
          >
            {viewMode === 'grid' ? '📋 List View' : '🔲 Grid View'}
          </button>
          <button onClick={loadMyCertificates} className="btn-refresh">
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className={`certificates-${viewMode}`}>
        {certificates.map(cert => (
          <div key={cert.tokenId} className="certificate-card">
            <div className="status-badge-container">
              {cert.isRevoked ? (
                <span className="badge badge-revoked">❌ Revoked</span>
              ) : (
                <span className="badge badge-valid">✅ Valid</span>
              )}
            </div>

            <div className="token-id-badge">
              Token ID: #{cert.tokenId}
            </div>

            {cert.imageUrl ? (
              <div className="certificate-image-container">
                <img 
                  src={cert.imageUrl} 
                  alt={`Certificate #${cert.tokenId}`}
                  className="certificate-image"
                  onClick={() => setSelectedCertificate(cert)}
                />
                <div className="image-overlay">
                  <button 
                    onClick={() => setSelectedCertificate(cert)}
                    className="btn-overlay"
                  >
                    🔍 View Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="certificate-placeholder">
                <div className="placeholder-icon">📜</div>
                <p>Image not available</p>
              </div>
            )}

            <div className="certificate-info">
              <h3 className="certificate-title">
                {cert.metadata?.name || `Certificate #${cert.tokenId}`}
              </h3>
              
              <div className="info-row">
                <span className="info-label">Token ID:</span>
                <span className="info-value">#{cert.tokenId}</span>
              </div>
              
              <div className="info-row">
                <span className="info-label">Issued:</span>
                <span className="info-value">
                  {new Date(cert.mintedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              {cert.metadata?.attributes && (
                <div className="attributes-preview">
                  {cert.metadata.attributes
                    .filter(attr => attr.trait_type !== 'Status' && attr.trait_type !== 'Proposed Date')
                    .slice(0, 2)
                    .map((attr, idx) => (
                    <div key={idx} className="attribute-chip">
                      <span className="attr-label">{attr.trait_type}:</span>
                      <span className="attr-value">{attr.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="certificate-actions">
                <button 
                  onClick={() => setSelectedCertificate(cert)}
                  className="btn-action btn-primary"
                >
                  📄 View Details
                </button>
                {cert.imageUrl && (
                  <button 
                    onClick={() => downloadCertificate(cert)}
                    className="btn-action btn-secondary"
                  >
                    💾 Download
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedCertificate && (
        <div className="modal-overlay" onClick={() => setSelectedCertificate(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setSelectedCertificate(null)}
            >
              ✕
            </button>

            <h2 className="modal-title">
              Certificate #{selectedCertificate.tokenId}
            </h2>

            {selectedCertificate.imageUrl && (
              <div className="modal-image-container">
                <img 
                  src={selectedCertificate.imageUrl} 
                  alt="Certificate"
                  className="modal-image"
                />
              </div>
            )}

            <div className="modal-details">
              <div className="detail-section">
                <h3>📋 Basic Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Token ID:</span>
                    <span className="detail-value">#{selectedCertificate.tokenId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">
                      {selectedCertificate.isRevoked ? '❌ Revoked' : '✅ Valid'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Issued:</span>
                    <span className="detail-value">
                      {new Date(selectedCertificate.mintedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {selectedCertificate.metadata?.description && (
                <div className="detail-section">
                  <h3>📝 Description</h3>
                  <p className="description-text">
                    {selectedCertificate.metadata.description}
                  </p>
                </div>
              )}

              {selectedCertificate.metadata?.attributes && (
                <div className="detail-section">
                  <h3>🏷️ Attributes</h3>
                  <div className="attributes-list">
                    {selectedCertificate.metadata.attributes
                      .filter(attr => attr.trait_type !== 'Status' && attr.trait_type !== 'Proposed Date')
                      .map((attr, idx) => (
                      <div key={idx} className="attribute-item">
                        <span className="attribute-name">{attr.trait_type}</span>
                        <span className="attribute-value">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h3>🔗 Blockchain Information</h3>
                <div className="blockchain-info">
                  <div className="info-item">
                    <span className="info-label">Owner:</span>
                    <code className="info-code">{selectedCertificate.owner}</code>
                    <button 
                      onClick={() => copyToClipboard(selectedCertificate.owner, 'Owner address')}
                      className="btn-copy"
                    >
                      📋
                    </button>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Token URI:</span>
                    <code className="info-code">{selectedCertificate.tokenURI}</code>
                    <button 
                      onClick={() => copyToClipboard(selectedCertificate.tokenURI, 'Token URI')}
                      className="btn-copy"
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                {selectedCertificate.imageUrl && (
                  <>
                    <button 
                      onClick={() => downloadCertificate(selectedCertificate)}
                      className="btn-modal-action btn-download"
                    >
                      💾 Download Certificate
                    </button>
                    <button 
                      onClick={() => window.open(selectedCertificate.imageUrl, '_blank')}
                      className="btn-modal-action btn-view"
                    >
                      🔗 Open in New Tab
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCertificates;