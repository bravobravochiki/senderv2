import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { TransactionForm } from './components/TransactionForm';
import { useTelegram } from './hooks/useTelegram';
import type { Transaction } from './types';

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { webApp, ready } = useTelegram();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (ready && webApp) {
      webApp.ready();
      webApp.expand();
    }
  }, [ready, webApp]);

  useEffect(() => {
    // Check system preference and stored preference
    const storedTheme = localStorage.getItem('theme');
    const darkModePreference = window.matchMedia('(prefers-color-scheme: dark)');
    
    setIsDarkMode(
      storedTheme === 'dark' || 
      (!storedTheme && darkModePreference.matches)
    );

    // Listen for system changes
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
      }
    };
    
    darkModePreference.addEventListener('change', handler);
    return () => darkModePreference.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    // Apply dark mode class and save preference
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleTransactionCreated = (hash: string, token: string) => {
    const newTransaction: Transaction = {
      hash,
      status: 'pending',
      timestamp: Date.now(),
      nonce: transactions.length,
      token
    };
    setTransactions(prev => [newTransaction, ...prev]);
    
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
      webApp.MainButton.setText('View Transaction');
      webApp.MainButton.show();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <Toaster 
        position="top-right"
        toastOptions={{
          className: '!bg-background !text-foreground !border !border-border',
        }}
      />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <TransactionForm 
          onTransactionCreated={handleTransactionCreated}
          isDarkMode={isDarkMode}
          onThemeToggle={() => setIsDarkMode(!isDarkMode)}
        />
      </div>
    </div>
  );
}

export default App;