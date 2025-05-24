const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  
  // Dialog functions
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  
  // Update functions
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  
  // Device discovery functions
  discoverMDNS: (timeout) => ipcRenderer.invoke('discover-mdns', timeout),
  discoverSSDP: (timeout) => ipcRenderer.invoke('discover-ssdp', timeout),
  discoverCrestron: (timeout) => ipcRenderer.invoke('discover-crestron', timeout),
  
  // Device connection functions
  connectDevice: (ipAddress, credentials, certOptions) => ipcRenderer.invoke('connect-device', ipAddress, credentials, certOptions),
  importParameters: (ipAddress, credentials, certOptions) => ipcRenderer.invoke('import-parameters', ipAddress, credentials, certOptions),
  updateParameter: (ipAddress, credentials, certOptions, parameter, value) => ipcRenderer.invoke('update-parameter', ipAddress, credentials, certOptions, parameter, value),
  
  // Device identify function (replaces locate)
  identifyDevice: (ipAddress, credentials, certOptions, duration) => ipcRenderer.invoke('identify-device', ipAddress, credentials, certOptions, duration),
  
  // EDID management functions
  getEdidManagement: (ipAddress, credentials, certOptions) => ipcRenderer.invoke('get-edid-management', ipAddress, credentials, certOptions),
  
  // Stream discovery functions
  getDiscoveredStreams: (ipAddress, credentials, certOptions) => ipcRenderer.invoke('get-discovered-streams', ipAddress, credentials, certOptions),
  
  // Network adapter management functions
  getNetworkAdapters: (ipAddress, credentials, certOptions) => ipcRenderer.invoke('get-network-adapters', ipAddress, credentials, certOptions),
  updateNetworkAdapters: (ipAddress, credentials, certOptions, networkSettings) => ipcRenderer.invoke('update-network-adapters', ipAddress, credentials, certOptions, networkSettings),
  
  // Platform info
  platform: process.platform,
  
  // Node.js info (limited)
  versions: {
    node: process.versions.node,
    electron: process.versions.electron,
    chrome: process.versions.chrome
  }
}); 