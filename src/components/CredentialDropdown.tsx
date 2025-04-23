import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Plus, Trash2, Save, Key, Globe } from 'lucide-react';
import type { SavedCredential } from '../types';
import { credentialManager } from '../utils/storage';

interface CredentialDropdownProps {
  type: 'infura' | 'privateKey';
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  className?: string;
  placeholder?: string;
}

export function CredentialDropdown({
  type,
  value,
  onChange,
  onSave,
  className = '',
  placeholder
}: CredentialDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [credentials, setCredentials] = useState<SavedCredential[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCredentials(credentialManager.getCredentials(type));
  }, [type]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCredentials = credentials.filter(cred =>
    cred.nickname.toLowerCase().includes(search.toLowerCase()) ||
    (type === 'privateKey' && cred.address?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (credential: SavedCredential) => {
    onChange(credentialManager.getDecryptedValue(credential.id, type));
    credentialManager.updateLastUsed(credential.id, type);
    setIsOpen(false);
    setSearch('');
  };

  const handleSave = async () => {
    try {
      setError('');
      const saved = await credentialManager.saveCredential(value, type, nickname);
      if (saved) {
        setCredentials(credentialManager.getCredentials(type));
        setShowSaveDialog(false);
        setNickname('');
        onSave?.();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    credentialManager.deleteCredential(id, type);
    setCredentials(credentialManager.getCredentials(type));
  };

  const maskPrivateKey = (key: string) => {
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type={type === 'privateKey' ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full px-4 py-2 border rounded-md ${className}`}
        />
        <button
          type="button"
          onClick={() => setShowSaveDialog(true)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          title="Save credential"
        >
          <Save className="w-4 h-4" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search saved credentials..."
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredCredentials.map((cred) => (
              <div
                key={cred.id}
                onClick={() => handleSelect(cred)}
                className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  {type === 'infura' ? (
                    <Globe className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Key className="w-4 h-4 text-purple-500" />
                  )}
                  <div>
                    <div className="font-medium">{cred.nickname}</div>
                    <div className="text-sm text-gray-500">
                      {type === 'privateKey'
                        ? cred.address
                        : maskPrivateKey(credentialManager.getDecryptedValue(cred.id, type))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(cred.id, e)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {filteredCredentials.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No saved credentials found
              </div>
            )}
          </div>
        </div>
      )}

      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Save Credential</h3>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nickname
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter a nickname"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {type === 'infura' ? 'Infura URL' : 'Private Key'}
                </label>
                <input
                  type={type === 'privateKey' ? 'password' : 'text'}
                  value={value}
                  disabled
                  className="w-full px-3 py-2 border rounded-md bg-gray-50"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!nickname || !value}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}