import React from 'react';
import { X, Info } from 'lucide-react';

interface InfuraModalProps {
  isOpen: boolean;
  onClose: () => void;
  infuraUrl: string;
  onInfuraUrlChange: (url: string) => void;
}

export function InfuraModal({ isOpen, onClose, infuraUrl, onInfuraUrlChange }: InfuraModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Infura Configuration</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-muted rounded-md flex items-start space-x-3">
          <Info className="h-5 w-5 text-primary mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Enter your Infura project URL to connect to the Ethereum network. This URL should start with 
            'https://mainnet.infura.io/v3/' followed by your project ID.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Infura URL
            </label>
            <input
              type="text"
              value={infuraUrl}
              onChange={(e) => onInfuraUrlChange(e.target.value)}
              placeholder="https://mainnet.infura.io/v3/your-project-id"
              className="input-field"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button 
              onClick={onClose}
              disabled={!infuraUrl.startsWith('https://mainnet.infura.io/v3/')}
              className="btn-primary"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </>
  );
}