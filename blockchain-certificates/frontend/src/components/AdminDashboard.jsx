import React, { useState, useEffect } from 'react';
import {
  ROLES,
  ROLE_NAMES,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
  getUserPermissions,
  getUserRoles,
  grantRole,
  revokeRole,
  emergencyRevokeRole,
  getAvailableRoles,
  canManageRole,
  formatRoles,
  isValidAddress,
  listenForRoleRequests,
  pauseContract,
  unpauseContract,
} from '../utils/roleManagement';
import './AdminDashboard.css';

const AdminDashboard = ({ contract, currentAccount }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [userPermissions, setUserPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleRequests, setRoleRequests] = useState([]);
  const [userList, setUserList] = useState([]);
  const [newUserAddress, setNewUserAddress] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [justification, setJustification] = useState('');
  const [emergencyReason, setEmergencyReason] = useState('');
  const [notification, setNotification] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (contract && currentAccount) {
      loadUserPermissions();
      loadUserList();
      setupEventListeners();
    }
  }, [contract, currentAccount]);

  const loadUserPermissions = async () => {
    try {
      setLoading(true);
      const permissions = await getUserPermissions(contract, currentAccount);
      setUserPermissions(permissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
      showNotification('Error loading permissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUserList = async () => {
    // In a real implementation, you'd maintain a list of users off-chain
    // For now, we'll use a placeholder
    const savedUsers = JSON.parse(localStorage.getItem('certificateUsers') || '[]');
    setUserList(savedUsers);
  };

  const setupEventListeners = () => {
    // Listen for role requests
    const cleanup = listenForRoleRequests(contract, (request) => {
      setRoleRequests(prev => [request, ...prev]);
      showNotification(`New role request from ${request.requester.slice(0, 10)}...`, 'info');
    });

    return cleanup;
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleGrantRole = async (address, role) => {
    try {
      setLoading(true);
      const result = await grantRole(contract, role, address);
      
      if (result.success) {
        showNotification(`Successfully granted ${ROLE_NAMES[role]} to ${address.slice(0, 10)}...`, 'success');
        loadUserList();
        
        // Add to local storage if new user
        const savedUsers = JSON.parse(localStorage.getItem('certificateUsers') || '[]');
        if (!savedUsers.find(u => u.address.toLowerCase() === address.toLowerCase())) {
          savedUsers.push({ address, addedAt: new Date().toISOString() });
          localStorage.setItem('certificateUsers', JSON.stringify(savedUsers));
        }
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error granting role:', error);
      showNotification('Failed to grant role', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeRole = async (address, role) => {
    if (!confirm(`Are you sure you want to revoke ${ROLE_NAMES[role]} from ${address}?`)) {
      return;
    }

    try {
      setLoading(true);
      const result = await revokeRole(contract, role, address);
      
      if (result.success) {
        showNotification(`Successfully revoked ${ROLE_NAMES[role]} from ${address.slice(0, 10)}...`, 'success');
        loadUserList();
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error revoking role:', error);
      showNotification('Failed to revoke role', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyRevoke = async (address, role) => {
    const reason = prompt(`Emergency revocation reason for ${address}:`);
    if (!reason) return;

    try {
      setLoading(true);
      const result = await emergencyRevokeRole(contract, address, role, reason);
      
      if (result.success) {
        showNotification(`Emergency revocation successful`, 'success');
        loadUserList();
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error performing emergency revocation:', error);
      showNotification('Failed to perform emergency revocation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!isValidAddress(newUserAddress)) {
      showNotification('Invalid Ethereum address', 'error');
      return;
    }

    if (!selectedRole) {
      showNotification('Please select a role', 'error');
      return;
    }

    await handleGrantRole(newUserAddress, selectedRole);
    setNewUserAddress('');
    setSelectedRole('');
  };

  const handlePauseContract = async () => {
    if (!confirm('Are you sure you want to PAUSE the contract? All operations will be stopped.')) {
      return;
    }

    try {
      setLoading(true);
      const result = await pauseContract(contract);
      
      if (result.success) {
        setIsPaused(true);
        showNotification('Contract paused successfully', 'success');
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error pausing contract:', error);
      showNotification('Failed to pause contract', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpauseContract = async () => {
    try {
      setLoading(true);
      const result = await unpauseContract(contract);
      
      if (result.success) {
        setIsPaused(false);
        showNotification('Contract unpaused successfully', 'success');
      } else {
        showNotification(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error unpausing contract:', error);
      showNotification('Failed to unpause contract', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userPermissions) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading permissions...</div>
      </div>
    );
  }

  if (!userPermissions?.isAdmin) {
    return (
      <div className="admin-dashboard">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have administrative access to this dashboard.</p>
          <p>Current permissions:</p>
          <ul>
            <li>Can Issue: {userPermissions?.canIssue ? '✅' : '❌'}</li>
            <li>Can Revoke: {userPermissions?.canRevoke ? '✅' : '❌'}</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
          <button onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <div className="user-info">
            <div className="user-roles">
              {userPermissions.roles.map(role => (
                <span
                  key={role.hash}
                  className="role-badge"
                  style={{ backgroundColor: role.color }}
                  title={role.description}
                >
                  {role.name}
                </span>
              ))}
            </div>
            <div className="user-address">{currentAccount.slice(0, 10)}...{currentAccount.slice(-8)}</div>
          </div>
        </header>

      <nav className="dashboard-nav">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button
          className={activeTab === 'roles' ? 'active' : ''}
          onClick={() => setActiveTab('roles')}
        >
          Role Assignment
        </button>
        <button
          className={activeTab === 'requests' ? 'active' : ''}
          onClick={() => setActiveTab('requests')}
        >
          Role Requests {roleRequests.length > 0 && `(${roleRequests.length})`}
        </button>
        {userPermissions.isSuperAdmin && (
          <button
            className={activeTab === 'emergency' ? 'active' : ''}
            onClick={() => setActiveTab('emergency')}
          >
            Emergency Controls
          </button>
        )}
      </nav>

      <main className="dashboard-content">
        {activeTab === 'overview' && (
          <OverviewTab
            userPermissions={userPermissions}
            userList={userList}
            contract={contract}
            isPaused={isPaused}
          />
        )}

        {activeTab === 'users' && (
          <UserManagementTab
            userList={userList}
            contract={contract}
            onRevokeRole={handleRevokeRole}
            canManage={userPermissions.roles.map(r => r.hash)}
          />
        )}

        {activeTab === 'roles' && (
          <RoleAssignmentTab
            newUserAddress={newUserAddress}
            setNewUserAddress={setNewUserAddress}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            onAddUser={handleAddUser}
            loading={loading}
            canManage={userPermissions.roles.map(r => r.hash)}
          />
        )}

        {activeTab === 'requests' && (
          <RoleRequestsTab
            requests={roleRequests}
            onApprove={handleGrantRole}
            onReject={(request) => {
              setRoleRequests(prev => prev.filter(r => r.transactionHash !== request.transactionHash));
              showNotification('Request rejected', 'info');
            }}
            loading={loading}
          />
        )}

        {activeTab === 'emergency' && userPermissions.isSuperAdmin && (
          <EmergencyControlsTab
            isPaused={isPaused}
            onPause={handlePauseContract}
            onUnpause={handleUnpauseContract}
            onEmergencyRevoke={handleEmergencyRevoke}
            userList={userList}
            contract={contract}
            loading={loading}
          />
        )}
      </main>
      </div>
    </div>
  );
}

// Overview Tab Component
const OverviewTab = ({ userPermissions, userList, contract, isPaused }) => {
  const [stats, setStats] = useState({ totalCertificates: 0 });

  useEffect(() => {
    loadStats();
  }, [contract]);

  const loadStats = async () => {
    try {
      const total = await contract.getTotalMinted();
      setStats({ totalCertificates: total.toString() });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="overview-tab">
      <h2>System Overview</h2>
      
      {isPaused && (
        <div className="alert alert-danger">
          ⚠️ Contract is currently PAUSED. All operations are disabled.
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Certificates</h3>
          <div className="stat-value">{stats.totalCertificates}</div>
        </div>
        <div className="stat-card">
          <h3>Total Users</h3>
          <div className="stat-value">{userList.length}</div>
        </div>
        <div className="stat-card">
          <h3>Your Permissions</h3>
          <div className="stat-value">
            {userPermissions.roles.length} role{userPermissions.roles.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="role-hierarchy">
        <h3>Role Hierarchy</h3>
        <div className="hierarchy-chart">
          <div className="hierarchy-level level-1">
            <span style={{ backgroundColor: ROLE_COLORS[ROLES.SUPER_ADMIN] }}>
              SUPER_ADMIN
            </span>
          </div>
          <div className="hierarchy-connector">│</div>
          <div className="hierarchy-level level-2">
            <span style={{ backgroundColor: ROLE_COLORS[ROLES.ADMIN] }}>
              ADMIN
            </span>
          </div>
          <div className="hierarchy-connector">├─────┤</div>
          <div className="hierarchy-level level-3">
            <span style={{ backgroundColor: ROLE_COLORS[ROLES.ISSUER] }}>
              ISSUER
            </span>
            <span style={{ backgroundColor: ROLE_COLORS[ROLES.REVOKER] }}>
              REVOKER
            </span>
          </div>
          <div className="hierarchy-connector">│</div>
          <div className="hierarchy-level level-4">
            <span style={{ backgroundColor: ROLE_COLORS[ROLES.VERIFIER] }}>
              VERIFIER
            </span>
          </div>
        </div>
      </div>

      <div className="permissions-summary">
        <h3>Your Permissions</h3>
        <ul>
          <li>✅ Issue Certificates: {userPermissions.canIssue ? 'Yes' : 'No'}</li>
          <li>✅ Revoke Certificates: {userPermissions.canRevoke ? 'Yes' : 'No'}</li>
          <li>✅ Manage Users: {userPermissions.isAdmin ? 'Yes' : 'No'}</li>
          <li>✅ Emergency Controls: {userPermissions.isSuperAdmin ? 'Yes' : 'No'}</li>
        </ul>
      </div>
    </div>
  );
};

// User Management Tab Component
const UserManagementTab = ({ userList, contract, onRevokeRole, canManage }) => {
  const [userRoles, setUserRoles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllUserRoles();
  }, [userList, contract]);

  const loadAllUserRoles = async () => {
    try {
      setLoading(true);
      const rolesData = {};
      
      for (const user of userList) {
        const roles = await getUserRoles(contract, user.address);
        rolesData[user.address] = formatRoles(roles);
      }
      
      setUserRoles(rolesData);
    } catch (error) {
      console.error('Error loading user roles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-management-tab">
      <h2>User Management</h2>
      
      {loading ? (
        <div className="loading">Loading users...</div>
      ) : userList.length === 0 ? (
        <div className="empty-state">
          <p>No users found. Add users in the Role Assignment tab.</p>
        </div>
      ) : (
        <div className="user-table">
          <table>
            <thead>
              <tr>
                <th>Address</th>
                <th>Roles</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {userList.map(user => (
                <tr key={user.address}>
                  <td className="address-cell">
                    {user.address.slice(0, 10)}...{user.address.slice(-8)}
                  </td>
                  <td className="roles-cell">
                    {userRoles[user.address]?.map(role => (
                      <span
                        key={role.hash}
                        className="role-badge"
                        style={{ backgroundColor: role.color }}
                        title={role.description}
                      >
                        {role.name}
                      </span>
                    )) || 'Loading...'}
                  </td>
                  <td>{new Date(user.addedAt).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    {userRoles[user.address]?.map(role => (
                      canManageRole(canManage, role.hash) && (
                        <button
                          key={role.hash}
                          className="btn-small btn-danger"
                          onClick={() => onRevokeRole(user.address, role.hash)}
                        >
                          Revoke {role.name}
                        </button>
                      )
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Role Assignment Tab Component
const RoleAssignmentTab = ({
  newUserAddress,
  setNewUserAddress,
  selectedRole,
  setSelectedRole,
  onAddUser,
  loading,
  canManage,
}) => {
  const availableRoles = getAvailableRoles().filter(role => 
    role.value !== ROLES.SUPER_ADMIN || canManage.includes(ROLES.SUPER_ADMIN)
  );

  return (
    <div className="role-assignment-tab">
      <h2>Assign Roles</h2>
      
      <div className="assignment-form">
        <div className="form-group">
          <label>User Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={newUserAddress}
            onChange={(e) => setNewUserAddress(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Select Role</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="form-select"
          >
            <option value="">-- Select a role --</option>
            {availableRoles.map(role => (
              <option key={role.value} value={role.value}>
                {role.label} - {role.description}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn-primary"
          onClick={onAddUser}
          disabled={loading || !newUserAddress || !selectedRole}
        >
          {loading ? 'Processing...' : 'Grant Role'}
        </button>
      </div>

      <div className="role-info">
        <h3>Role Descriptions</h3>
        {availableRoles.map(role => (
          <div key={role.value} className="role-info-card">
            <div
              className="role-color-indicator"
              style={{ backgroundColor: role.color }}
            />
            <div className="role-info-content">
              <h4>{role.label}</h4>
              <p>{role.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Role Requests Tab Component
const RoleRequestsTab = ({ requests, onApprove, onReject, loading }) => {
  return (
    <div className="role-requests-tab">
      <h2>Role Requests</h2>
      
      {requests.length === 0 ? (
        <div className="empty-state">
          <p>No pending role requests.</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map((request, index) => (
            <div key={index} className="request-card">
              <div className="request-header">
                <span className="request-role" style={{ backgroundColor: ROLE_COLORS[request.role] }}>
                  {request.roleName}
                </span>
                <span className="request-date">
                  Block #{request.blockNumber}
                </span>
              </div>
              <div className="request-body">
                <div className="request-field">
                  <strong>Requester:</strong>
                  <code>{request.requester}</code>
                </div>
                <div className="request-field">
                  <strong>Justification:</strong>
                  <p>{request.justification}</p>
                </div>
                <div className="request-field">
                  <strong>Transaction:</strong>
                  <code className="tx-hash">{request.transactionHash}</code>
                </div>
              </div>
              <div className="request-actions">
                <button
                  className="btn-success"
                  onClick={() => onApprove(request.requester, request.role)}
                  disabled={loading}
                >
                  Approve
                </button>
                <button
                  className="btn-danger"
                  onClick={() => onReject(request)}
                  disabled={loading}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Emergency Controls Tab Component
const EmergencyControlsTab = ({
  isPaused,
  onPause,
  onUnpause,
  onEmergencyRevoke,
  userList,
  contract,
  loading,
}) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRoleForRevoke, setSelectedRoleForRevoke] = useState('');
  const [userRolesForRevoke, setUserRolesForRevoke] = useState([]);

  useEffect(() => {
    if (selectedUser) {
      loadUserRoles();
    }
  }, [selectedUser]);

  const loadUserRoles = async () => {
    try {
      const roles = await getUserRoles(contract, selectedUser);
      setUserRolesForRevoke(formatRoles(roles));
    } catch (error) {
      console.error('Error loading user roles:', error);
    }
  };

  return (
    <div className="emergency-controls-tab">
      <h2>⚠️ Emergency Controls</h2>
      <p className="warning-text">
        These controls should only be used in emergency situations. All actions are logged and irreversible.
      </p>

      <div className="emergency-section">
        <h3>Contract Pause Control</h3>
        <p>Pausing the contract will stop all mint and revoke operations immediately.</p>
        <div className="pause-controls">
          <div className="status-indicator" data-paused={isPaused}>
            Status: {isPaused ? '🔴 PAUSED' : '🟢 ACTIVE'}
          </div>
          {isPaused ? (
            <button className="btn-success" onClick={onUnpause} disabled={loading}>
              Unpause Contract
            </button>
          ) : (
            <button className="btn-danger" onClick={onPause} disabled={loading}>
              Pause Contract
            </button>
          )}
        </div>
      </div>

      <div className="emergency-section">
        <h3>Emergency Role Revocation</h3>
        <p>Immediately revoke a role from a user with mandatory reason documentation.</p>
        
        <div className="emergency-form">
          <div className="form-group">
            <label>Select User</label>
            <select
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                setSelectedRoleForRevoke('');
              }}
              className="form-select"
            >
              <option value="">-- Select user --</option>
              {userList.map(user => (
                <option key={user.address} value={user.address}>
                  {user.address.slice(0, 15)}...{user.address.slice(-8)}
                </option>
              ))}
            </select>
          </div>

          {selectedUser && userRolesForRevoke.length > 0 && (
            <div className="form-group">
              <label>Select Role to Revoke</label>
              <select
                value={selectedRoleForRevoke}
                onChange={(e) => setSelectedRoleForRevoke(e.target.value)}
                className="form-select"
              >
                <option value="">-- Select role --</option>
                {userRolesForRevoke.map(role => (
                  <option key={role.hash} value={role.hash}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className="btn-danger"
            onClick={() => onEmergencyRevoke(selectedUser, selectedRoleForRevoke)}
            disabled={loading || !selectedUser || !selectedRoleForRevoke}
          >
            Emergency Revoke
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
