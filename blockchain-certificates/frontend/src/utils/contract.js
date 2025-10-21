import { ethers } from 'ethers';
import { CONTRACT_ABI } from './contractABI';

// Get contract address from environment variable or use default localhost deployment
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export const getContract = (signerOrProvider) => {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
};

export const getProvider = () => {
  if (window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  throw new Error('MetaMask not installed');
};

export const getSigner = async () => {
  const provider = getProvider();
  return await provider.getSigner();
};

export { CONTRACT_ADDRESS, CONTRACT_ABI };