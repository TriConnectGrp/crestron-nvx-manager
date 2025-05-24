// Global polyfill for Node.js compatibility
(globalThis as any).global = globalThis;

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Type declaration for Electron API
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      showMessageBox: (options: {
        type?: 'none' | 'info' | 'error' | 'question' | 'warning';
        buttons?: string[];
        defaultId?: number;
        title?: string;
        message: string;
        detail?: string;
      }) => Promise<{ response: number; checkboxChecked: boolean }>;
      checkForUpdates: () => Promise<{ updateAvailable: boolean }>;
      platform: string;
      versions: {
        node: string;
        electron: string;
        chrome: string;
      };
    };
  }
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 