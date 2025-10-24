import { ethers } from 'ethers';

/**
 * Proposal Status Constants
 */
export const PROPOSAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  EXECUTED: 'EXECUTED',
  CANCELLED: 'CANCELLED',
  INSUFFICIENT_APPROVALS: 'INSUFFICIENT_APPROVALS'
};

/**
 * Get the status of a proposal
 * @param {Object} proposal - Proposal object
 * @param {Number} threshold - Approval threshold
 * @returns {String} Status string
 */
export function getProposalStatus(proposal, threshold) {
  if (proposal.cancelled) {
    return PROPOSAL_STATUS.CANCELLED;
  }
  if (proposal.executed) {
    return PROPOSAL_STATUS.EXECUTED;
  }
  if (proposal.approvalCount >= threshold) {
    return PROPOSAL_STATUS.APPROVED;
  }
  if (proposal.approvalCount > 0 && proposal.approvalCount < threshold) {
    return PROPOSAL_STATUS.INSUFFICIENT_APPROVALS;
  }
  return PROPOSAL_STATUS.PENDING;
}

/**
 * Get status display color
 * @param {String} status - Proposal status
 * @returns {String} Color code
 */
export function getStatusColor(status) {
  const colors = {
    [PROPOSAL_STATUS.PENDING]: '#fbbf24', // yellow
    [PROPOSAL_STATUS.INSUFFICIENT_APPROVALS]: '#fb923c', // orange
    [PROPOSAL_STATUS.APPROVED]: '#22c55e', // green
    [PROPOSAL_STATUS.EXECUTED]: '#3b82f6', // blue
    [PROPOSAL_STATUS.CANCELLED]: '#ef4444', // red
  };
  return colors[status] || '#6b7280'; // gray fallback
}

/**
 * Get status display text
 * @param {String} status - Proposal status
 * @returns {String} Display text
 */
export function getStatusText(status) {
  const texts = {
    [PROPOSAL_STATUS.PENDING]: 'Pending Approval',
    [PROPOSAL_STATUS.INSUFFICIENT_APPROVALS]: 'In Progress',
    [PROPOSAL_STATUS.APPROVED]: 'Approved - Ready to Execute',
    [PROPOSAL_STATUS.EXECUTED]: 'Executed',
    [PROPOSAL_STATUS.CANCELLED]: 'Cancelled',
  };
  return texts[status] || 'Unknown';
}

/**
 * Get progress percentage for a proposal
 * @param {Number} approvalCount - Current approval count
 * @param {Number} threshold - Required approvals
 * @returns {Number} Percentage (0-100)
 */
export function getApprovalProgress(approvalCount, threshold) {
  if (threshold === 0) return 0;
  return Math.min(Math.round((approvalCount / threshold) * 100), 100);
}

/**
 * Format proposal for display
 * @param {Object} rawProposal - Raw proposal from contract
 * @param {Number} threshold - Approval threshold
 * @returns {Object} Formatted proposal
 */
export function formatProposal(rawProposal, threshold) {
  const approvalCount = Number(rawProposal.approvalCount);
  const proposalId = Number(rawProposal.id);
  const createdAt = Number(rawProposal.createdAt) * 1000; // Convert to milliseconds
  
  const status = getProposalStatus(
    {
      ...rawProposal,
      approvalCount,
    },
    threshold
  );
  
  return {
    id: proposalId,
    proposer: rawProposal.proposer,
    recipient: rawProposal.recipient,
    recipientName: rawProposal.recipientName,
    grade: rawProposal.grade,
    metadataURI: rawProposal.metadataURI,
    approvalCount,
    threshold,
    createdAt,
    executed: rawProposal.executed,
    cancelled: rawProposal.cancelled,
    status,
    statusColor: getStatusColor(status),
    statusText: getStatusText(status),
    progress: getApprovalProgress(approvalCount, threshold),
    canExecute: approvalCount >= threshold && !rawProposal.executed && !rawProposal.cancelled,
    isPending: !rawProposal.executed && !rawProposal.cancelled,
  };
}

/**
 * Validate proposal creation data
 * @param {Object} data - Proposal data
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateProposalData(data) {
  const errors = [];
  
  if (!data.recipientAddress || !ethers.isAddress(data.recipientAddress)) {
    errors.push('Invalid recipient address');
  }
  
  if (!data.recipientName || data.recipientName.trim().length === 0) {
    errors.push('Recipient name is required');
  }
  
  if (!data.grade || data.grade.trim().length === 0) {
    errors.push('Grade is required');
  }
  
  if (!data.metadataURI || data.metadataURI.trim().length === 0) {
    errors.push('Metadata URI is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Filter proposals by status
 * @param {Array} proposals - Array of proposals
 * @param {String} filterType - 'all', 'pending', 'executed', 'cancelled'
 * @returns {Array} Filtered proposals
 */
