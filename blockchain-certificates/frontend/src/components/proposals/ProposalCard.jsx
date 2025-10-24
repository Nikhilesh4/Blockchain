import React from 'react';
import {
  shortenAddress,
  formatDate,
  getRelativeTime,
  canApproveProposal,
  canRevokeApproval,
  canExecuteProposal,
  canCancelProposal,
} from '../../utils/proposalUtils';
import './ProposalCard.css';

const ProposalCard = ({
  proposal,
  currentAccount,
  userPermissions,
  hasApproved,
  onApprove,
  onRevokeApproval,
  onExecute,
  onCancel,
  onClick,
  isLoading,
}) => {
  const canApprove = canApproveProposal(proposal, currentAccount, hasApproved, userPermissions?.isAdmin);
  const canRevoke = canRevokeApproval(proposal, hasApproved);
  const canExecute = canExecuteProposal(proposal, userPermissions?.isAdmin);
  const canCancel = canCancelProposal(proposal, userPermissions?.isSuperAdmin);

  const handleApprove = (e) => {
    e.stopPropagation();
    onApprove(proposal.id);
  };

  const handleRevokeApproval = (e) => {
    e.stopPropagation();
    onRevokeApproval(proposal.id);
  };

  const handleExecute = (e) => {
    e.stopPropagation();
    onExecute(proposal.id);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to cancel proposal #${proposal.id}?`)) {
      onCancel(proposal.id);
    }
  };

  return (
    <div 
      className={`proposal-card ${proposal.status.toLowerCase()}`}
      onClick={() => onClick && onClick(proposal)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Header */}
      <div className="proposal-card-header">
        <div className="proposal-id-section">
          <span className="proposal-id">Proposal #{proposal.id}</span>
          <span 
            className="proposal-status-badge"
            style={{ backgroundColor: proposal.statusColor }}
          >
            {proposal.statusText}
          </span>
        </div>
        <div className="proposal-time">
          <span title={formatDate(proposal.createdAt)}>
            {getRelativeTime(proposal.createdAt)}
          </span>
        </div>
      </div>

      {/* Certificate Info */}
      <div className="proposal-cert-info">
        <div className="cert-info-row">
          <strong>Recipient:</strong>
          <span>{proposal.recipientName}</span>
        </div>
        <div className="cert-info-row">
          <strong>Address:</strong>
          <span className="address-text" title={proposal.recipient}>
            {shortenAddress(proposal.recipient)}
          </span>
        </div>
        <div className="cert-info-row">
          <strong>Grade:</strong>
          <span className="grade-badge">{proposal.grade}</span>
        </div>
        <div className="cert-info-row">
          <strong>Proposer:</strong>
          <span className="address-text" title={proposal.proposer}>
            {shortenAddress(proposal.proposer)}
          </span>
        </div>
      </div>

      {/* Approval Progress */}
      <div className="approval-progress-section">
        <div className="progress-header">
          <span>Approvals</span>
          <span className="progress-count">
            {proposal.approvalCount} / {proposal.threshold}
          </span>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ 
              width: `${proposal.progress}%`,
              backgroundColor: proposal.statusColor
            }}
          />
        </div>
        {hasApproved && (
          <div className="user-approved-indicator">
            ✓ You have approved this proposal
          </div>
        )}
      </div>

      {/* Actions */}
      {proposal.isPending && (
        <div className="proposal-actions">
          {canApprove && (
            <button
              className="btn-approve"
              onClick={handleApprove}
              disabled={isLoading}
            >
              ✓ Approve
            </button>
          )}
          
          {canRevoke && (
            <button
              className="btn-revoke"
              onClick={handleRevokeApproval}
              disabled={isLoading}
            >
              ✗ Revoke Approval
            </button>
          )}
          
          {canExecute && (
            <button
              className="btn-execute"
              onClick={handleExecute}
              disabled={isLoading}
            >
              🚀 Execute Now
            </button>
          )}
          
          {canCancel && (
            <button
              className="btn-cancel"
              onClick={handleCancel}
              disabled={isLoading}
            >
              🗑️ Cancel
            </button>
          )}
          
          {!canApprove && !canRevoke && !canExecute && !canCancel && (
            <div className="no-actions-message">
              {userPermissions?.isAdmin 
                ? 'Waiting for other admins to approve' 
                : 'Only admins can approve proposals'}
            </div>
          )}
        </div>
      )}

      {proposal.executed && (
        <div className="proposal-executed-badge">
          ✅ Certificate Minted
        </div>
      )}

      {proposal.cancelled && (
        <div className="proposal-cancelled-badge">
          ❌ Cancelled
        </div>
      )}
    </div>
  );
};

export default ProposalCard;
