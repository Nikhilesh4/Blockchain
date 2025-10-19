const API_BASE = 'http://localhost:5000/api/certificates';

/**
 * Issue a certificate with signature authentication
 */
export const issueCertificate = async (certificateData, signature, message, adminAddress) => {
  const response = await fetch(`${API_BASE}/issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...certificateData,
      signature,
      message,
      adminAddress
    }),
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || result.message || 'Failed to issue certificate');
  }
  return result.data;
};

/**
 * Get certificate details by token ID
 */
export const getCertificate = async (tokenId) => {
  const response = await fetch(`${API_BASE}/${tokenId}`);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || result.message || 'Failed to fetch certificate');
  }
  return result.data;
};

/**
 * Verify certificate validity
 */
export const verifyCertificate = async (tokenId) => {
  const response = await fetch(`${API_BASE}/verify/${tokenId}`);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || result.message || 'Failed to verify certificate');
  }
  return result.data;
};

/**
 * Revoke a certificate with signature authentication
 */
export const revokeCertificate = async (tokenId, reason, signature, message, adminAddress) => {
  const response = await fetch(`${API_BASE}/revoke/${tokenId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      reason,
      signature,
      message,
      adminAddress
    }),
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || result.message || 'Failed to revoke certificate');
  }
  return result.data;
};

/**
 * Get statistics overview
 */
export const getStats = async () => {
  const response = await fetch(`${API_BASE}/stats/overview`);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || result.message || 'Failed to fetch stats');
  }
  return result.data;
};

/**
 * Health check
 */
export const healthCheck = async () => {
  const response = await fetch(`${API_BASE}/health`);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || result.message || 'Health check failed');
  }
  return result.data;
};