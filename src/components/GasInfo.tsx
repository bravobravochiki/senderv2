import React from 'react';
import { Info } from 'lucide-react';

export function GasInfo() {
  return (
    <div className="bg-muted rounded-md p-4 mb-6">
      <div className="flex items-start space-x-3">
        <Info className="h-5 w-5 text-primary mt-0.5" />
        <div className="space-y-2">
          <h3 className="font-medium">Fixed Gas Settings</h3>
          <div className="text-sm text-muted-foreground">
            <p>• Gas Price: <span className="font-medium">0.1 Gwei</span> (fixed)</p>
            <p>• Gas Bump: <span className="font-medium">20%</span> (for transaction acceleration)</p>
            <p className="mt-2">These settings are optimized for creating pending transactions and cannot be modified.</p>
          </div>
        </div>
      </div>
    </div>
  );
}