import { ethers } from 'ethers';

// Role constants (must match contract)
export const ROLES = {
  SUPER_ADMIN: ethers.keccak256(ethers.toUtf8Bytes("SUPER_ADMIN_ROLE")),
  ADMIN: ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")),
  ISSUER: ethers.keccak256(ethers.toUtf8Bytes("ISSUER_ROLE")),
  REVOKER: ethers.keccak256(ethers.toUtf8Bytes("REVOKER_ROLE")),
  VERIFIER: ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE")),
};

// Role display names
export const ROLE_NAMES = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.ISSUER]: 'Issuer',
  [ROLES.REVOKER]: 'Revoker',
  [ROLES.VERIFIER]: 'Verifier',
};

// Role descriptions
export const ROLE_DESCRIPTIONS = {
  [ROLES.SUPER_ADMIN]: 'Full system control, manage all roles and emergency functions',
  [ROLES.ADMIN]: 'Issue and revoke certificates, manage lower roles',
  [ROLES.ISSUER]: 'Issue new certificates to recipients',
  [ROLES.REVOKER]: 'Revoke existing certificates',
  [ROLES.VERIFIER]: 'Read-only access, verify certificates',
};

// Role colors for UI
export const ROLE_COLORS = {
  [ROLES.SUPER_ADMIN]: '#dc2626', // red-600
  [ROLES.ADMIN]: '#ea580c', // orange-600
  [ROLES.ISSUER]: '#059669', // emerald-600
  [ROLES.REVOKER]: '#7c3aed', // violet-600
  [ROLES.VERIFIER]: '#0284c7', // sky-600
};

/**
 * Check if an address has a specific role
 * @param {Object} contract - CertificateNFT contract instance
 * @param {string} address - Address to check
 * @param {string} role - Role hash to check
 * @returns {Promise<boolean>}
 */
