import React from 'react';
import { Home, History, Settings, Menu } from 'lucide-react';

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="flex justify-around items-center h-16">
        <button className="flex flex-col items-center justify-center w-full h-full text-gray-600 hover:text-indigo-600">
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">Home</span>
        </button>
        <button className="flex flex-col items-center justify-center w-full h-full text-gray-600 hover:text-indigo-600">
          <History className="w-6 h-6" />
          <span className="text-xs mt-1">History</span>
        </button>
        <button className="flex flex-col items-center justify-center w-full h-full text-gray-600 hover:text-indigo-600">
          <Settings className="w-6 h-6" />
          <span className="text-xs mt-1">Settings</span>
        </button>
        <button className="flex flex-col items-center justify-center w-full h-full text-gray-600 hover:text-indigo-600">
          <Menu className="w-6 h-6" />
          <span className="text-xs mt-1">More</span>
        </button>
      </div>
    </nav>
  );
}