import React, { useState } from 'react';
import ProposalCard from './ProposalCard';
import ProposalDetails from './ProposalDetails';
import { filterProposals, sortProposals } from '../../utils/proposalUtils';
import './ProposalList.css';

const ProposalList = ({
  proposals,
  approvalThreshold,
  currentAccount,
  userPermissions,
  userApprovals,
  onApprove,
  onRevokeApproval,
  onExecute,
  onCancel,
  loadingProposalId,
  getProposalApprovers,
}) => {
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedProposal, setSelectedProposal] = useState(null);

  // Filter and sort proposals
  const filteredProposals = filterProposals(proposals, filterType);
  const sortedProposals = sortProposals(filteredProposals, sortBy);
  
  // Filter by current user if "my-proposals" is selected
  const displayProposals = filterType === 'my-proposals'
    ? sortedProposals.filter(p => p.proposer.toLowerCase() === currentAccount?.toLowerCase())
    : sortedProposals;

  // Count by status
  const counts = {
    all: proposals.length,
    pending: proposals.filter(p => p.isPending).length,
    executed: proposals.filter(p => p.executed).length,
    cancelled: proposals.filter(p => p.cancelled).length,
    myProposals: proposals.filter(p => p.proposer.toLowerCase() === currentAccount?.toLowerCase()).length,
  };

  const handleProposalClick = (proposal) => {
    setSelectedProposal(proposal);
  };

  const handleCloseDetails = () => {
    setSelectedProposal(null);
  };

  return (
    <div className="proposal-list-container">
      {/* Filters and Sorting */}
      <div className="proposal-controls">
        <div className="filter-buttons">
          <button
            className={filterType === 'all' ? 'active' : ''}
            onClick={() => setFilterType('all')}
          >
            All ({counts.all})
          </button>
          <button
            className={filterType === 'pending' ? 'active' : ''}
            onClick={() => setFilterType('pending')}
          >
            Pending ({counts.pending})
          </button>
          <button
            className={filterType === 'executed' ? 'active' : ''}
            onClick={() => setFilterType('executed')}
          >
            Executed ({counts.executed})
          </button>
          <button
            className={filterType === 'cancelled' ? 'active' : ''}
            onClick={() => setFilterType('cancelled')}
          >
            Cancelled ({counts.cancelled})
          </button>
          <button
            className={filterType === 'my-proposals' ? 'active' : ''}
            onClick={() => setFilterType('my-proposals')}
          >
            My Proposals ({counts.myProposals})
          </button>
        </div>

        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="mostApprovals">Most Approvals</option>
            <option value="leastApprovals">Least Approvals</option>
          </select>
        </div>
      </div>

      {/* Threshold Info */}
      <div className="threshold-info">
        <div className="threshold-badge">
          <span className="threshold-icon">🔒</span>
          <span>Current Approval Threshold: <strong>{approvalThreshold}</strong> admins</span>
        </div>
        {userPermissions?.isSuperAdmin && (
          <p className="threshold-hint">
            You can change the threshold in the Emergency Controls section
          </p>
        )}
      </div>

      {/* Proposals List */}
      {displayProposals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No Proposals Found</h3>
          <p>
            {filterType === 'my-proposals' 
              ? "You haven't created any proposals yet."
              : `No ${filterType === 'all' ? '' : filterType} proposals at the moment.`}
          </p>
        </div>
      ) : (
        <div className="proposals-grid">
          {displayProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              currentAccount={currentAccount}
              userPermissions={userPermissions}
              hasApproved={userApprovals[proposal.id]}
              onApprove={onApprove}
              onRevokeApproval={onRevokeApproval}
              onExecute={onExecute}
              onCancel={onCancel}
              onClick={handleProposalClick}
              isLoading={loadingProposalId === proposal.id}
            />
          ))}
        </div>
      )}

      {/* Proposal Details Modal */}
      {selectedProposal && (
        <ProposalDetails
          proposal={selectedProposal}
          approvalThreshold={approvalThreshold}
          currentAccount={currentAccount}
          userPermissions={userPermissions}
          hasApproved={userApprovals[selectedProposal.id]}
          getProposalApprovers={getProposalApprovers}
          onApprove={onApprove}
          onRevokeApproval={onRevokeApproval}
          onExecute={onExecute}
          onCancel={onCancel}
          onClose={handleCloseDetails}
          isLoading={loadingProposalId === selectedProposal.id}
        />
      )}
    </div>
  );
};

export default ProposalList;