export async function hasRole(contract, address, role) {
  try {
    return await contract.hasRole(role, address);
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
}

/**
 * Get all roles for a specific address
 * @param {Object} contract - CertificateNFT contract instance
 * @param {string} address - Address to check
 * @returns {Promise<string[]>} Array of role hashes
 */
export async function getUserRoles(contract, address) {
  try {
    const roles = await contract.getUserRoles(address);
    return roles;
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
}

/**
 * Get role information for display
 * @param {string[]} roleHashes - Array of role hashes
 * @returns {Array<{hash: string, name: string, description: string, color: string}>}
 */
export function formatRoles(roleHashes) {
  return roleHashes.map(hash => ({
    hash,
    name: ROLE_NAMES[hash] || 'Unknown',
    description: ROLE_DESCRIPTIONS[hash] || '',
    color: ROLE_COLORS[hash] || '#6b7280',
  }));
}

/**
 * Check if user has permission to issue certificates
 * @param {Object} contract - CertificateNFT contract instance
 * @param {string} address - Address to check
 * @returns {Promise<boolean>}
 */
export async function canIssueCertificates(contract, address) {
  try {
    return await contract.canIssue(address);
  } catch (error) {
    console.error('Error checking issue permission:', error);
    return false;
  }
}

/**
 * Check if user has permission to revoke certificates
 * @param {Object} contract - CertificateNFT contract instance
 * @param {string} address - Address to check
 * @returns {Promise<boolean>}
 */
export async function canRevokeCertificates(contract, address) {
  try {
    return await contract.canRevoke(address);
  } catch (error) {
    console.error('Error checking revoke permission:', error);
    return false;
  }
}

/**
 * Check if user is an admin
 * @param {Object} contract - CertificateNFT contract instance
 * @param {string} address - Address to check
 * @returns {Promise<boolean>}
 */
export async function isAdmin(contract, address) {
  try {
    return await contract.isAdmin(address);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Grant a role to an address
 * @param {Object} contract - CertificateNFT contract instance
 * @param {string} role - Role hash to grant
 * @param {string} address - Address to grant role to
 * @returns {Promise<Object>} Transaction receipt
 */
export async function grantRole(contract, role, address) {
  try {
    const tx = await contract.grantRole(role, address);
    const receipt = await tx.wait();
    return { success: true, receipt };
  } catch (error) {
    console.error('Error granting role:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Revoke a role from an address
 * @param {Object} contract - CertificateNFT contract instance
 * @param {string} role - Role hash to revoke
 * @param {string} address - Address to revoke role from
 * @returns {Promise<Object>} Transaction receipt
 */
export async function revokeRole(contract, role, address) {
  try {
    const tx = await contract.revokeRole(role, address);
    const receipt = await tx.wait();
    return { success: true, receipt };
  } catch (error) {
    console.error('Error revoking role:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Emergency revoke a role (SUPER_ADMIN only)
 * @param {Object} contract - CertificateNFT contract instance
 * @param {string} address - Address to revoke role from
 * @param {string} role - Role hash to revoke
 * @param {string} reason - Reason for emergency revocation
 * @returns {Promise<Object>} Transaction receipt
 */
export async function emergencyRevokeRole(contract, address, role, reason) {
  try {
    const tx = await contract.emergencyRevokeRole(address, role, reason);
    const receipt = await tx.wait();
    return { success: true, receipt };
  } catch (error) {
    console.error('Error performing emergency revocation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Request a role (emits event for admin review)
 * @param {Object} contract - CertificateNFT contract instance
 * @param {string} role - Role hash being requested
 * @param {string} justification - Reason for requesting the role
 * @returns {Promise<Object>} Transaction receipt
 */
export async function requestRole(contract, role, justification) {
  try {
    const tx = await contract.requestRole(role, justification);
    const receipt = await tx.wait();
    return { success: true, receipt };
  } catch (error) {
    console.error('Error requesting role:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Batch grant roles to multiple addresses
 * @param {Object} contract - CertificateNFT contract instance
 * @param {string[]} addresses - Array of addresses
 * @param {string[]} roles - Array of role hashes (must match addresses length)
 * @returns {Promise<Object>} Transaction receipt
 */
export async function batchGrantRoles(contract, addresses, roles) {
  try {
    const tx = await contract.batchGrantRoles(addresses, roles);
    const receipt = await tx.wait();
    return { success: true, receipt };
  } catch (error) {
    console.error('Error batch granting roles:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Pause the contract (SUPER_ADMIN only)
 * @param {Object} contract - CertificateNFT contract instance
 * @returns {Promise<Object>} Transaction receipt
 */
export async function pauseContract(contract) {
  try {
    const tx = await contract.pause();
    const receipt = await tx.wait();
    return { success: true, receipt };
  } catch (error) {
    console.error('Error pausing contract:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Unpause the contract (SUPER_ADMIN only)
 * @param {Object} contract - CertificateNFT contract instance
 * @returns {Promise<Object>} Transaction receipt
 */
export async function unpauseContract(contract) {
  try {
    const tx = await contract.unpause();
    const receipt = await tx.wait();
    return { success: true, receipt };
  } catch (error) {
    console.error('Error unpausing contract:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user permissions summary
 * @param {Object} contract - CertificateNFT contract instance
 * @param {string} address - Address to check
 * @returns {Promise<Object>} Permissions object
 */
export async function getUserPermissions(contract, address) {
  try {
    const [roles, canIssue, canRevoke, admin] = await Promise.all([
      getUserRoles(contract, address),
      canIssueCertificates(contract, address),
      canRevokeCertificates(contract, address),
      isAdmin(contract, address),
    ]);

    return {
      roles: formatRoles(roles),
      canIssue,
      canRevoke,
      isAdmin: admin,
      isSuperAdmin: roles.some(r => r === ROLES.SUPER_ADMIN),
    };
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return {
      roles: [],
      canIssue: false,
      canRevoke: false,
      isAdmin: false,
      isSuperAdmin: false,
    };
  }
}

/**
 * Listen for role request events
 * @param {Object} contract - CertificateNFT contract instance
 * @param {Function} callback - Callback function (requester, role, justification) => void
 * @returns {Function} Cleanup function to remove listener
 */
export function listenForRoleRequests(contract, callback) {
  const filter = contract.filters.RoleRequested();
  
  const listener = (requester, role, justification, event) => {
    callback({
      requester,
      role,
      roleName: ROLE_NAMES[role] || 'Unknown',
      justification,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
    });
  };

  contract.on(filter, listener);

  // Return cleanup function
  return () => {
    contract.off(filter, listener);
  };
}

/**
 * Listen for emergency role revocation events
 * @param {Object} contract - CertificateNFT contract instance
 * @param {Function} callback - Callback function (admin, user, role, reason) => void
 * @returns {Function} Cleanup function to remove listener
 */
export function listenForEmergencyRevocations(contract, callback) {
  const filter = contract.filters.EmergencyRoleRevoked();
  
  const listener = (admin, user, role, reason, event) => {
    callback({
      admin,
      user,
      role,
      roleName: ROLE_NAMES[role] || 'Unknown',
      reason,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
    });
  };

  contract.on(filter, listener);

  // Return cleanup function
  return () => {
    contract.off(filter, listener);
  };
}

/**
 * Validate role hierarchy (check if user can manage target role)
 * @param {string[]} userRoles - Array of user's role hashes
 * @param {string} targetRole - Target role hash to manage
 * @returns {boolean}
 */
export function canManageRole(userRoles, targetRole) {
  // SUPER_ADMIN can manage all roles
  if (userRoles.includes(ROLES.SUPER_ADMIN)) {
    return true;
  }

  // ADMIN can manage ISSUER, REVOKER, and VERIFIER
  if (userRoles.includes(ROLES.ADMIN)) {
    return [ROLES.ISSUER, ROLES.REVOKER, ROLES.VERIFIER].includes(targetRole);
  }

  return false;
}

/**
 * Get role hierarchy level (higher number = more permissions)
 * @param {string} role - Role hash
 * @returns {number}
 */
export function getRoleLevel(role) {
  const levels = {
    [ROLES.SUPER_ADMIN]: 5,
    [ROLES.ADMIN]: 4,
    [ROLES.ISSUER]: 3,
    [ROLES.REVOKER]: 3,
    [ROLES.VERIFIER]: 2,
  };
  return levels[role] || 0;
}

/**
 * Sort roles by hierarchy level
 * @param {string[]} roles - Array of role hashes
 * @returns {string[]} Sorted array
 */
export function sortRolesByHierarchy(roles) {
  return [...roles].sort((a, b) => getRoleLevel(b) - getRoleLevel(a));
}

/**
 * Get all available roles for selection
 * @returns {Array<{value: string, label: string, description: string}>}
 */
export function getAvailableRoles() {
  return Object.entries(ROLES).map(([key, value]) => ({
    value,
    label: ROLE_NAMES[value],
    description: ROLE_DESCRIPTIONS[value],
    color: ROLE_COLORS[value],
  }));
}

/**
 * Validate Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean}
 */
export function isValidAddress(address) {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

export default {
  ROLES,
  ROLE_NAMES,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
  hasRole,
  getUserRoles,
  formatRoles,
  canIssueCertificates,
  canRevokeCertificates,
  isAdmin,
  grantRole,
  revokeRole,
  emergencyRevokeRole,
  requestRole,
  batchGrantRoles,
  pauseContract,
  unpauseContract,
  getUserPermissions,
  listenForRoleRequests,
  listenForEmergencyRevocations,
  canManageRole,
  getRoleLevel,
  sortRolesByHierarchy,
  getAvailableRoles,
  isValidAddress,
};
