import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Settings, Send, ExternalLink, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { TokenSelector } from './TokenSelector';
import { KeyManager } from './KeyManager';
import { InfuraModal } from './InfuraModal';
import { GasInfo } from './GasInfo';
import { Header } from './Header';
import { SUPPORTED_TOKENS, TOKEN_ABI } from '../config/tokens';
import type { TokenBalance, Transaction } from '../types';

interface TransactionFormProps {
  onTransactionCreated: (hash: string, token: string) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

interface PendingTransaction {
  hash: string;
  nonce: number;
  token: string;
  timestamp: number;
  gasPrice: bigint;
}

const PENDING_TX_STORAGE_KEY = 'pending_transactions';

export function TransactionForm({ onTransactionCreated, isDarkMode, onThemeToggle }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    infuraUrl: '',
    privateKey: '',
    targetAddress: '',
    amount: '4000'
  });

  const [selectedToken, setSelectedToken] = useState('USDT');
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPendingTx, setHasPendingTx] = useState(false);
  const [pendingNonce, setPendingNonce] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Array<{ hash: string, token: string }>>([]);
  const [showInfuraModal, setShowInfuraModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(PENDING_TX_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setPendingTransactions(parsed.map((tx: any) => ({
        ...tx,
        gasPrice: BigInt(tx.gasPrice)
      })));
    }
  }, []);

  useEffect(() => {
    if (pendingTransactions.length > 0) {
      localStorage.setItem(PENDING_TX_STORAGE_KEY, JSON.stringify(
        pendingTransactions.map(tx => ({
          ...tx,
          gasPrice: tx.gasPrice.toString()
        }))
      ));
    } else {
      localStorage.removeItem(PENDING_TX_STORAGE_KEY);
    }
  }, [pendingTransactions]);

  useEffect(() => {
    if (!formData.infuraUrl || !formData.privateKey || pendingTransactions.length === 0) return;

    const checkPendingTransactions = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(formData.infuraUrl);
        const wallet = new ethers.Wallet(formData.privateKey, provider);
        
        const currentNonce = await provider.getTransactionCount(wallet.address, 'latest');
        const pendingNonce = await provider.getTransactionCount(wallet.address, 'pending');
        
        const hasPending = pendingNonce > currentNonce;
        setHasPendingTx(hasPending);
        
        if (hasPending) {
          setPendingNonce(currentNonce);
        } else {
          setPendingNonce(null);
          setPendingTransactions([]);
        }

        const updatedPending = [];
        for (const tx of pendingTransactions) {
          const txReceipt = await provider.getTransactionReceipt(tx.hash);
          if (!txReceipt) {
            updatedPending.push(tx);
          }
        }
        
        setPendingTransactions(updatedPending);
      } catch (error) {
        console.error('Error checking pending transactions:', error);
      }
    };

    const interval = setInterval(checkPendingTransactions, 10000);
    return () => clearInterval(interval);
  }, [formData.infuraUrl, formData.privateKey, pendingTransactions]);

  useEffect(() => {
    const checkStatus = async () => {
      if (!formData.infuraUrl || !formData.privateKey) return;

      try {
        const provider = new ethers.JsonRpcProvider(formData.infuraUrl);
        const wallet = new ethers.Wallet(formData.privateKey, provider);
        
        const pendingCount = await provider.getTransactionCount(wallet.address, 'pending');
        const confirmedCount = await provider.getTransactionCount(wallet.address, 'latest');
        
        const hasPending = pendingCount > confirmedCount;
        setHasPendingTx(hasPending);
        
        if (hasPending) {
          setPendingNonce(confirmedCount);
        } else {
          setPendingNonce(null);
        }

        const tokenConfig = SUPPORTED_TOKENS[selectedToken];
        const tokenContract = new ethers.Contract(tokenConfig.address, TOKEN_ABI, provider);
        const rawBalance = await tokenContract.balanceOf(wallet.address);
        
        setBalance({
          raw: rawBalance,
          formatted: ethers.formatUnits(rawBalance, tokenConfig.decimals)
        });
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };

    checkStatus();
  }, [formData.infuraUrl, formData.privateKey, selectedToken]);

  const handleTokenChange = (token: string) => {
    setSelectedToken(token);
    setFormData(prev => ({ ...prev, amount: '4000' }));
  };

  const handleViewTransaction = async (hash: string) => {
    if (!hash) {
      toast.error('No transaction hash available');
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider(formData.infuraUrl);
      const tx = await provider.getTransaction(hash);
      
      if (!tx) {
        toast.error('Transaction not found');
        return;
      }

      window.open(`https://etherscan.io/tx/${hash}`, '_blank');
    } catch (error: any) {
      toast.error('Error fetching transaction: ' + error.message);
    }
  };

  const handleCancel = async () => {
    if (pendingTransactions.length === 0) {
      toast.error('No pending transactions to cancel');
      return;
    }

    if (isCancelling) {
      toast.error('Cancellation already in progress');
      return;
    }

    setIsCancelling(true);
    
    try {
      const provider = new ethers.JsonRpcProvider(formData.infuraUrl);
      const wallet = new ethers.Wallet(formData.privateKey, provider);
      
      const feeData = await provider.getFeeData();
      const baseGasPrice = feeData.gasPrice || ethers.parseUnits('50', 'gwei');
      
      const oldestPending = pendingTransactions[0];
      
      const cancelGasPrice = baseGasPrice > oldestPending.gasPrice 
        ? baseGasPrice * BigInt(2)
        : oldestPending.gasPrice * BigInt(2);
      
      const network = await provider.getNetwork();
      
      const cancelTx = {
        from: wallet.address,
        to: wallet.address,
        nonce: oldestPending.nonce,
        value: 0n,
        gasLimit: 21000n,
        gasPrice: cancelGasPrice,
        chainId: Number(network.chainId)
      };

      const txResponse = await wallet.sendTransaction(cancelTx);
      
      toast.success('Cancellation transaction sent! Waiting for confirmation...', {
        duration: 5000
      });
      
      const receipt = await provider.waitForTransaction(txResponse.hash, 1);
      
      if (receipt && receipt.status === 1) {
        setPendingTransactions(prev => prev.filter(tx => tx.nonce !== oldestPending.nonce));
        
        toast.success('Transaction successfully cancelled!');
        setHasPendingTx(false);
        setPendingNonce(null);
        
        setTransactions(prev => [{
          hash: txResponse.hash,
          token: 'CANCEL'
        }, ...prev]);
      } else {
        throw new Error('Cancellation transaction failed');
      }
    } catch (error: any) {
      console.error('Cancel transaction error:', error);
      toast.error(
        'Failed to cancel transaction: ' + 
        (error.message || 'Unknown error. Please try again with a higher gas price.')
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      toast.error('Transaction is already being processed');
      return;
    }

    if (hasPendingTx) {
      toast.error('Please cancel the pending transaction before creating a new one');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const provider = new ethers.JsonRpcProvider(formData.infuraUrl);
      const wallet = new ethers.Wallet(formData.privateKey, provider);
      
      const tokenConfig = SUPPORTED_TOKENS[selectedToken];
      const tokenContract = new ethers.Contract(tokenConfig.address, TOKEN_ABI, wallet);
      
      const amount = ethers.parseUnits(formData.amount, tokenConfig.decimals);
      const nonce = await wallet.getNonce();
      const gasPrice = ethers.parseUnits('0.1', 'gwei');

      const tx = await tokenContract.transfer.populateTransaction(formData.targetAddress, amount);
      
      const populatedTx = {
        ...tx,
        nonce,
        gasPrice,
        gasLimit: 100000,
        chainId: (await provider.getNetwork()).chainId
      };

      const signedTx = await wallet.signTransaction(populatedTx);
      const txResponse = await provider.broadcastTransaction(signedTx);
      
      const newPendingTx: PendingTransaction = {
        hash: txResponse.hash,
        nonce,
        token: selectedToken,
        timestamp: Date.now(),
        gasPrice
      };
      
      setPendingTransactions(prev => [...prev, newPendingTx]);
      setHasPendingTx(true);
      setPendingNonce(nonce);
      onTransactionCreated(txResponse.hash, selectedToken);
      setTransactions(prev => [...prev, { hash: txResponse.hash, token: selectedToken }]);
      
      toast.success('Transaction broadcasted successfully! It will remain pending.');
      toast('Note: This transaction will stay pending due to very low gas price and insufficient ' + selectedToken + ' balance.', {
        duration: 6000,
        icon: '⚠️'
      });
      
    } catch (error: any) {
      console.error('Transaction error:', error);
      
      if (error.code === 'UNKNOWN_ERROR' && error.error?.message?.includes('already known')) {
        toast.error('This transaction is already in the mempool. Please wait for it to be processed.');
      } else if (error.message?.includes('pending transaction')) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create transaction: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <Header isDarkMode={isDarkMode} onThemeToggle={onThemeToggle} />
            <button
              type="button"
              onClick={() => setShowInfuraModal(true)}
              className="btn-secondary"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure Infura
            </button>
          </div>
        </div>

        <div className="card-content space-y-6">
          <GasInfo />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-sm font-medium mb-2">Private Key</label>
              <KeyManager
                selectedKey={formData.privateKey}
                onKeySelect={(value) => setFormData(prev => ({ ...prev, privateKey: value }))}
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="block text-sm font-medium mb-2">Target Address</label>
              <input
                type="text"
                value={formData.targetAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAddress: e.target.value }))}
                className="input-field"
                placeholder="0x..."
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Token</label>
              <TokenSelector
                selectedToken={selectedToken}
                onTokenSelect={handleTokenChange}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="input-field"
                required
                disabled={isSubmitting}
              />
              {balance && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Balance: {parseFloat(balance.formatted).toFixed(4)} {selectedToken}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isSubmitting || hasPendingTx}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Processing...' : hasPendingTx ? 'Cancel Pending First' : 'Create Pending Transaction'}
            </button>

            {hasPendingTx && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling}
                className="btn-secondary flex-1"
              >
                <Wallet className="h-4 w-4 mr-2" />
                {isCancelling ? 'Cancelling...' : 'Cancel Pending'}
              </button>
            )}
          </div>
        </div>

        {transactions.length > 0 && (
          <div className="border-t border-border">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Recent Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium">Token</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">Transaction Hash</th>
                      <th className="text-right py-3 px-4 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.hash} className="border-b border-border">
                        <td className="py-3 px-4">
                          {tx.token === 'CANCEL' ? (
                            <span className="text-destructive">Cancellation</span>
                          ) : (
                            tx.token
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-sm">{tx.hash}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleViewTransaction(tx.hash)}
                            className="btn-secondary"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </form>

      <InfuraModal
        isOpen={showInfuraModal}
        onClose={() => setShowInfuraModal(false)}
        infuraUrl={formData.infuraUrl}
        onInfuraUrlChange={(url) => setFormData(prev => ({ ...prev, infuraUrl: url }))}
      />
    </div>
  );
}