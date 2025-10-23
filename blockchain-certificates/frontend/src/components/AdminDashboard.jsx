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
    try {
      const savedUsers = JSON.parse(localStorage.getItem('certificateUsers') || '[]');
      
      const usersWithRoles = [];
      for (const user of savedUsers) {
        try {
          const roles = await getUserRoles(contract, user.address);
          if (roles && roles.length > 0) {
            usersWithRoles.push(user);
          }
        } catch (error) {
          console.error(`Error checking roles for ${user.address}:`, error);
          usersWithRoles.push(user);
        }
      }
      
      localStorage.setItem('certificateUsers', JSON.stringify(usersWithRoles));
      setUserList(usersWithRoles);
    } catch (error) {
      console.error('Error loading user list:', error);
    }
  };

  const setupEventListeners = () => {
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
        
        const savedUsers = JSON.parse(localStorage.getItem('certificateUsers') || '[]');
        if (!savedUsers.find(u => u.address.toLowerCase() === address.toLowerCase())) {
          savedUsers.push({ address, addedAt: new Date().toISOString() });
          localStorage.setItem('certificateUsers', JSON.stringify(savedUsers));
        }
        
        await loadUserList();
        return true;
      } else {
        showNotification(`Error: ${result.error}`, 'error');
        return false;
      }
    } catch (error) {
      console.error('Error granting role:', error);
      showNotification('Failed to grant role', 'error');
      return false;
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
        
        const remainingRoles = await getUserRoles(contract, address);
        
        if (!remainingRoles || remainingRoles.length === 0) {
          const savedUsers = JSON.parse(localStorage.getItem('certificateUsers') || '[]');
          const updatedUsers = savedUsers.filter(u => u.address.toLowerCase() !== address.toLowerCase());
          localStorage.setItem('certificateUsers', JSON.stringify(updatedUsers));
          showNotification(`User removed from list (no remaining roles)`, 'info');
        }
        
        await loadUserList();
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
        
        const remainingRoles = await getUserRoles(contract, address);
        
        if (!remainingRoles || remainingRoles.length === 0) {
          const savedUsers = JSON.parse(localStorage.getItem('certificateUsers') || '[]');
          const updatedUsers = savedUsers.filter(u => u.address.toLowerCase() !== address.toLowerCase());
          localStorage.setItem('certificateUsers', JSON.stringify(updatedUsers));
          showNotification(`User removed from list (no remaining roles)`, 'info');
        }
        
        await loadUserList();
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

    const result = await handleGrantRole(newUserAddress, selectedRole);
    
    setNewUserAddress('');
    setSelectedRole('');
    
    if (result !== false) {
      setTimeout(() => setActiveTab('users'), 500);
    }
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
              userPermissions={userPermissions}
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
};

// Overview Tab Component (unchanged)
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
          <h3>Your Active Roles</h3>
          <div className="stat-value">
            {userPermissions.roles?.length || 0}
          </div>
          <div className="stat-label">
            {(userPermissions.roles?.length || 0) === 1 ? 'Role' : 'Roles'}
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
        <div className="permissions-grid">
          <div className="permission-item">
            <span className="permission-icon">{userPermissions.canIssue ? '✅' : '❌'}</span>
            <span className="permission-label">Issue Certificates</span>
            <span className="permission-value">{userPermissions.canIssue ? 'Yes' : 'No'}</span>
          </div>
          <div className="permission-item">
            <span className="permission-icon">{userPermissions.canRevoke ? '✅' : '❌'}</span>
            <span className="permission-label">Revoke Certificates</span>
            <span className="permission-value">{userPermissions.canRevoke ? 'Yes' : 'No'}</span>
          </div>
          <div className="permission-item">
            <span className="permission-icon">{userPermissions.isAdmin ? '✅' : '❌'}</span>
            <span className="permission-label">Manage Users</span>
            <span className="permission-value">{userPermissions.isAdmin ? 'Yes' : 'No'}</span>
          </div>
          <div className="permission-item">
            <span className="permission-icon">{userPermissions.isSuperAdmin ? '✅' : '❌'}</span>
            <span className="permission-label">Emergency Controls</span>
            <span className="permission-value">{userPermissions.isSuperAdmin ? 'Yes' : 'No'}</span>
          </div>
          <div className="permission-item highlight">
            <span className="permission-icon">🎭</span>
            <span className="permission-label">Active Roles</span>
            <span className="permission-value">{userPermissions.roles?.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// User Management Tab (unchanged)
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
      <div className="tab-header">
        <h2>User Management</h2>
        <button 
          className="btn-refresh" 
          onClick={loadAllUserRoles}
          disabled={loading}
          title="Refresh user roles"
        >
          🔄 {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
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

// ✅ FIXED: Role Assignment Tab - Prevents assigning equal or higher roles
const RoleAssignmentTab = ({
  newUserAddress,
  setNewUserAddress,
  selectedRole,
  setSelectedRole,
  onAddUser,
  loading,
  userPermissions, // Now receives full userPermissions instead of just canManage
}) => {
  // Define role hierarchy levels (lower number = higher privilege)
  const ROLE_HIERARCHY = {
    [ROLES.SUPER_ADMIN]: 1,
    [ROLES.ADMIN]: 2,
    [ROLES.ISSUER]: 3,
    [ROLES.REVOKER]: 3,
    [ROLES.VERIFIER]: 4,
  };

  // Get current user's highest role level
  const getCurrentUserHighestRoleLevel = () => {
    if (!userPermissions || !userPermissions.roles) return 999; // No permission
    
    // Find the highest privilege role (lowest number)
    const userRoleLevels = userPermissions.roles.map(role => 
      ROLE_HIERARCHY[role.hash] || 999
    );
    
    return Math.min(...userRoleLevels);
  };

  const currentUserLevel = getCurrentUserHighestRoleLevel();

  // Filter roles: only show roles BELOW current user's level
  const availableRoles = getAvailableRoles().filter(role => {
    const roleLevel = ROLE_HIERARCHY[role.value];
    
    // Only show roles that are strictly lower privilege (higher number) than user's role
    return roleLevel > currentUserLevel;
  });

  return (
    <div className="role-assignment-tab">
      <h2>Assign Roles</h2>
      
      {/* Show info about what roles can be assigned */}
      <div className="info-banner">
        <strong>ℹ️ Your Role Level:</strong> 
        {userPermissions?.isSuperAdmin && ' SUPER_ADMIN (Can assign: ADMIN, ISSUER, REVOKER, VERIFIER)'}
        {!userPermissions?.isSuperAdmin && userPermissions?.isAdmin && ' ADMIN (Can assign: ISSUER, REVOKER, VERIFIER)'}
        {!userPermissions?.isAdmin && userPermissions?.canIssue && ' ISSUER (Can assign: VERIFIER)'}
      </div>

      {availableRoles.length === 0 ? (
        <div className="alert alert-warning">
          <p>You do not have permission to assign any roles.</p>
          <p>Contact a SUPER_ADMIN or ADMIN for role assignments.</p>
        </div>
      ) : (
        <>
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
            <h3>Available Roles to Assign</h3>
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
        </>
      )}
    </div>
  );
};

// Role Requests Tab (unchanged)
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

// Emergency Controls Tab (unchanged)
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