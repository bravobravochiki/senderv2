import React from 'react';
import { ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { Transaction } from '../types';
import { SUPPORTED_TOKENS } from '../config/tokens';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Transaction History</h2>
      <div className="bg-white shadow rounded-md">
        <div className="min-w-full">
          {transactions.map((tx) => (
            <div 
              key={tx.hash}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-200 gap-4"
            >
              <div className="flex items-start space-x-3 min-w-0">
                {getStatusIcon(tx.status)}
                <div className="min-w-0">
                  <div className="font-mono text-sm text-gray-900 truncate max-w-[200px] sm:max-w-[300px]">
                    {tx.hash}
                  </div>
                  {tx.token && (
                    <div className="flex items-center mt-1">
                      <img
                        src={SUPPORTED_TOKENS[tx.token].logo}
                        alt={tx.token}
                        className="w-4 h-4 rounded-full"
                      />
                      <span className="ml-1 text-sm text-gray-500">
                        {SUPPORTED_TOKENS[tx.token].name}
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 ml-8 sm:ml-0">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                  Nonce: {tx.nonce}
                </span>
                <a
                  href={`https://etherscan.io/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View
                </a>
              </div>
            </div>
          ))}
          
          {transactions.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No transactions found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}