export function filterProposals(proposals, filterType) {
  if (filterType === 'all') return proposals;
  
  switch (filterType) {
    case 'pending':
      return proposals.filter(p => p.isPending);
    case 'executed':
      return proposals.filter(p => p.executed);
    case 'cancelled':
      return proposals.filter(p => p.cancelled);
    case 'my-proposals':
      // This requires currentAccount to be passed
      return proposals;
    default:
      return proposals;
  }
}

/**
 * Sort proposals by different criteria
 * @param {Array} proposals - Array of proposals
 * @param {String} sortBy - 'newest', 'oldest', 'mostApprovals', 'leastApprovals'
 * @returns {Array} Sorted proposals
 */
export function sortProposals(proposals, sortBy = 'newest') {
  const sorted = [...proposals];
  
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case 'oldest':
      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case 'mostApprovals':
      return sorted.sort((a, b) => b.approvalCount - a.approvalCount);
    case 'leastApprovals':
      return sorted.sort((a, b) => a.approvalCount - b.approvalCount);
    default:
      return sorted;
  }
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {Number} timestamp - Timestamp in milliseconds
 * @returns {String} Relative time string
 */
export function getRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

/**
 * Format date for display
 * @param {Number} timestamp - Timestamp in milliseconds
 * @returns {String} Formatted date string
 */
export function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Shorten address for display
 * @param {String} address - Ethereum address
 * @param {Number} startChars - Number of characters to show at start (default: 6)
 * @param {Number} endChars - Number of characters to show at end (default: 4)
 * @returns {String} Shortened address
 */
export function shortenAddress(address, startChars = 6, endChars = 4) {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Check if user can approve a proposal
 * @param {Object} proposal - Proposal object
 * @param {String} userAddress - Current user's address
 * @param {Boolean} hasApproved - Whether user has already approved
 * @param {Boolean} isAdmin - Whether user has admin role
 * @returns {Boolean} Can approve
 */
export function canApproveProposal(proposal, userAddress, hasApproved, isAdmin) {
  if (!isAdmin) return false;
  if (hasApproved) return false;
  if (proposal.executed || proposal.cancelled) return false;
  
  // Check if user is the proposer - proposers cannot approve their own proposals
  if (proposal.proposer && userAddress && 
      proposal.proposer.toLowerCase() === userAddress.toLowerCase()) {
    return false;
  }
  
  return true;
}

/**
 * Check if user can revoke their approval
 * @param {Object} proposal - Proposal object
 * @param {Boolean} hasApproved - Whether user has approved
 * @returns {Boolean} Can revoke
 */
export function canRevokeApproval(proposal, hasApproved) {
  if (!hasApproved) return false;
  if (proposal.executed || proposal.cancelled) return false;
  return true;
}

/**
 * Check if user can execute a proposal
 * @param {Object} proposal - Proposal object
 * @param {Boolean} isAdmin - Whether user has admin role
 * @returns {Boolean} Can execute
 */
export function canExecuteProposal(proposal, isAdmin) {
  if (!isAdmin) return false;
  return proposal.canExecute;
}

/**
 * Check if user can cancel a proposal
 * @param {Object} proposal - Proposal object
 * @param {Boolean} isSuperAdmin - Whether user has super admin role
 * @returns {Boolean} Can cancel
 */
export function canCancelProposal(proposal, isSuperAdmin) {
  if (!isSuperAdmin) return false;
  if (proposal.executed) return false;
  if (proposal.cancelled) return false;
  return true;
}

/**
 * Get IPFS gateway URL from URI
 * @param {String} uri - IPFS URI (ipfs://...)
 * @returns {String} Gateway URL
 */
export function getIPFSUrl(uri) {
  if (!uri) return '';
  if (uri.startsWith('ipfs://')) {
    const hash = uri.replace('ipfs://', '');
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }
  return uri;
}

/**
 * Calculate estimated completion time based on current approval rate
 * @param {Object} proposal - Proposal object
 * @param {Number} avgApprovalTime - Average time between approvals in milliseconds
 * @returns {String} Estimated completion message
 */
export function getEstimatedCompletion(proposal, avgApprovalTime = 3600000) {
  if (proposal.executed || proposal.cancelled) return null;
  
  const remainingApprovals = proposal.threshold - proposal.approvalCount;
  if (remainingApprovals <= 0) return 'Ready to execute!';
  
  const estimatedMs = remainingApprovals * avgApprovalTime;
  const hours = Math.ceil(estimatedMs / 3600000);
  
  if (hours < 1) return 'Less than an hour';
  if (hours === 1) return 'About 1 hour';
  if (hours < 24) return `About ${hours} hours`;
  
  const days = Math.ceil(hours / 24);
  return `About ${days} day${days > 1 ? 's' : ''}`;
}

export default {
  PROPOSAL_STATUS,
  getProposalStatus,
  getStatusColor,
  getStatusText,
  getApprovalProgress,
  formatProposal,
  validateProposalData,
  filterProposals,
  sortProposals,
  getRelativeTime,
  formatDate,
  shortenAddress,
  canApproveProposal,
  canRevokeApproval,
  canExecuteProposal,
  canCancelProposal,
  getIPFSUrl,
  getEstimatedCompletion,
};
