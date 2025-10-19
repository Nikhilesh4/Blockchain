const API_BASE = 'http://localhost:5000/api/certificates';

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('template', file);

  const response = await fetch(`${API_BASE}/upload-image`, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || 'Failed to upload image');
  }
  return result.data;
};

export const generateMetadata = async (metadataInfo) => {
  const response = await fetch(`${API_BASE}/generate-metadata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadataInfo),
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || 'Failed to generate metadata');
  }
  return result.data;
};

export const mintCertificate = async (recipientAddress, metadataUrl) => {
  const response = await fetch(`${API_BASE}/mint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipientAddress, metadataUrl }),
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || 'Failed to mint certificate');
  }
  return result.data;
};

export const getCertificate = async (tokenId) => {
  const response = await fetch(`${API_BASE}/${tokenId}`);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch certificate');
  }
  return result.data;
};

export const verifyCertificate = async (tokenId) => {
  const response = await fetch(`${API_BASE}/verify/${tokenId}`);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'Failed to verify certificate');
  }
  return result.data;
};

export const revokeCertificate = async (tokenId, reason) => {
  const response = await fetch(`${API_BASE}/revoke/${tokenId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || 'Failed to revoke certificate');
  }
  return result.data;
};

export const getStats = async () => {
  const response = await fetch(`${API_BASE}/stats/overview`);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch stats');
  }
  return result.data;
};