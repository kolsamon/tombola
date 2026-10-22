import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import ADDRESSES from '../contracts/addresses.json';

const CHAIN = ADDRESSES.bscTestnet;

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask non détecté. Veuillez installer MetaMask.');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await web3Provider.getNetwork();

      if (network.chainId !== CHAIN.chainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ethers.utils.hexValue(CHAIN.chainId) }],
          });
        } catch (switchErr) {
          if (switchErr.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: ethers.utils.hexValue(CHAIN.chainId),
                chainName: 'BSC Testnet',
                nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                rpcUrls: [CHAIN.rpc],
                blockExplorerUrls: ['https://testnet.bscscan.com'],
              }],
            });
          } else {
            throw switchErr;
          }
        }
      }

      const freshProvider = new ethers.providers.Web3Provider(window.ethereum);
      const freshSigner = freshProvider.getSigner();
      const address = await freshSigner.getAddress();
      const freshNetwork = await freshProvider.getNetwork();

      setProvider(freshProvider);
      setSigner(freshSigner);
      setAccount(address);
      setChainId(freshNetwork.chainId);
    } catch (err) {
      setError(err.message || 'Connexion échouée');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) disconnect();
      else setAccount(accounts[0]);
    };
    const handleChainChanged = () => window.location.reload();

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Auto-reconnect if already connected
    window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
      if (accounts.length > 0) connect();
    });

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [connect, disconnect]);

  const isCorrectChain = chainId === CHAIN.chainId;

  return { account, provider, signer, chainId, isCorrectChain, connecting, error, connect, disconnect };
}
