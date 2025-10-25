import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast, { Toaster } from 'react-hot-toast';
import { 
  useMintCertificate, 
  useRevokeCertificate, 
  useVerifyCertificate, 
  useContractStats 
} from './utils/contractHooks';
import { testPinataConnection } from './utils/ipfsUpload';
import { getUserPermissions } from './utils/roleManagement';
import AdminDashboard from './components/AdminDashboard';
import MyCertificates from './components/MyCertificates';
import CreateProposal from './components/proposals/CreateProposal';
import './App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [contract, setContract] = useState(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  // Form states
  const [recipientName, setRecipientName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [grade, setGrade] = useState('');
  const [issuer, setIssuer] = useState('Blockchain University');
  const [description, setDescription] = useState('');

  // UI states
  const [stats, setStats] = useState(null);
  const [verifyTokenId, setVerifyTokenId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [revokeTokenId, setRevokeTokenId] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [generatedCertificate, setGeneratedCertificate] = useState(null);
  const [activeView, setActiveView] = useState('main'); // 'main', 'my-certificates', 'admin'
  const [pinataConnected, setPinataConnected] = useState(false);

  // Custom hooks
  const { mintCertificate, isLoading: isMinting, progress: mintProgress, uploadProgress } = useMintCertificate();
  const { revokeCertificate, isLoading: isRevoking, progress: revokeProgress } = useRevokeCertificate();
  const { verifyCertificate, isLoading: isVerifying } = useVerifyCertificate();
  const { getStats, isLoading: isLoadingStats } = useContractStats();

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined';
  };

  // Test Pinata connection on mount
  useEffect(() => {
    testPinataConnection().then(connected => {
      setPinataConnected(connected);
      if (connected) {
        toast.success('Pinata IPFS connection verified ✓');
      } else {
        toast.error('Pinata IPFS not configured. Please add API keys to .env file');
      }
    });
  }, []);

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      toast.error('Please install MetaMask to use this application!');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      // Request account access with account selection prompt
      // Using wallet_requestPermissions to force account selection dialog
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });

      // Get the selected account
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const network = await web3Provider.getNetwork();
      const walletSigner = await web3Provider.getSigner();
      const balance = await web3Provider.getBalance(accounts[0]);

      setAccount(accounts[0]);
      setBalance(ethers.formatEther(balance));
      setChainId(network.chainId.toString());
      setSigner(walletSigner);
      setProvider(web3Provider);

      toast.success('Wallet connected successfully!');
      loadStats(web3Provider);
      
      // Load user permissions with signer for transactions
      await loadUserPermissions(accounts[0], walletSigner);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Load user permissions
  const loadUserPermissions = async (userAccount, signerOrProvider) => {
    try {
      // Get contract instance
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
      const contractABI = (await import('./contracts/CertificateNFT.js')).default;
      const contractInstance = new ethers.Contract(contractAddress, contractABI, signerOrProvider);
      
      setContract(contractInstance);
      
      const permissions = await getUserPermissions(contractInstance, userAccount);
      setUserPermissions(permissions);
      
      if (permissions.isAdmin) {
        toast.success('Admin access detected! 🔐');
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      // Don't show error to user, just log it
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setBalance('0');
    setChainId(null);
    setSigner(null);
    setProvider(null);
    setUserPermissions(null);
    setContract(null);
    setShowAdminDashboard(false);
    toast.success('Wallet disconnected');
  };

  // Get network config from environment variables
  const getNetworkConfig = () => {
    const networkName = import.meta.env.VITE_NETWORK_NAME || 'localhost';
    const chainId = import.meta.env.VITE_CHAIN_ID || '31337';
    const rpcUrl = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545';
    
    const configs = {
      localhost: {
        chainId: '0x7A69', // 31337 in hex
        chainName: 'Hardhat Local',
        rpcUrl: 'http://127.0.0.1:8545',
        blockExplorer: null,
      },
      sepolia: {
        chainId: '0xaa36a7', // 11155111 in hex
        chainName: 'Sepolia Testnet',
        rpcUrl: rpcUrl,
        blockExplorer: 'https://sepolia.etherscan.io',
      },
      mainnet: {
        chainId: '0x1', // 1 in hex
        chainName: 'Ethereum Mainnet',
        rpcUrl: rpcUrl,
        blockExplorer: 'https://etherscan.io',
      },
    };

    return configs[networkName] || configs.localhost;
  };

  // Switch to configured network
  const switchToNetwork = async () => {
    const networkConfig = getNetworkConfig();
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      });
      toast.success(`Switched to ${networkConfig.chainName}`);
    } catch (error) {
      // Network doesn't exist, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: networkConfig.chainId,
              chainName: networkConfig.chainName,
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: [networkConfig.rpcUrl],
              blockExplorerUrls: networkConfig.blockExplorer ? [networkConfig.blockExplorer] : undefined,
            }],
          });
          toast.success(`${networkConfig.chainName} added and switched`);
        } catch (addError) {
          toast.error(`Failed to add ${networkConfig.chainName}`);
        }
      } else {
        toast.error('Failed to switch network');
      }
    }
  };

  // Load statistics
  const loadStats = async (web3Provider = provider) => {
    if (!web3Provider) return;
    
    try {
      const data = await getStats(web3Provider);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load statistics');
    }
  };

  // Issue certificate
  const handleIssueCertificate = async (e) => {
    e.preventDefault();

    if (!account || !signer) {
      toast.error('Please connect your wallet first!');
      return;
    }

    if (!pinataConnected) {
      toast.error('Pinata IPFS is not configured. Please add API keys to .env file');
      return;
    }

    if (!ethers.isAddress(recipientAddress)) {
      toast.error('Invalid recipient address!');
      return;
    }

    setGeneratedCertificate(null); // Reset previous result

    try {
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

      const result = await mintCertificate(certificateData, signer);

      // Store the generated certificate result
      setGeneratedCertificate(result);

      // Console log the result
      console.log('\n╔═══════════════════════════════════════════════════════════════╗');
      console.log('║           🎨 CERTIFICATE GENERATED SUCCESSFULLY               ║');
      console.log('╚═══════════════════════════════════════════════════════════════╝');
      console.log('📍 IPFS IMAGE URL:');
      console.log(`   ${result.imageUrl}`);
      console.log('\n🔗 IPFS HASH:');
      console.log(`   ${result.imageIpfsHash}`);
      console.log('\n📦 METADATA URI:');
      console.log(`   ${result.metadataUri}`);
      console.log('\n🎫 TOKEN ID:');
      console.log(`   ${result.tokenId}`);
      console.log('\n📝 TRANSACTION HASH:');
      console.log(`   ${result.transactionHash}`);
      console.log('╚═══════════════════════════════════════════════════════════════╝\n');

      toast.success(`Certificate #${result.tokenId} issued successfully!`, { 
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
      toast.error('Failed to issue certificate: ' + error.message);
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
      // Use provider if connected, otherwise use a public RPC provider
      let verifyProvider = provider;
      
      if (!verifyProvider) {
        // Create a read-only provider for public verification using configured RPC
        const rpcUrl = import.meta.env.VITE_RPC_URL || 'http://localhost:8545';
        verifyProvider = new ethers.JsonRpcProvider(rpcUrl);
        console.log(`Using public RPC provider for verification: ${rpcUrl} (no wallet needed)`);
      }

      const result = await verifyCertificate(verifyTokenId, verifyProvider);
      setVerificationResult(result);
      
      if (result.isValid) {
        toast.success('Certificate is valid! ✓', { id: loadingToast });
        
        if (result.imageUrl) {
          console.log('\n╔═══════════════════════════════════════════════════════════════╗');
          console.log('║           🎨 CERTIFICATE IMAGE RETRIEVED                      ║');
          console.log('╚═══════════════════════════════════════════════════════════════╝');
          console.log('📍 IPFS IMAGE URL:');
          console.log(`   ${result.imageUrl}`);
          console.log('╚═══════════════════════════════════════════════════════════════╝\n');
        }
      } else {
        toast.error(`Certificate is ${result.status.toLowerCase()}`, { id: loadingToast });
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
      try {
        const result = await revokeCertificate(revokeTokenId, signer);

        toast.success('Certificate revoked successfully!');
        console.log('Revocation result:', result);
        
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
      
      {/* Admin Dashboard View */}
      {activeView === 'admin' && userPermissions?.isAdmin && contract && (
        <div>
          <div style={{
            padding: '10px 20px',
            background: '#f3f4f6',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <button
              onClick={() => setActiveView('main')}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              ← Back to Main App
            </button>
            <h2 style={{ margin: 0, color: '#111827' }}>Admin Dashboard</h2>
            <div style={{ width: '120px' }}></div>
          </div>
          <AdminDashboard contract={contract} currentAccount={account} />
        </div>
      )}

      {/* My Certificates View */}
      {activeView === 'my-certificates' && account && contract && (
        <div>
          <div style={{
            padding: '10px 20px',
            background: '#f3f4f6',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <button
              onClick={() => setActiveView('main')}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              ← Back to Main App
            </button>
            <h2 style={{ margin: 0, color: '#111827' }}>My Certificates</h2>
            <div style={{ width: '120px' }}></div>
          </div>
          <MyCertificates contract={contract} currentAccount={account} provider={provider} />
        </div>
      )}
      
      {/* Main App View */}
      {activeView === 'main' && (
      <>

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
                  {userPermissions && (
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '5px' }}>
                      {userPermissions.roles.map(role => (
                        <span
                          key={role.hash}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: 'white',
                            backgroundColor: role.color,
                            textTransform: 'uppercase'
                          }}
                          title={role.description}
                        >
                          {role.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Check for correct network */}
                  {chainId && chainId !== getNetworkConfig().chainId.toString() && parseInt(chainId, 16).toString() !== getNetworkConfig().chainId.toString() && (
                    <button onClick={switchToNetwork} className="btn-warning btn-sm">
                      Switch to {getNetworkConfig().chainName}
                    </button>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '5px', flexWrap: 'wrap' }}>
                  {/* My Certificates Button - Always visible when connected */}
                  <button
                    onClick={() => setActiveView('my-certificates')}
                    style={{
                      padding: '6px 12px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}
                  >
                    📜 My Certificates
                  </button>
                  
                  {/* Admin Dashboard Button - Only for admins */}
                  {userPermissions?.isAdmin && (
                    <button
                      onClick={() => setActiveView('admin')}
                      style={{
                        padding: '6px 12px',
                        background: '#8b5cf6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}
                    >
                      🔐 Admin Dashboard
                    </button>
                  )}
                </div>
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
        {/* Welcome Message for Non-Connected Users */}
        {!account && (
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: '2px solid #0ea5e9',
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#0369a1', marginTop: 0 }}>
              🎓 Welcome to Blockchain Certificate System
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#0c4a6e', marginBottom: '20px' }}>
              Verify certificates publicly or connect your wallet to access more features
            </p>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginTop: '20px',
              textAlign: 'left'
            }}>
              <div style={{ padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✓</div>
                <strong style={{ color: '#0369a1' }}>Public Verification</strong>
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '5px' }}>
                  Anyone can verify certificates - no wallet needed!
                </p>
              </div>
              <div style={{ padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📝</div>
                <strong style={{ color: '#0369a1' }}>Issue Certificates</strong>
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '5px' }}>
                  Connect wallet with ISSUER role to mint certificates
                </p>
              </div>
              <div style={{ padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🚫</div>
                <strong style={{ color: '#0369a1' }}>Revoke Access</strong>
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '5px' }}>
                  Connect wallet with REVOKER role to revoke certificates
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Connection Status Banner */}
        {!pinataConnected && account && (
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            color: '#856404'
          }}>
            <strong>⚠️ Warning:</strong> Pinata IPFS is not configured. Please add VITE_PINATA_API_KEY and VITE_PINATA_SECRET_API_KEY to your .env file to enable certificate generation.
          </div>
        )}

        {/* Statistics Dashboard */}
        {stats && account && (
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

        {/* Certificate Issuance Section */}
        {account && userPermissions && (
          <>
          {/* ❌ REMOVED: Super Admin direct minting to prevent single point of failure */}

            {/* ADMINs must use proposal system - show CreateProposal component */}
            {userPermissions.isAdmin &&  (
              <div className="card">
                <div style={{
                  background: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '20px'
                }}>
                  <p style={{ margin: 0, color: '#856404', fontWeight: '500' }}>
                    ℹ️ <strong>Note for Admins:</strong> You must create a proposal for certificate issuance. 
                    The certificate will only be minted after the required number of admins approve the proposal.
                  </p>
                </div>
                <CreateProposal 
                  contract={contract}
                  currentAccount={account}
                  userPermissions={userPermissions}
                />
              </div>
            )}
          </>
        )}

        {/* Verify Certificate */}
        <div className="card">
          <h2>✓ Verify Certificate</h2>
          <p className="info-text" style={{ marginBottom: '15px', color: '#10b981', fontSize: '0.9rem' }}>
            ℹ️ No wallet connection required - Anyone can verify certificates!
          </p>
          <form onSubmit={handleVerifyCertificate} className="form">
            <div className="form-row">
              <div className="form-group">
                <label>Token ID</label>
                <input
                  type="number"
                  value={verifyTokenId}
                  onChange={(e) => setVerifyTokenId(e.target.value)}
                  placeholder="Enter token ID to verify"
                  disabled={isVerifying}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={isVerifying}>
                {isVerifying ? 'Verifying...' : 'Verify'}
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
                        <img 
                          src={verificationResult.imageUrl} 
                          alt="Certificate" 
                          style={{ 
                            maxWidth: '100%', 
                            border: '2px solid #4CAF50',
                            borderRadius: '8px',
                            marginTop: '10px',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                          }}
                          onError={(e) => {
                            console.error('Failed to load image from IPFS');
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
                {!verificationResult.isValid && (
                  <p><strong>Reason:</strong> {verificationResult.reason}</p>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Revoke Certificate - Only show if connected and has permission */}
        {account && userPermissions?.canRevoke && (
        <div className="card">
          <h2>🚫 Revoke Certificate</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Only users with REVOKER role or higher can revoke certificates.
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
                  disabled={isRevoking}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Reason (optional)</label>
              <input
                type="text"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Reason for revocation"
                disabled={isRevoking}
              />
            </div>
            
            {isRevoking && (
              <div style={{
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                padding: '10px',
                marginBottom: '15px',
                color: '#856404'
              }}>
                {revokeProgress}
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn-danger"
              disabled={!account || isRevoking || !userPermissions?.canRevoke}
            >
              {isRevoking ? revokeProgress : '🚫 Revoke Certificate'}
            </button>
          </form>
        </div>
        )}
      </main>

      <footer className="footer">
        <p>Blockchain Certificate System © 2025 - Serverless & Decentralized ⚡</p>
        {userPermissions && (
          <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
            Your Access: {userPermissions.canIssue ? '✅ Issue' : '❌ Issue'} | {userPermissions.canRevoke ? '✅ Revoke' : '❌ Revoke'} | {userPermissions.isAdmin ? '✅ Admin' : '❌ Admin'}
          </p>
        )}
      </footer>
      </>
      )}
    </div>
  );
}

export default App;
