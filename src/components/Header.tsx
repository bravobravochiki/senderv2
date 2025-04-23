import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

export function Header({ isDarkMode, onThemeToggle }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent">
        Rex Sender
      </h1>
      <button
        onClick={onThemeToggle}
        className="p-2 rounded-md hover:bg-muted transition-colors"
        title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDarkMode ? (
          <Sun className="h-5 w-5 text-primary" />
        ) : (
          <Moon className="h-5 w-5 text-primary" />
        )}
      </button>
    </div>
  );
}