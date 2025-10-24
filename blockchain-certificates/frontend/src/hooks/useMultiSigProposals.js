import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { formatProposal } from '../utils/proposalUtils';

/**
 * Custom hook for managing multi-signature proposals
 * @param {Object} contract - Contract instance
 * @param {String} currentAccount - Current user's address
 * @param {Object} userPermissions - User permissions object
 * @returns {Object} Proposal management functions and state
 */
export function useMultiSigProposals(contract, currentAccount, userPermissions) {
  const [proposals, setProposals] = useState([]);
  const [approvalThreshold, setApprovalThreshold] = useState(3);
  const [loading, setLoading] = useState(false);
  const [loadingProposalId, setLoadingProposalId] = useState(null);
  const [userApprovals, setUserApprovals] = useState({});

  /**
   * Load approval threshold from contract
   */
  const loadThreshold = useCallback(async () => {
    if (!contract) return;
    
    try {
      const threshold = await contract.approvalThreshold();
      setApprovalThreshold(Number(threshold));
    } catch (error) {
      console.error('Error loading threshold:', error);
    }
  }, [contract]);

  /**
   * Load all proposals from contract
   */
  const loadProposals = useCallback(async () => {
    if (!contract) return;
    
    setLoading(true);
    try {
      // Get all proposal IDs
      const proposalIds = await contract.getAllProposalIds();
      
      // Load each proposal
      const proposalPromises = proposalIds.map(async (id) => {
        try {
          const rawProposal = await contract.getProposal(id);
          return formatProposal(rawProposal, approvalThreshold);
        } catch (error) {
          console.error(`Error loading proposal ${id}:`, error);
          return null;
        }
      });
      
      const loadedProposals = await Promise.all(proposalPromises);
      const validProposals = loadedProposals.filter(p => p !== null);
      
      // Sort by newest first
      validProposals.sort((a, b) => b.createdAt - a.createdAt);
      
      setProposals(validProposals);
    } catch (error) {
      console.error('Error loading proposals:', error);
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }, [contract, approvalThreshold]);

  /**
   * Load user's approvals for all proposals
   */
  const loadUserApprovals = useCallback(async () => {
    if (!contract || !currentAccount || proposals.length === 0) return;
    
    try {
      const approvalPromises = proposals.map(async (proposal) => {
        try {
          const hasApproved = await contract.hasApproved(proposal.id, currentAccount);
          return { [proposal.id]: hasApproved };
        } catch (error) {
          console.error(`Error checking approval for proposal ${proposal.id}:`, error);
          return { [proposal.id]: false };
        }
      });
      
      const approvalResults = await Promise.all(approvalPromises);
      const approvalsMap = Object.assign({}, ...approvalResults);
      setUserApprovals(approvalsMap);
    } catch (error) {
      console.error('Error loading user approvals:', error);
    }
  }, [contract, currentAccount, proposals]);

  /**
   * Create a new proposal
   */
  const createProposal = useCallback(async (recipientAddress, recipientName, grade, metadataURI) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    if (!userPermissions?.isAdmin) {
      throw new Error('Only admins can create proposals');
    }
    
    setLoading(true);
    const loadingToast = toast.loading('Creating proposal...');
    
    try {
      // Estimate gas
      const gasEstimate = await contract.createProposal.estimateGas(
        recipientAddress,
        recipientName,
        grade,
        metadataURI
      );
      
      // Send transaction
      const tx = await contract.createProposal(
        recipientAddress,
        recipientName,
        grade,
        metadataURI,
        {
          gasLimit: Math.floor(Number(gasEstimate) * 1.2)
        }
      );
      
      toast.loading('Waiting for confirmation...', { id: loadingToast });
      
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
      
      toast.success(`Proposal #${proposalId} created successfully!`, { id: loadingToast });
      
      // Reload proposals
      await loadProposals();
      
      return {
        success: true,
        proposalId,
        transactionHash: receipt.hash,
      };
    } catch (error) {
      console.error('Error creating proposal:', error);
      
      let errorMessage = 'Failed to create proposal';
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: loadingToast });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [contract, userPermissions, loadProposals]);

  /**
   * Approve a proposal
   */
  const approveProposal = useCallback(async (proposalId) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    if (!userPermissions?.isAdmin) {
      throw new Error('Only admins can approve proposals');
    }
    
    setLoadingProposalId(proposalId);
    const loadingToast = toast.loading('Approving proposal...');
    
    try {
      const gasEstimate = await contract.approveProposal.estimateGas(proposalId);
      
      const tx = await contract.approveProposal(proposalId, {
        gasLimit: Math.floor(Number(gasEstimate) * 1.2)
      });
      
      toast.loading('Waiting for confirmation...', { id: loadingToast });
      
      const receipt = await tx.wait();
      
      // Check if proposal was auto-executed
      const executedEvent = receipt.logs.find(log => {
        try {
          const parsedLog = contract.interface.parseLog(log);
          return parsedLog.name === 'ProposalExecuted';
        } catch (e) {
          return false;
        }
      });
      
      if (executedEvent) {
        toast.success('Proposal approved and executed! Certificate minted.', { id: loadingToast });
      } else {
        toast.success('Proposal approved successfully!', { id: loadingToast });
      }
      
      // Reload proposals and approvals
      await loadProposals();
      await loadUserApprovals();
      
      return { success: true, executed: !!executedEvent };
    } catch (error) {
      console.error('Error approving proposal:', error);
      
      let errorMessage = 'Failed to approve proposal';
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message.includes('Already approved')) {
        errorMessage = 'You have already approved this proposal';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: loadingToast });
      throw error;
    } finally {
      setLoadingProposalId(null);
    }
  }, [contract, userPermissions, loadProposals, loadUserApprovals]);

  /**
   * Revoke approval for a proposal
   */
  const revokeApproval = useCallback(async (proposalId) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    setLoadingProposalId(proposalId);
    const loadingToast = toast.loading('Revoking approval...');
    
    try {
      const gasEstimate = await contract.revokeApproval.estimateGas(proposalId);
      
      const tx = await contract.revokeApproval(proposalId, {
        gasLimit: Math.floor(Number(gasEstimate) * 1.2)
      });
      
      toast.loading('Waiting for confirmation...', { id: loadingToast });
      
      await tx.wait();
      
      toast.success('Approval revoked successfully!', { id: loadingToast });
      
      // Reload proposals and approvals
      await loadProposals();
      await loadUserApprovals();
      
      return { success: true };
    } catch (error) {
      console.error('Error revoking approval:', error);
      
      let errorMessage = 'Failed to revoke approval';
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: loadingToast });
      throw error;
    } finally {
      setLoadingProposalId(null);
    }
  }, [contract, loadProposals, loadUserApprovals]);

  /**
   * Execute a proposal manually
   */
  const executeProposal = useCallback(async (proposalId) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    if (!userPermissions?.isAdmin) {
      throw new Error('Only admins can execute proposals');
    }
    
    setLoadingProposalId(proposalId);
    const loadingToast = toast.loading('Executing proposal...');
    
    try {
      const gasEstimate = await contract.executeProposal.estimateGas(proposalId);
      
      const tx = await contract.executeProposal(proposalId, {
        gasLimit: Math.floor(Number(gasEstimate) * 1.2)
      });
      
      toast.loading('Waiting for confirmation...', { id: loadingToast });
      
      await tx.wait();
      
      toast.success('Proposal executed! Certificate minted.', { id: loadingToast });
      
      // Reload proposals
      await loadProposals();
      
      return { success: true };
    } catch (error) {
      console.error('Error executing proposal:', error);
      
      let errorMessage = 'Failed to execute proposal';
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message.includes('Insufficient approvals')) {
        errorMessage = 'Insufficient approvals to execute';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: loadingToast });
      throw error;
    } finally {
      setLoadingProposalId(null);
    }
  }, [contract, userPermissions, loadProposals]);

  /**
   * Cancel a proposal (SUPER_ADMIN only)
   */
  const cancelProposal = useCallback(async (proposalId) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    if (!userPermissions?.isSuperAdmin) {
      throw new Error('Only super admins can cancel proposals');
    }
    
    setLoadingProposalId(proposalId);
    const loadingToast = toast.loading('Cancelling proposal...');
    
    try {
      const gasEstimate = await contract.cancelProposal.estimateGas(proposalId);
      
      const tx = await contract.cancelProposal(proposalId, {
        gasLimit: Math.floor(Number(gasEstimate) * 1.2)
      });
      
      toast.loading('Waiting for confirmation...', { id: loadingToast });
      
      await tx.wait();
      
      toast.success('Proposal cancelled successfully!', { id: loadingToast });
      
      // Reload proposals
      await loadProposals();
      
      return { success: true };
    } catch (error) {
      console.error('Error cancelling proposal:', error);
      
      let errorMessage = 'Failed to cancel proposal';
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: loadingToast });
      throw error;
    } finally {
      setLoadingProposalId(null);
    }
  }, [contract, userPermissions, loadProposals]);

  /**
   * Change approval threshold (SUPER_ADMIN only)
   */
  const changeThreshold = useCallback(async (newThreshold) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    if (!userPermissions?.isSuperAdmin) {
      throw new Error('Only super admins can change threshold');
    }
    
    setLoading(true);
    const loadingToast = toast.loading('Updating threshold...');
    
    try {
      const gasEstimate = await contract.setApprovalThreshold.estimateGas(newThreshold);
      
      const tx = await contract.setApprovalThreshold(newThreshold, {
        gasLimit: Math.floor(Number(gasEstimate) * 1.2)
      });
      
      toast.loading('Waiting for confirmation...', { id: loadingToast });
      
      await tx.wait();
      
      toast.success(`Approval threshold updated to ${newThreshold}!`, { id: loadingToast });
      
      // Reload threshold and proposals
      await loadThreshold();
      await loadProposals();
      
      return { success: true };
    } catch (error) {
      console.error('Error changing threshold:', error);
      
      let errorMessage = 'Failed to update threshold';
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: loadingToast });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [contract, userPermissions, loadThreshold, loadProposals]);

  /**
   * Get proposal approvers
   */
  const getProposalApprovers = useCallback(async (proposalId) => {
    if (!contract) return [];
    
    try {
      const approvers = await contract.getProposalApprovers(proposalId);
      return approvers;
    } catch (error) {
      console.error(`Error getting approvers for proposal ${proposalId}:`, error);
      return [];
    }
  }, [contract]);

  /**
   * Setup event listeners for real-time updates
   */
  useEffect(() => {
    if (!contract) return;
    
    // Listen for ProposalCreated
    const onProposalCreated = (proposalId, proposer, recipient, metadataURI) => {
      console.log('ProposalCreated event:', { proposalId: Number(proposalId) });
      loadProposals();
    };
    
    // Listen for ProposalApproved
    const onProposalApproved = (proposalId, approver, approvalCount) => {
      console.log('ProposalApproved event:', { proposalId: Number(proposalId) });
      loadProposals();
      loadUserApprovals();
    };
    
    // Listen for ProposalExecuted
    const onProposalExecuted = (proposalId, tokenId, recipient) => {
      console.log('ProposalExecuted event:', { proposalId: Number(proposalId), tokenId: Number(tokenId) });
      loadProposals();
    };
    
    // Listen for ProposalCancelled
    const onProposalCancelled = (proposalId, canceller) => {
      console.log('ProposalCancelled event:', { proposalId: Number(proposalId) });
      loadProposals();
    };
    
    // Listen for ThresholdChanged
    const onThresholdChanged = (oldThreshold, newThreshold, changedBy) => {
      console.log('ThresholdChanged event:', { oldThreshold: Number(oldThreshold), newThreshold: Number(newThreshold) });
      loadThreshold();
      loadProposals();
    };
    
    contract.on('ProposalCreated', onProposalCreated);
    contract.on('ProposalApproved', onProposalApproved);
    contract.on('ProposalExecuted', onProposalExecuted);
    contract.on('ProposalCancelled', onProposalCancelled);
    contract.on('ThresholdChanged', onThresholdChanged);
    
    // Cleanup
    return () => {
      contract.off('ProposalCreated', onProposalCreated);
      contract.off('ProposalApproved', onProposalApproved);
      contract.off('ProposalExecuted', onProposalExecuted);
      contract.off('ProposalCancelled', onProposalCancelled);
      contract.off('ThresholdChanged', onThresholdChanged);
    };
  }, [contract, loadProposals, loadUserApprovals, loadThreshold]);

  // Initial load
  useEffect(() => {
    loadThreshold();
  }, [loadThreshold]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  useEffect(() => {
    loadUserApprovals();
  }, [loadUserApprovals]);

  return {
    proposals,
    approvalThreshold,
    loading,
    loadingProposalId,
    userApprovals,
    createProposal,
    approveProposal,
    revokeApproval,
    executeProposal,
    cancelProposal,
    changeThreshold,
    getProposalApprovers,
    refreshProposals: loadProposals,
  };
}

export default useMultiSigProposals;
