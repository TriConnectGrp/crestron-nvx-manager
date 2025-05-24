import React from 'react';
import { Network, Globe, Bell, Settings, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
  appVersion: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  isConnected, 
  appVersion, 
  darkMode, 
  onToggleDarkMode 
}) => {
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
      {/* Left side - Page title will be handled by individual pages */}
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Crestron NVX Manager
        </h1>
      </div>

      {/* Right side - Status and controls */}
      <div className="flex items-center space-x-4">
        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <>
              <Network className="w-5 h-5 text-success-600" />
              <span className="text-sm text-success-600 font-medium">Connected</span>
            </>
          ) : (
            <>
              <Globe className="w-5 h-5 text-error-600" />
              <span className="text-sm text-error-600 font-medium">Disconnected</span>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

        {/* Notifications */}
        <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
          <Bell className="w-5 h-5" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Settings */}
        <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
          <Settings className="w-5 h-5" />
        </button>

        {/* App Version */}
        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
          v{appVersion}
        </div>
      </div>
    </header>
  );
};

export default Header; 