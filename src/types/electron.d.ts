// Electron API type declarations

interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  showMessageBox: (options: {
    type?: 'none' | 'info' | 'error' | 'question' | 'warning';
    buttons?: string[];
    defaultId?: number;
    title?: string;
    message: string;
    detail?: string;
  }) => Promise<{ response: number; checkboxChecked: boolean }>;
  checkForUpdates: () => Promise<void>;
  platform: string;
  versions: {
    node: string;
    electron: string;
    chrome: string;
  };
  // Discovery methods
  discoverMDNS: (timeout: number) => Promise<any[]>;
  discoverSSDP: (timeout: number) => Promise<any[]>;
  discoverCrestron: (timeout: number) => Promise<any[]>;
  // Connection methods
  connectDevice: (ipAddress: string, credentials: any, certOptions: any) => Promise<{ success: boolean; error?: string }>;
  importParameters: (ipAddress: string, credentials: any, certOptions: any) => Promise<{ success: boolean; parameters?: any; error?: string }>;
  updateParameter: (ipAddress: string, credentials: any, certOptions: any, parameter: string, value: any) => Promise<{ success: boolean; error?: string }>;
  // Identify methods (replaces locate)
  identifyDevice: (ipAddress: string, credentials: any, certOptions: any, duration?: number) => Promise<{ success: boolean; duration?: number; method?: string; error?: string }>;
  // EDID management methods
  getEdidManagement: (ipAddress: string, credentials: any, certOptions: any) => Promise<{ success: boolean; edidData?: any; error?: string }>;
  // Stream discovery methods
  getDiscoveredStreams: (ipAddress: string, credentials: any, certOptions: any) => Promise<{ success: boolean; streams?: any; error?: string }>;
  // Network adapter management methods
  getNetworkAdapters: (ipAddress: string, credentials: any, certOptions: any) => Promise<{ success: boolean; networkAdapters?: any; authSession?: any; error?: string }>;
  updateNetworkAdapters: (ipAddress: string, credentials: any, certOptions: any, networkSettings: any) => Promise<{ success: boolean; message?: string; error?: string }>;
}

interface LocateProgressData {
  ipAddress: string;
  flashCount: number;
  elapsed: number;
  duration: number;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {}; 