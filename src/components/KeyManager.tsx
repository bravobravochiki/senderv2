import React, { useState } from 'react';
import { Key, Trash2, Plus, Check, Copy, X, Wallet, Save, Eye, EyeOff } from 'lucide-react';
import { ethers } from 'ethers';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import { credentialManager } from '../utils/storage';

interface KeyManagerProps {
  onKeySelect: (key: string) => void;
  selectedKey?: string;
}

interface GenerateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: ethers.Wallet;
  onSave: (nickname: string) => void;
}

interface AddressViewerProps {
  address: string;
  isVisible: boolean;
  onToggle: () => void;
}

function AddressViewer({ address, isVisible, onToggle }: AddressViewerProps) {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onToggle}
        className="p-1 text-muted-foreground hover:text-foreground"
        title={isVisible ? 'Hide address' : 'Show address'}
      >
        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      {isVisible && (
        <>
          <code className="text-xs font-mono text-muted-foreground">
            {address.slice(0, 6)}...{address.slice(-4)}
          </code>
          <button
            onClick={copyToClipboard}
            className="p-1 text-muted-foreground hover:text-foreground"
            title="Copy address"
          >
            <Copy className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}

function GenerateKeyModal({ isOpen, onClose, wallet, onSave }: GenerateKeyModalProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [nickname, setNickname] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      generateQRCode();
    }
  }, [isOpen]);

  const generateQRCode = async () => {
    try {
      setIsLoading(true);
      const qr = await QRCode.toDataURL(wallet.address, {
        width: 256,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrCode(qr);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleSave = () => {
    if (!nickname.trim()) {
      toast.error('Please enter a nickname for the wallet');
      return;
    }
    onSave(nickname);
    setShowSaveForm(false);
    setNickname('');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Generated Wallet</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Wallet Address</label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-2 bg-muted rounded-md font-mono text-sm break-all">
                {wallet.address}
              </code>
              <button
                onClick={() => copyToClipboard(wallet.address)}
                className="p-2 hover:text-primary"
                title="Copy address"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Private Key</label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-2 bg-muted rounded-md font-mono text-sm break-all">
                {wallet.privateKey}
              </code>
              <button
                onClick={() => copyToClipboard(wallet.privateKey)}
                className="p-2 hover:text-primary"
                title="Copy private key"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <label className="block text-sm font-medium">QR Code</label>
            {isLoading ? (
              <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <img
                src={qrCode}
                alt="Wallet Address QR Code"
                className="w-64 h-64 rounded-lg"
              />
            )}
          </div>

          {showSaveForm ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Wallet Nickname</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g., Trading Wallet 1"
                  className="input-field"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowSaveForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!nickname.trim()}
                  className="btn-primary"
                >
                  Save Wallet
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end space-x-3">
              <button onClick={onClose} className="btn-secondary">
                Close
              </button>
              <button
                onClick={() => setShowSaveForm(true)}
                className="btn-primary flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function KeyManager({ onKeySelect, selectedKey }: KeyManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [nickname, setNickname] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [keys, setKeys] = useState(credentialManager.getCredentials('privateKey'));
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatedWallet, setGeneratedWallet] = useState<ethers.Wallet | null>(null);
  const [visibleAddresses, setVisibleAddresses] = useState<Record<string, boolean>>({});

  const toggleAddressVisibility = (id: string) => {
    setVisibleAddresses(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddKey = async () => {
    try {
      // Validate private key
      const wallet = new ethers.Wallet(newKey);
      
      const saved = await credentialManager.saveCredential(newKey, 'privateKey', nickname);
      if (saved) {
        setKeys(credentialManager.getCredentials('privateKey'));
        setNewKey('');
        setNickname('');
        setShowAddForm(false);
        toast.success('Private key added successfully');
      }
    } catch (error: any) {
      toast.error('Invalid private key format');
    }
  };

  const handleDeleteKey = (id: string) => {
    credentialManager.deleteCredential(id, 'privateKey');
    setKeys(credentialManager.getCredentials('privateKey'));
    toast.success('Private key deleted');
  };

  const handleSelectKey = (id: string) => {
    const value = credentialManager.getDecryptedValue(id, 'privateKey');
    onKeySelect(value);
    setIsOpen(false);
  };

  const handleGenerateKey = () => {
    try {
      const wallet = ethers.Wallet.createRandom();
      setGeneratedWallet(wallet);
      setShowGenerateModal(true);
    } catch (error) {
      console.error('Error generating wallet:', error);
      toast.error('Failed to generate wallet');
    }
  };

  const handleSaveGeneratedKey = async (nickname: string) => {
    if (!generatedWallet) return;

    try {
      const saved = await credentialManager.saveCredential(
        generatedWallet.privateKey,
        'privateKey',
        nickname
      );
      
      if (saved) {
        setKeys(credentialManager.getCredentials('privateKey'));
        toast.success('Wallet saved successfully');
        setShowGenerateModal(false);
        setGeneratedWallet(null);
      }
    } catch (error) {
      console.error('Error saving wallet:', error);
      toast.error('Failed to save wallet');
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input-field flex items-center justify-between"
      >
        <div className="flex items-center">
          <Key className="h-5 w-5 text-muted-foreground mr-2" />
          <span>{selectedKey ? 'Private Key Selected' : 'Select Private Key'}</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 card">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Private Keys</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleGenerateKey}
                  className="text-primary hover:text-primary/90 flex items-center"
                >
                  <Wallet className="h-4 w-4 mr-1" />
                  Generate New
                </button>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-primary hover:text-primary/90 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Existing
                </button>
              </div>
            </div>

            {showAddForm && (
              <div className="mb-4 p-4 bg-muted rounded-md">
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">
                    Nickname
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="input-field"
                    placeholder="e.g., Main Wallet"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">
                    Private Key
                  </label>
                  <input
                    type="password"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="input-field"
                    placeholder="Enter private key"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddKey}
                    disabled={!newKey || !nickname}
                    className="btn-primary"
                  >
                    Add Key
                  </button>
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-3 hover:bg-muted rounded-md"
                >
                  <div className="flex-1">
                    <div className="font-medium">{key.nickname}</div>
                    <AddressViewer
                      address={key.address || ''}
                      isVisible={visibleAddresses[key.id]}
                      onToggle={() => toggleAddressVisibility(key.id)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSelectKey(key.id)}
                      className="p-1 text-primary hover:text-primary/90"
                      title="Select key"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteKey(key.id)}
                      className="p-1 text-destructive hover:text-destructive/90"
                      title="Delete key"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {keys.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No private keys stored
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {generatedWallet && (
        <GenerateKeyModal
          isOpen={showGenerateModal}
          onClose={() => {
            setShowGenerateModal(false);
            setGeneratedWallet(null);
          }}
          wallet={generatedWallet}
          onSave={handleSaveGeneratedKey}
        />
      )}
    </div>
  );
}