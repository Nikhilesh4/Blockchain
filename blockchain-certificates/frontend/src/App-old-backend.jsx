import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast, { Toaster } from 'react-hot-toast';
import { issueCertificate, getStats, verifyCertificate, revokeCertificate } from './utils/api';
import './App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [signer, setSigner] = useState(null);

  // Form states
  const [recipientName, setRecipientName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [grade, setGrade] = useState('');
  const [issuer, setIssuer] = useState('Blockchain University');
  const [description, setDescription] = useState('');

  // UI states
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState(null);
  const [verifyTokenId, setVerifyTokenId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [revokeTokenId, setRevokeTokenId] = useState('');
  const [revokeReason, setRevokeReason] = useState('');

  // Add new state for generated certificate result
  const [generatedCertificate, setGeneratedCertificate] = useState(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined';
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      toast.error('Please install MetaMask to use this application!');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const walletSigner = await provider.getSigner();
      const balance = await provider.getBalance(accounts[0]);

      setAccount(accounts[0]);
      setBalance(ethers.formatEther(balance));
      setChainId(network.chainId.toString());
      setSigner(walletSigner);

      toast.success('Wallet connected successfully!');
      loadStats();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setBalance('0');
    setChainId(null);
    setSigner(null);
    toast.success('Wallet disconnected');
  };

  // Switch to localhost network
  const switchToLocalhost = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7A69' }], // 31337 in hex (Hardhat default)
      });
      toast.success('Switched to localhost network');
    } catch (error) {
      // Network doesn't exist, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x7A69',
              chainName: 'Hardhat Local',
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['http://127.0.0.1:8545'],
            }],
          });
          toast.success('Localhost network added and switched');
        } catch (addError) {
          toast.error('Failed to add localhost network');
        }
      } else {
        toast.error('Failed to switch network');
      }
    }
  };

  // Load statistics
  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Create signature message
  const createSignatureMessage = (action, data) => {
    const timestamp = Math.floor(Date.now() / 1000);
    let message = `${action}\n`;
    message += `Timestamp: ${timestamp}\n`;
    
    Object.keys(data).forEach(key => {
      if (data[key]) {
        message += `${key}: ${data[key]}\n`;
      }
    });
    
    return { message: message.trim(), timestamp };
  };

  // Sign message with MetaMask
  const signMessage = async (message) => {
    if (!signer) {
      throw new Error('Please connect your wallet first');
    }
    
    try {
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error) {
      if (error.code === 4001) {
        throw new Error('Signature rejected by user');
      }
      throw error;
    }
  };

  // Issue certificate
  const handleIssueCertificate = async (e) => {
    e.preventDefault();

    if (!account || !signer) {
      toast.error('Please connect your wallet first!');
      return;
    }

    if (!ethers.isAddress(recipientAddress)) {
      toast.error('Invalid recipient address!');
      return;
    }

    setIsProcessing(true);
    setGeneratedCertificate(null); // Reset previous result
    const loadingToast = toast.loading('Processing certificate issuance...');

    try {
      // Step 1: Create message to sign
      const { message, timestamp } = createSignatureMessage('Issue Certificate', {
        recipientName,
        recipientAddress,
        grade,
        issuer
      });

      toast.loading('Please sign the message in MetaMask...', { id: loadingToast });

      // Step 2: Request signature from MetaMask
      const signature = await signMessage(message);
      
      toast.loading('Certificate image is being generated...', { id: loadingToast });

      // Step 3: Send to backend
      const certificateData = {
        recipientName,
        recipientAddress,
        grade,
        issuer,
        description,
        attributes: [
          { trait_type: 'Recipient Name', value: recipientName },
          { trait_type: 'Grade', value: grade },
          { trait_type: 'Issue Date', value: new Date().toISOString() },
          { trait_type: 'Verified', value: 'True' }
        ]
      };

      const result = await issueCertificate(
        certificateData,
        signature,
        message,
        account
      );

      // Store the generated certificate result
      setGeneratedCertificate(result);

      // Console log the image URLs
      if (result.imageUrl) {
        console.log('\n╔═══════════════════════════════════════════════════════════════╗');
        console.log('║           🎨 CERTIFICATE GENERATED SUCCESSFULLY               ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝');
        console.log('📍 IPFS IMAGE URL:');
        console.log(`   ${result.imageUrl}`);
        console.log('\n🔗 IPFS HASH:');
        console.log(`   ${result.ipfsHash}`);
        console.log('\n📦 METADATA URI:');
        console.log(`   ${result.metadataUri}`);
        console.log('\n🎫 TOKEN ID:');
        console.log(`   ${result.tokenId}`);
        console.log('\n📝 TRANSACTION HASH:');
        console.log(`   ${result.transactionHash}`);
        console.log('╚═══════════════════════════════════════════════════════════════╝\n');
      }

      toast.success(`Certificate #${result.tokenId} issued successfully!`, { 
        id: loadingToast,
        duration: 5000 
      });

      // Reset form
      setRecipientName('');
      setRecipientAddress('');
      setGrade('');
      setDescription('');

      // Reload stats
      loadStats();

    } catch (error) {
      console.error('Error issuing certificate:', error);
      toast.error('Failed to issue certificate: ' + error.message, { id: loadingToast });
    } finally {
      setIsProcessing(false);
    }
  };

  // Verify certificate
  const handleVerifyCertificate = async (e) => {
    e.preventDefault();
    
    if (!verifyTokenId) {
      toast.error('Please enter a token ID');
      return;
    }

    const loadingToast = toast.loading('Verifying certificate...');

    try {
      const result = await verifyCertificate(verifyTokenId);
      setVerificationResult(result);
      
      if (result.isValid) {
        toast.success('Certificate is valid! ✓', { id: loadingToast });
        
        if (result.imageUrl) {
          console.log('\n╔═══════════════════════════════════════════════════════════════╗');
          console.log('║           🎨 CERTIFICATE IMAGE RETRIEVED                      ║');
          console.log('╚═══════════════════════════════════════════════════════════════╝');
          console.log('📍 IPFS IMAGE URL:');
          console.log(`   ${result.imageUrl}`);
          if (result.localImageUrl) {
            console.log('\n💻 LOCAL IMAGE URL:');
            console.log(`   ${result.localImageUrl}`);
          }
          console.log('╚═══════════════════════════════════════════════════════════════╝\n');
        }
      } else {
        toast.error('Certificate is not valid or has been revoked', { id: loadingToast });
      }
    } catch (error) {
      toast.error('Error verifying certificate: ' + error.message, { id: loadingToast });
      setVerificationResult(null);
    }
  };

  // Revoke certificate
  const handleRevokeCertificate = async (e) => {
    e.preventDefault();

    if (!account || !signer) {
      toast.error('Please connect your wallet first!');
      return;
    }

    if (!revokeTokenId) {
      toast.error('Please enter a token ID');
      return;
    }

    if (window.confirm(`Are you sure you want to revoke certificate #${revokeTokenId}?`)) {
      const loadingToast = toast.loading('Preparing revocation...');
      
      try {
        // Step 1: Create message to sign
        const { message, timestamp } = createSignatureMessage('Revoke Certificate', {
          tokenId: revokeTokenId,
          reason: revokeReason || 'Not specified'
        });

        toast.loading('Please sign the message in MetaMask...', { id: loadingToast });

        // Step 2: Request signature
        const signature = await signMessage(message);

        toast.loading('Revoking certificate...', { id: loadingToast });

        // Step 3: Send to backend
        const result = await revokeCertificate(
          revokeTokenId,
          revokeReason,
          signature,
          message,
          account
        );

        toast.success('Certificate revoked successfully!', { id: loadingToast });
        setRevokeTokenId('');
        setRevokeReason('');
        loadStats();
      } catch (error) {
        toast.error('Failed to revoke: ' + error.message, { id: loadingToast });
      }
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
          toast.info('Account changed');
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        window.location.reload();
      });
    }
  }, []);

  return (
    <div className="app">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="header">
        <div className="container">
          <h1>🎓 Blockchain Certificate System</h1>
          <div className="wallet-section">
            {account ? (
              <div className="wallet-info">
                <div className="wallet-details">
                  <span className="address">{account.slice(0, 6)}...{account.slice(-4)}</span>
                  <span className="balance">{parseFloat(balance).toFixed(4)} ETH</span>
                  {chainId !== '31337' && (
                    <button onClick={switchToLocalhost} className="btn-warning btn-sm">
                      Switch to Localhost
                    </button>
                  )}
                </div>
                <button onClick={disconnectWallet} className="btn-secondary">
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={connectWallet} 
                disabled={isConnecting}
                className="btn-primary"
              >
                {isConnecting ? 'Connecting...' : '🦊 Connect MetaMask'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container main-content">
        {/* Statistics Dashboard */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Minted</h3>
              <p className="stat-value">{stats.totalMinted}</p>
            </div>
            <div className="stat-card">
              <h3>Contract Owner</h3>
              <p className="stat-value small">{stats.contractOwner.slice(0, 10)}...</p>
            </div>
            <div className="stat-card">
              <h3>Network</h3>
              <p className="stat-value">{stats.network}</p>
            </div>
          </div>
        )}

        {/* Certificate Issuance Form */}
        <div className="card">
          <h2>📝 Issue New Certificate (Admin Only)</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Only the contract owner can issue certificates. You'll need to sign a message with your wallet.
          </p>
          <form onSubmit={handleIssueCertificate} className="form">
            <div className="form-row">
              <div className="form-group">
                <label>Recipient Name *</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="form-group">
                <label>Recipient Address *</label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Grade *</label>
                <select 
                  value={grade} 
                  onChange={(e) => setGrade(e.target.value)}
                  required
                >
                  <option value="">Select Grade</option>
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B">B</option>
                  <option value="B-">B-</option>
                  <option value="C+">C+</option>
                  <option value="C">C</option>
                  <option value="Pass">Pass</option>
                </select>
              </div>

              <div className="form-group">
                <label>Issuer</label>
                <input
                  type="text"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="Blockchain University"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Certificate description..."
                rows="3"
              />
            </div>

            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
              <p style={{ margin: 0, color: '#666' }}>
                ℹ️ The certificate image will be automatically generated with the provided details.
                No image upload required!
              </p>
            </div>

            <button 
              type="submit" 
              className="btn-primary btn-large"
              disabled={!account || isProcessing}
            >
              {isProcessing ? 'Processing...' : '🔐 Sign & Issue Certificate'}
            </button>
          </form>

          {/* Display Generated Certificate Result */}
          {generatedCertificate && (
            <div className="generated-certificate-result" style={{
              marginTop: '30px',
              padding: '20px',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              border: '2px solid #0ea5e9',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ 
                color: '#0369a1', 
                marginTop: 0,
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                ✅ Certificate Generated Successfully!
              </h3>

              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '8px 0', color: '#0c4a6e' }}>
                  <strong>🎫 Token ID:</strong> 
                  <span style={{ 
                    marginLeft: '10px',
                    padding: '4px 12px',
                    background: '#0ea5e9',
                    color: 'white',
                    borderRadius: '6px',
                    fontWeight: 'bold'
                  }}>
                    #{generatedCertificate.tokenId}
                  </span>
                </p>
              </div>

              <div style={{ 
                background: 'white', 
                padding: '15px', 
                borderRadius: '8px',
                marginBottom: '15px',
                border: '1px solid #bae6fd'
              }}>
                <h4 style={{ marginTop: 0, color: '#0369a1' }}>📸 Certificate Image</h4>
                
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ margin: '5px 0', color: '#475569', fontSize: '14px' }}>
                    <strong>IPFS URL:</strong>
                  </p>
                  <a 
                    href={generatedCertificate.imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      color: '#0ea5e9',
                      wordBreak: 'break-all',
                      fontSize: '13px',
                      textDecoration: 'none',
                      display: 'block',
                      padding: '8px',
                      background: '#f0f9ff',
                      borderRadius: '4px',
                      border: '1px solid #bae6fd'
                    }}
                  >
                    🔗 {generatedCertificate.imageUrl}
                  </a>
                </div>

                {generatedCertificate.ipfsHash && (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ margin: '5px 0', color: '#475569', fontSize: '14px' }}>
                      <strong>IPFS Hash:</strong>
                    </p>
                    <code style={{
                      display: 'block',
                      padding: '8px',
                      background: '#f0f9ff',
                      borderRadius: '4px',
                      border: '1px solid #bae6fd',
                      fontSize: '13px',
                      wordBreak: 'break-all',
                      color: '#0c4a6e'
                    }}>
                      {generatedCertificate.ipfsHash}
                    </code>
                  </div>
                )}

                {generatedCertificate.imageUrl && (
                  <div style={{ marginTop: '15px' }}>
                    <p style={{ margin: '5px 0 10px 0', color: '#475569', fontSize: '14px' }}>
                      <strong>Preview:</strong>
                    </p>
                    <img 
                      src={generatedCertificate.imageUrl}
                      alt="Generated Certificate"
                      style={{
                        maxWidth: '100%',
                        border: '3px solid #0ea5e9',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)',
                        display: 'block'
                      }}
                      onError={(e) => {
                        console.error('Failed to load certificate image');
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ 
                background: 'white', 
                padding: '15px', 
                borderRadius: '8px',
                marginBottom: '15px',
                border: '1px solid #bae6fd'
              }}>
                <h4 style={{ marginTop: 0, color: '#0369a1' }}>📋 Transaction Details</h4>
                
                <p style={{ margin: '8px 0', color: '#475569', fontSize: '14px' }}>
                  <strong>Transaction Hash:</strong>
                </p>
                <code style={{
                  display: 'block',
                  padding: '8px',
                  background: '#f0f9ff',
                  borderRadius: '4px',
                  border: '1px solid #bae6fd',
                  fontSize: '13px',
                  wordBreak: 'break-all',
                  color: '#0c4a6e',
                  marginBottom: '10px'
                }}>
                  {generatedCertificate.transactionHash}
                </code>

                {generatedCertificate.metadataUri && (
                  <>
                    <p style={{ margin: '8px 0', color: '#475569', fontSize: '14px' }}>
                      <strong>Metadata URI:</strong>
                    </p>
                    <code style={{
                      display: 'block',
                      padding: '8px',
                      background: '#f0f9ff',
                      borderRadius: '4px',
                      border: '1px solid #bae6fd',
                      fontSize: '13px',
                      wordBreak: 'break-all',
                      color: '#0c4a6e'
                    }}>
                      {generatedCertificate.metadataUri}
                    </code>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCertificate.imageUrl);
                    toast.success('Image URL copied to clipboard!');
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#0ea5e9',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  📋 Copy Image URL
                </button>
                <button
                  onClick={() => window.open(generatedCertificate.imageUrl, '_blank')}
                  style={{
                    padding: '10px 20px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  🔗 Open in New Tab
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Verify Certificate */}
        <div className="card">
          <h2>✓ Verify Certificate</h2>
          <form onSubmit={handleVerifyCertificate} className="form">
            <div className="form-row">
              <div className="form-group">
                <label>Token ID</label>
                <input
                  type="number"
                  value={verifyTokenId}
                  onChange={(e) => setVerifyTokenId(e.target.value)}
                  placeholder="Enter token ID to verify"
                />
              </div>
              <button type="submit" className="btn-primary">
                Verify
              </button>
            </div>

            {verificationResult && (
              <div className={`verification-result ${verificationResult.isValid ? 'valid' : 'invalid'}`}>
                <h3>Verification Result</h3>
                <p><strong>Status:</strong> {verificationResult.status}</p>
                {verificationResult.isValid && (
                  <>
                    <p><strong>Token ID:</strong> {verificationResult.tokenId}</p>
                    <p><strong>Owner:</strong> {verificationResult.owner}</p>
                    <p><strong>Minted:</strong> {new Date(verificationResult.mintedAt).toLocaleString()}</p>
                    <p><strong>Revoked:</strong> {verificationResult.revoked ? 'Yes' : 'No'}</p>
                    
                    {verificationResult.metadata && (
                      <div style={{ marginTop: '15px' }}>
                        <h4>Certificate Details</h4>
                        <p><strong>Name:</strong> {verificationResult.metadata.name}</p>
                        <p><strong>Description:</strong> {verificationResult.metadata.description}</p>
                        {verificationResult.metadata.attributes && (
                          <div>
                            <strong>Attributes:</strong>
                            <ul style={{ marginTop: '5px' }}>
                              {verificationResult.metadata.attributes.map((attr, index) => (
                                <li key={index}>
                                  {attr.trait_type}: {attr.value}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {verificationResult.imageUrl && (
                      <div style={{ marginTop: '20px' }}>
                        <h4>Certificate Image</h4>
                        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                          <p><strong>IPFS URL:</strong></p>
                          <a 
                            href={verificationResult.imageUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#4CAF50', wordBreak: 'break-all' }}
                          >
                            {verificationResult.imageUrl}
                          </a>
                        </div>
                        {verificationResult.localImageUrl && (
                          <div style={{ marginBottom: '10px' }}>
                            <p><strong>Local URL:</strong></p>
                            <a 
                              href={verificationResult.localImageUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: '#2196F3', wordBreak: 'break-all' }}
                            >
                              {verificationResult.localImageUrl}
                            </a>
                          </div>
                        )}
                        <img 
                          src={verificationResult.localImageUrl || verificationResult.imageUrl} 
                          alt="Certificate" 
                          style={{ 
                            maxWidth: '100%', 
                            border: '2px solid #4CAF50',
                            borderRadius: '8px',
                            marginTop: '10px',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                          }}
                          onError={(e) => {
                            console.error('Failed to load image, trying IPFS URL...');
                            if (e.target.src !== verificationResult.imageUrl) {
                              e.target.src = verificationResult.imageUrl;
                            }
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Revoke Certificate */}
        <div className="card">
          <h2>🚫 Revoke Certificate (Admin Only)</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Only the contract owner can revoke certificates. You'll need to sign a message with your wallet.
          </p>
          <form onSubmit={handleRevokeCertificate} className="form">
            <div className="form-row">
              <div className="form-group">
                <label>Token ID</label>
                <input
                  type="number"
                  value={revokeTokenId}
                  onChange={(e) => setRevokeTokenId(e.target.value)}
                  placeholder="Enter token ID to revoke"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Reason</label>
              <input
                type="text"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Reason for revocation"
              />
            </div>
            <button 
              type="submit" 
              className="btn-danger"
              disabled={!account}
            >
              🔐 Sign & Revoke Certificate
            </button>
          </form>
        </div>
      </main>

      <footer className="footer">
        <p>Blockchain Certificate System © 2025 - Admin Protected</p>
      </footer>
    </div>
  );
}

export default App;
