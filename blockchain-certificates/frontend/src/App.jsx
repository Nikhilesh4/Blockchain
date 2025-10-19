import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast, { Toaster } from 'react-hot-toast';
import { uploadImage, generateMetadata, mintCertificate, getStats, verifyCertificate, revokeCertificate } from './utils/api';
import './App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Form states
  const [recipientName, setRecipientName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [grade, setGrade] = useState('');
  const [issuer, setIssuer] = useState('Blockchain University');
  const [certificateImage, setCertificateImage] = useState(null);
  const [description, setDescription] = useState('');

  // UI states
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState(null);
  const [verifyTokenId, setVerifyTokenId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [revokeTokenId, setRevokeTokenId] = useState('');
  const [revokeReason, setRevokeReason] = useState('');

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
      const signer = await provider.getSigner();
      const balance = await provider.getBalance(accounts[0]);

      setAccount(accounts[0]);
      setBalance(ethers.formatEther(balance));
      setChainId(network.chainId.toString());

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

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }
      setCertificateImage(file);
      toast.success('Image selected: ' + file.name);
    }
  };

  // Issue certificate
  const handleIssueCertificate = async (e) => {
    e.preventDefault();

    if (!account) {
      toast.error('Please connect your wallet first!');
      return;
    }

    if (!certificateImage) {
      toast.error('Please upload a certificate template image!');
      return;
    }

    if (!ethers.isAddress(recipientAddress)) {
      toast.error('Invalid recipient address!');
      return;
    }

    setIsProcessing(true);
    const loadingToast = toast.loading('Processing certificate issuance...');

    try {
      // Step 1: Upload image to IPFS
      toast.loading('Uploading image to IPFS...', { id: loadingToast });
      const imageResult = await uploadImage(certificateImage);
      console.log('Image uploaded:', imageResult);

      // Step 2: Generate and upload metadata
      toast.loading('Generating metadata...', { id: loadingToast });
      const metadataInfo = {
        name: `Certificate - ${recipientName}`,
        description: description || `Certificate for ${recipientName} with grade ${grade}`,
        imageUrl: imageResult.imageUrl,
        issuer: issuer,
        attributes: [
          { trait_type: 'Recipient Name', value: recipientName },
          { trait_type: 'Grade', value: grade },
          { trait_type: 'Issue Date', value: new Date().toISOString() },
          { trait_type: 'Verified', value: 'True' }
        ]
      };

      const metadataResult = await generateMetadata(metadataInfo);
      console.log('Metadata generated:', metadataResult);

      // Step 3: Mint certificate NFT
      toast.loading('Minting certificate on blockchain...', { id: loadingToast });
      const mintResult = await mintCertificate(recipientAddress, metadataResult.metadataUrl);
      console.log('Certificate minted:', mintResult);

      toast.success(`Certificate #${mintResult.tokenId} issued successfully!`, { 
        id: loadingToast,
        duration: 5000 
      });

      // Reset form
      setRecipientName('');
      setRecipientAddress('');
      setGrade('');
      setDescription('');
      setCertificateImage(null);
      document.getElementById('imageInput').value = '';

      // Reload stats
      loadStats();

      // Show transaction details
      toast.success(
        <div>
          <p><strong>Transaction Hash:</strong></p>
          <p className="text-xs">{mintResult.transactionHash}</p>
        </div>,
        { duration: 10000 }
      );

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

    try {
      const result = await verifyCertificate(verifyTokenId);
      setVerificationResult(result);
      
      if (result.isValid) {
        toast.success('Certificate is valid! ✓');
      } else {
        toast.error('Certificate is not valid or has been revoked');
      }
    } catch (error) {
      toast.error('Error verifying certificate: ' + error.message);
      setVerificationResult(null);
    }
  };

  // Revoke certificate
  const handleRevokeCertificate = async (e) => {
    e.preventDefault();

    if (!account) {
      toast.error('Please connect your wallet first!');
      return;
    }

    if (!revokeTokenId) {
      toast.error('Please enter a token ID');
      return;
    }

    if (window.confirm(`Are you sure you want to revoke certificate #${revokeTokenId}?`)) {
      try {
        toast.loading('Revoking certificate...');
        const result = await revokeCertificate(revokeTokenId, revokeReason);
        toast.success('Certificate revoked successfully!');
        setRevokeTokenId('');
        setRevokeReason('');
        loadStats();
      } catch (error) {
        toast.error('Failed to revoke: ' + error.message);
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
              <h3>Contract</h3>
              <p className="stat-value small">{stats.contractAddress.slice(0, 10)}...</p>
            </div>
            <div className="stat-card">
              <h3>Network</h3>
              <p className="stat-value">{stats.network}</p>
            </div>
          </div>
        )}

        {/* Certificate Issuance Form */}
        <div className="card">
          <h2>📝 Issue New Certificate</h2>
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

            <div className="form-group">
              <label>Certificate Template Image *</label>
              <input
                id="imageInput"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                required
              />
              {certificateImage && (
                <p className="file-info">Selected: {certificateImage.name}</p>
              )}
            </div>

            <button 
              type="submit" 
              className="btn-primary btn-large"
              disabled={!account || isProcessing}
            >
              {isProcessing ? 'Processing...' : '🔐 Issue Certificate'}
            </button>
          </form>
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
                    <p><strong>Owner:</strong> {verificationResult.owner}</p>
                    <p><strong>Minted:</strong> {new Date(verificationResult.mintedAt).toLocaleString()}</p>
                    <p><strong>Revoked:</strong> {verificationResult.revoked ? 'Yes' : 'No'}</p>
                  </>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Revoke Certificate */}
        <div className="card">
          <h2>🚫 Revoke Certificate</h2>
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
              Revoke Certificate
            </button>
          </form>
        </div>
      </main>

      <footer className="footer">
        <p>Blockchain Certificate System © 2025</p>
      </footer>
    </div>
  );
}

export default App;