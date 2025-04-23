import React from 'react';
import { ChevronDown } from 'lucide-react';
import { SUPPORTED_TOKENS } from '../config/tokens';
import type { TokenConfig } from '../types';

interface TokenSelectorProps {
  selectedToken: string;
  onTokenSelect: (token: string) => void;
  disabled?: boolean;
}

export function TokenSelector({ selectedToken, onTokenSelect, disabled }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedTokenConfig = SUPPORTED_TOKENS[selectedToken];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={`
          input-field flex items-center justify-between
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <div className="flex items-center">
          <img
            src={selectedTokenConfig.logo}
            alt={selectedTokenConfig.symbol}
            className="w-6 h-6 rounded-full"
          />
          <span className="ml-2 text-base font-medium">{selectedTokenConfig.symbol}</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full card">
          <div className="py-1 max-h-60 overflow-auto">
            {Object.entries(SUPPORTED_TOKENS).map(([symbol, token]) => (
              <button
                key={symbol}
                type="button"
                className={`
                  w-full flex items-center h-12 px-4 text-base hover:bg-muted
                  ${selectedToken === symbol ? 'bg-muted' : ''}
                `}
                onClick={() => {
                  onTokenSelect(symbol);
                  setIsOpen(false);
                }}
              >
                <img
                  src={token.logo}
                  alt={token.symbol}
                  className="w-6 h-6 rounded-full"
                />
                <span className="ml-2">{token.name}</span>
                <span className="ml-1 text-muted-foreground">({token.symbol})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}