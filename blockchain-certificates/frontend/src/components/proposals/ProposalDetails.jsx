import React, { useState, useEffect } from 'react';
import {
  shortenAddress,
  formatDate,
  getRelativeTime,
  canApproveProposal,
  canRevokeApproval,
  canExecuteProposal,
  canCancelProposal,
  getIPFSUrl,
} from '../../utils/proposalUtils';
import './ProposalDetails.css';

const ProposalDetails = ({
  proposal,
  approvalThreshold,
  currentAccount,
  userPermissions,
  hasApproved,
  getProposalApprovers,
  onApprove,
  onRevokeApproval,
  onExecute,
  onCancel,
  onClose,
  isLoading,
}) => {
  const [approvers, setApprovers] = useState([]);
  const [loadingApprovers, setLoadingApprovers] = useState(true);
  const [metadata, setMetadata] = useState(null);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // Load approvers
  useEffect(() => {
    const loadApprovers = async () => {
      setLoadingApprovers(true);
      try {
        const approversList = await getProposalApprovers(proposal.id);
        setApprovers(approversList);
      } catch (error) {
        console.error('Error loading approvers:', error);
      } finally {
        setLoadingApprovers(false);
      }
    };

    loadApprovers();
  }, [proposal.id, getProposalApprovers]);

  // Load metadata from IPFS
  useEffect(() => {
    const loadMetadata = async () => {
      setLoadingMetadata(true);
      try {
        const metadataUrl = getIPFSUrl(proposal.metadataURI);
        const response = await fetch(metadataUrl);
        const data = await response.json();
        setMetadata(data);
      } catch (error) {
        console.error('Error loading metadata:', error);
      } finally {
        setLoadingMetadata(false);
      }
    };

    if (proposal.metadataURI) {
      loadMetadata();
    }
  }, [proposal.metadataURI]);

  const canApprove = canApproveProposal(proposal, currentAccount, hasApproved, userPermissions?.isAdmin);
  const canRevoke = canRevokeApproval(proposal, hasApproved);
  const canExecute = canExecuteProposal(proposal, userPermissions?.isAdmin);
  const canCancel = canCancelProposal(proposal, userPermissions?.isSuperAdmin);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="proposal-details-backdrop" onClick={handleBackdropClick}>
      <div className="proposal-details-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="header-left">
            <h2>Proposal #{proposal.id}</h2>
            <span 
              className="status-badge"
              style={{ backgroundColor: proposal.statusColor }}
            >
              {proposal.statusText}
            </span>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Certificate Info Section */}
          <section className="details-section">
            <h3>📜 Certificate Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Recipient Name:</label>
                <span>{proposal.recipientName}</span>
              </div>
              <div className="info-item">
                <label>Recipient Address:</label>
                <span className="mono-text">{proposal.recipient}</span>
              </div>
              <div className="info-item">
                <label>Grade:</label>
                <span className="grade-badge">{proposal.grade}</span>
              </div>
              <div className="info-item">
                <label>Proposed By:</label>
                <span className="mono-text">{proposal.proposer}</span>
              </div>
              <div className="info-item">
                <label>Created:</label>
                <span>{formatDate(proposal.createdAt)}</span>
              </div>
              <div className="info-item">
                <label>Created:</label>
                <span className="relative-time">{getRelativeTime(proposal.createdAt)}</span>
              </div>
            </div>
          </section>

          {/* Certificate Preview */}
          {metadata && metadata.image && (
            <section className="details-section">
              <h3>🖼️ Certificate Preview</h3>
              <div className="certificate-preview">
                <img 
                  src={getIPFSUrl(metadata.image)} 
                  alt="Certificate Preview"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'block';
                  }}
                />
                <div className="image-load-error" style={{ display: 'none' }}>
                  Failed to load certificate image from IPFS
                </div>
              </div>
              {metadata.description && (
                <p className="certificate-description">{metadata.description}</p>
              )}
            </section>
          )}

          {/* Approval Progress */}
          <section className="details-section">
            <h3>✅ Approval Progress</h3>
            <div className="approval-stats">
              <div className="stat-box">
                <div className="stat-value">{proposal.approvalCount}</div>
                <div className="stat-label">Approvals</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{approvalThreshold}</div>
                <div className="stat-label">Required</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{Math.max(0, approvalThreshold - proposal.approvalCount)}</div>
                <div className="stat-label">Remaining</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{proposal.progress}%</div>
                <div className="stat-label">Progress</div>
              </div>
            </div>

            <div className="progress-bar-large">
              <div 
                className="progress-fill-large"
                style={{ 
                  width: `${proposal.progress}%`,
                  backgroundColor: proposal.statusColor
                }}
              />
            </div>
          </section>

          {/* Approvers List */}
          <section className="details-section">
            <h3>👥 Approvers ({approvers.length})</h3>
            {loadingApprovers ? (
              <div className="loading-text">Loading approvers...</div>
            ) : approvers.length === 0 ? (
              <div className="empty-message">No approvals yet</div>
            ) : (
              <div className="approvers-list">
                {approvers.map((approver, index) => (
                  <div key={index} className="approver-item">
                    <span className="approver-number">#{index + 1}</span>
                    <span className="approver-address mono-text">
                      {approver}
                    </span>
                    {approver.toLowerCase() === currentAccount?.toLowerCase() && (
                      <span className="you-badge">YOU</span>
                    )}
                    <span className="checkmark">✓</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Metadata Link */}
          {proposal.metadataURI && (
            <section className="details-section">
              <h3>🔗 IPFS Metadata</h3>
              <a 
                href={getIPFSUrl(proposal.metadataURI)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ipfs-link"
              >
                View on IPFS →
              </a>
            </section>
          )}

          {/* User Status */}
          {hasApproved && (
            <div className="user-status-banner approved">
              ✅ You have approved this proposal
            </div>
          )}
        </div>

        {/* Actions */}
        {proposal.isPending && (
          <div className="modal-actions">
            {canApprove && (
              <button
                className="action-btn approve-btn"
                onClick={() => onApprove(proposal.id)}
                disabled={isLoading}
              >
                ✓ Approve Proposal
              </button>
            )}
            
            {canRevoke && (
              <button
                className="action-btn revoke-btn"
                onClick={() => onRevokeApproval(proposal.id)}
                disabled={isLoading}
              >
                ✗ Revoke My Approval
              </button>
            )}
            
            {canExecute && (
              <button
                className="action-btn execute-btn"
                onClick={() => onExecute(proposal.id)}
                disabled={isLoading}
              >
                🚀 Execute & Mint Certificate
              </button>
            )}
            
            {canCancel && (
              <button
                className="action-btn cancel-btn"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to cancel proposal #${proposal.id}?`)) {
                    onCancel(proposal.id);
                  }
                }}
                disabled={isLoading}
              >
                🗑️ Cancel Proposal
              </button>
            )}
          </div>
        )}

        {proposal.executed && (
          <div className="modal-footer-status executed">
            ✅ This proposal has been executed and the certificate has been minted
          </div>
        )}

        {proposal.cancelled && (
          <div className="modal-footer-status cancelled">
            ❌ This proposal has been cancelled
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalDetails;
