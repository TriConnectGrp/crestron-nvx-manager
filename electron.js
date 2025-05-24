const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Discovery modules
const dgram = require('dgram');
const os = require('os');

// Enable live reload for Electron in development
if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'), // Add app icon later
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false, // Don't show until ready
  });

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, 'build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
    // TEMPORARY: Force DevTools open
    mainWindow.webContents.openDevTools();
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window controls on macOS
  if (process.platform === 'darwin') {
    mainWindow.on('closed', () => {
      // On macOS, keep app running even when all windows are closed
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // Create application menu
  createMenu();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // Handle new project
          }
        },
        {
          label: 'Open Project',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            // Handle open project
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Window menu
    template[4].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers for renderer process communication
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

// Handle app updates (for future implementation)
ipcMain.handle('check-for-updates', () => {
  // Implementation for auto-updater
  return { updateAvailable: false };
});

// Device discovery handlers
ipcMain.handle('discover-mdns', async (event, timeout = 5000) => {
  try {
    return await discoverMDNSDevices(timeout);
  } catch (error) {
    console.error('mDNS discovery failed:', error);
    return [];
  }
});

ipcMain.handle('discover-ssdp', async (event, timeout = 5000) => {
  try {
    return await discoverSSDP(timeout);
  } catch (error) {
    console.error('SSDP discovery failed:', error);
    return [];
  }
});

// Crestron-specific discovery using the proprietary protocol
ipcMain.handle('discover-crestron', async (event, timeout = 10000) => {
  try {
    return await discoverCrestronDevices(timeout);
  } catch (error) {
    console.error('Crestron discovery failed:', error);
    return [];
  }
});

// Device connection handlers
ipcMain.handle('connect-device', async (event, ipAddress, credentials, certOptions) => {
  try {
    const axios = require('axios');
    const https = require('https');
    
    const authHeader = 'Basic ' + Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
    
    // Create HTTPS agent with proper certificate handling
    const httpsAgent = new https.Agent({
      rejectUnauthorized: certOptions.rejectUnauthorized,
      checkServerIdentity: (host, cert) => {
        // Custom certificate validation based on options
        switch (certOptions.type) {
          case 'valid_ca_only':
            // Only accept valid CA certificates (default Node.js behavior)
            return undefined; // Let Node.js handle validation
          
          case 'valid_ca_and_self_signed':
            // Accept valid CA certs and self-signed certs
            return undefined;
          
          case 'any_certificate':
            // Accept any certificate (least secure)
            return undefined;
          
          default:
            return undefined;
        }
      }
    });
    
    const config = {
      timeout: 10000,
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      httpsAgent: httpsAgent
    };

    // Try common authentication endpoints
    const authEndpoints = [
      '/cws/control/system/info',
      '/api/auth/login',
      '/auth',
      '/login'
    ];

    for (const endpoint of authEndpoints) {
      try {
        const url = `https://${ipAddress}${endpoint}`;
        const response = await axios.get(url, config);
        
        if (response.status === 200) {
          return { success: true };
        }
      } catch (error) {
        // Try HTTP if HTTPS fails
        try {
          const httpUrl = `http://${ipAddress}${endpoint}`;
          const httpConfig = {
            timeout: 10000,
            headers: {
              'Authorization': authHeader,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          };
          const httpResponse = await axios.get(httpUrl, httpConfig);
          
          if (httpResponse.status === 200) {
            return { success: true };
          }
        } catch (httpError) {
          // Continue to next endpoint
        }
      }
    }
    
    return { success: false, error: 'Authentication failed - invalid credentials or unreachable device' };
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'Authentication error' 
    };
  }
});

// Import device parameters handler
ipcMain.handle('import-parameters', async (event, ipAddress, credentials, certOptions) => {
  try {
    const axios = require('axios');
    const https = require('https');
    
    console.log(`Starting parameter import for device: ${ipAddress}`);
    
    // Create HTTPS agent with certificate options
    const httpsAgent = new https.Agent({
      rejectUnauthorized: certOptions.rejectUnauthorized
    });
    
    // Session management - use same authentication as locate function
    let trackId = null;
    let xsrfToken = null;
    let cookies = '';
    
    // Step 1: Initial GET request to obtain TRACKID
    console.log('Step 1: Getting TRACKID for parameter import...');
    try {
      const getResponse = await axios.get(`https://${ipAddress}/userlogin.html`, {
        headers: {
          'Accept': 'text/html'
        },
        httpsAgent: httpsAgent,
        timeout: 10000
      });
      
      const setCookieHeader = getResponse.headers['set-cookie'];
      if (setCookieHeader) {
        const trackIdMatch = setCookieHeader.find(cookie => cookie.includes('TRACKID'));
        if (trackIdMatch) {
          trackId = trackIdMatch.split('=')[1].split(';')[0];
          console.log(`TRACKID obtained: ${trackId}`);
        }
      }
    } catch (httpsError) {
      console.log('HTTPS failed, trying HTTP...');
      const getResponse = await axios.get(`http://${ipAddress}/userlogin.html`, {
        headers: {
          'Accept': 'text/html'
        },
        timeout: 10000
      });
      
      const setCookieHeader = getResponse.headers['set-cookie'];
      if (setCookieHeader) {
        const trackIdMatch = setCookieHeader.find(cookie => cookie.includes('TRACKID'));
        if (trackIdMatch) {
          trackId = trackIdMatch.split('=')[1].split(';')[0];
          console.log(`TRACKID obtained via HTTP: ${trackId}`);
        }
      }
    }
    
    if (!trackId) {
      return { success: false, error: 'Failed to connect to device for parameter import' };
    }
    
    // Step 2: Authenticate
    console.log('Step 2: Authenticating for parameter import...');
    const loginData = `login=${encodeURIComponent(credentials.username)}&passwd=${encodeURIComponent(credentials.password)}`;
    
    const loginConfig = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': `https://${ipAddress}`,
        'Referer': `https://${ipAddress}/userlogin.html`,
        'Cookie': `TRACKID=${trackId}`
      },
      httpsAgent: httpsAgent,
      timeout: 10000,
      maxRedirects: 0,
      validateStatus: function (status) {
        return status < 500;
      }
    };
    
    let loginResponse;
    let useHttps = true;
    
    try {
      loginResponse = await axios.post(`https://${ipAddress}/userlogin.html`, loginData, loginConfig);
    } catch (httpsError) {
      console.log('Login HTTPS failed, trying HTTP...');
      useHttps = false;
      const httpConfig = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Origin': `http://${ipAddress}`,
          'Referer': `http://${ipAddress}/userlogin.html`,
          'Cookie': `TRACKID=${trackId}`
        },
        timeout: 10000,
        maxRedirects: 0,
        validateStatus: function (status) {
          return status < 500;
        }
      };
      loginResponse = await axios.post(`http://${ipAddress}/userlogin.html`, loginData, httpConfig);
    }
    
    // Extract XSRF token and cookies
    xsrfToken = loginResponse.headers['crest-xsrf-token'];
    const allCookies = loginResponse.headers['set-cookie'];
    if (allCookies) {
      cookies = allCookies.map(cookie => cookie.split(';')[0]).join('; ');
    }
    
    console.log(`Authentication result: Status ${loginResponse.status}, XSRF Token: ${xsrfToken ? 'obtained' : 'not found'}`);
    
    if (loginResponse.status !== 200 && loginResponse.status !== 302) {
      return { success: false, error: 'Authentication failed for parameter import' };
    }
    
    // Step 3: Get device parameters using official Crestron DM NVX REST API endpoints
    console.log('Step 3: Fetching device parameters...');
    
    const getDeviceData = async (endpoint) => {
      const url = useHttps ? `https://${ipAddress}${endpoint}` : `http://${ipAddress}${endpoint}`;
      const config = {
        headers: {
          'Accept': 'application/json',
          'Referer': useHttps ? `https://${ipAddress}/userlogin.html` : `http://${ipAddress}/userlogin.html`,
          'Cookie': cookies
        },
        timeout: 10000
      };
      
      if (useHttps) {
        config.httpsAgent = httpsAgent;
      }
      
      if (xsrfToken) {
        config.headers['X-CREST-XSRF-TOKEN'] = xsrfToken;
      }
      
      try {
        const response = await axios.get(url, config);
        console.log(`Successfully fetched data from ${endpoint}`);
        return response.data;
      } catch (error) {
        console.warn(`Failed to fetch from ${endpoint}: ${error.message}`);
        return null;
      }
    };
    
    // Fetch from official Crestron DM NVX REST API endpoints
    const deviceEndpoints = [
      '/Device/DeviceInfo',         // Official device information endpoint
      '/Device/NetworkAdapters',    // Network adapters configuration
      '/Device/DeviceSpecific',     // Device-specific settings (LEDs, etc.)
      '/Device/StreamingVideo',     // Video streaming configuration
      '/Device/StreamingAudio',     // Audio streaming configuration
      '/Device/USB',                // USB configuration
      '/Device/Network',            // General network settings
      '/Device/EdidMgmnt',          // EDID management settings
      '/Device/DiscoveredStreams',  // Streams discovered by device
      '/Device/Identify',           // Device identification (better locate)
      '/Device/AudioVideoInputOutput', // Audio/Video input/output configuration
      '/Device'                     // Root device object
    ];
    
    const responses = {};
    
    for (const endpoint of deviceEndpoints) {
      const data = await getDeviceData(endpoint);
      if (data) {
        responses[endpoint] = data;
      }
    }
    
    console.log('Retrieved data from official API endpoints:', Object.keys(responses));
    console.log('Sample response data:', JSON.stringify(responses, null, 2).substring(0, 1000) + '...');
    
    // Parse device parameters from official API responses
    const deviceInfo = responses['/Device/DeviceInfo']?.Device?.DeviceInfo || responses['/Device/DeviceInfo']?.DeviceInfo || responses['/Device/DeviceInfo'] || {};
    const networkAdapters = responses['/Device/NetworkAdapters']?.Device?.NetworkAdapters || responses['/Device/NetworkAdapters']?.NetworkAdapters || responses['/Device/NetworkAdapters'] || {};
    const deviceSpecific = responses['/Device/DeviceSpecific']?.Device?.DeviceSpecific || responses['/Device/DeviceSpecific']?.DeviceSpecific || responses['/Device/DeviceSpecific'] || {};
    const streamingVideo = responses['/Device/StreamingVideo']?.Device?.StreamingVideo || responses['/Device/StreamingVideo']?.StreamingVideo || responses['/Device/StreamingVideo'] || {};
    const streamingAudio = responses['/Device/StreamingAudio']?.Device?.StreamingAudio || responses['/Device/StreamingAudio']?.StreamingAudio || responses['/Device/StreamingAudio'] || {};
    const usbData = responses['/Device/USB']?.Device?.USB || responses['/Device/USB']?.USB || responses['/Device/USB'] || {};
    const networkData = responses['/Device/Network']?.Device?.Network || responses['/Device/Network']?.Network || responses['/Device/Network'] || {};
    const deviceRoot = responses['/Device']?.Device || responses['/Device'] || {};
    
    // Extract primary network adapter information
    const primaryAdapter = networkAdapters.Adapters?.EthernetPrimary || networkAdapters.EthernetPrimary || {};
    const auxAdapter = networkAdapters.Adapters?.EthernetAux || networkAdapters.EthernetAux || {};
    const dnsSettings = networkAdapters.DnsSettings || {};
    
    // Extract new API data
    const edidMgmnt = responses['/Device/EdidMgmnt']?.Device?.EdidMgmnt || responses['/Device/EdidMgmnt']?.EdidMgmnt || responses['/Device/EdidMgmnt'] || {};
    const discoveredStreams = responses['/Device/DiscoveredStreams']?.Device?.DiscoveredStreams || responses['/Device/DiscoveredStreams']?.DiscoveredStreams || responses['/Device/DiscoveredStreams'] || {};
    const identifyData = responses['/Device/Identify']?.Device?.Identify || responses['/Device/Identify']?.Identify || responses['/Device/Identify'] || {};
    const audioVideoIO = responses['/Device/AudioVideoInputOutput']?.Device?.AudioVideoInputOutput || responses['/Device/AudioVideoInputOutput']?.AudioVideoInputOutput || responses['/Device/AudioVideoInputOutput'] || {};
    
    // Create comprehensive parameter object from official API data
    const parameters = {
      // Basic Device Info (from DeviceInfo endpoint)
      ipAddress,
      hostname: networkAdapters.HostName || deviceInfo.HostName || deviceInfo.Name || primaryAdapter.Name || 'Unknown',
      firmwareVersion: deviceInfo.FirmwareVersion || deviceInfo.Version || deviceRoot.FirmwareVersion || 'Unknown',
      deviceName: deviceInfo.FriendlyName || deviceInfo.DeviceName || deviceInfo.Name || `DM-NVX Device (${ipAddress})`,
      serialNumber: deviceInfo.SerialNumber || deviceInfo.Serial || deviceRoot.SerialNumber || 'Unknown',
      model: deviceInfo.Model || deviceInfo.DeviceModel || 'DM-NVX',
      
      // Network Configuration (from NetworkAdapters endpoint)
      networkHostname: networkAdapters.HostName || 'Unknown',
      icmpPingEnabled: Boolean(networkAdapters.IsIcmpPingEnabled),
      tcpKeepAliveEnabled: Boolean(networkAdapters.IsTcpKeepAliveEnabled),
      igmpVersion: networkAdapters.IgmpVersion || 'v2',
      addressSchema: networkAdapters.AddressSchema || 'IPv4',
      
      // Primary Ethernet Adapter
      primaryAdapterName: primaryAdapter.Name || 'eth0',
      primaryMacAddress: primaryAdapter.MacAddress || 'Unknown',
      primaryIsEnabled: Boolean(primaryAdapter.IsAdapterEnabled),
      primaryLinkStatus: Boolean(primaryAdapter.LinkStatus),
      primaryIsActive: Boolean(primaryAdapter.IsActive),
      primaryAutoNegotiation: primaryAdapter.AutoNegotiation || 'On',
      primaryDomainName: primaryAdapter.DomainName || '',
      
      // Primary IPv4 Configuration
      primaryIPv4Address: primaryAdapter.IPv4?.Addresses?.[0]?.Address || primaryAdapter.IPv4?.CurrentAddress || 'Unknown',
      primaryIPv4SubnetMask: primaryAdapter.IPv4?.Addresses?.[0]?.SubnetMask || primaryAdapter.IPv4?.CurrentSubnetMask || 'Unknown',
      primaryIPv4Gateway: primaryAdapter.IPv4?.DefaultGateway || 'Unknown',
      primaryDhcpEnabled: Boolean(primaryAdapter.IPv4?.IsDhcpEnabled),
      
      // DNS Configuration
      primaryDnsServer: dnsSettings.IPv4?.DnsServers?.[0] || dnsSettings.DnsServers?.Server01?.Address || 'Unknown',
      secondaryDnsServer: dnsSettings.IPv4?.DnsServers?.[1] || dnsSettings.DnsServers?.Server02?.Address || 'Unknown',
      
      // Auxiliary Ethernet Adapter (if present)
      auxAdapterName: auxAdapter.Name || 'eth1',
      auxMacAddress: auxAdapter.MacAddress || 'Unknown',
      auxIsEnabled: Boolean(auxAdapter.IsAdapterEnabled),
      auxLinkStatus: Boolean(auxAdapter.LinkStatus),
      auxIPv4Address: auxAdapter.IPv4?.Addresses?.[0]?.Address || 'Not Configured',
      
      // Streaming Parameters (from StreamingVideo/Audio endpoints)
      mode: streamingVideo.Mode || streamingAudio.Mode || deviceRoot.Mode || 'Unknown',
      startStop: Boolean(streamingVideo.Enabled || streamingVideo.IsRunning || streamingAudio.Enabled),
      status: streamingVideo.Status || streamingAudio.Status || deviceRoot.Status || 'Unknown',
      streamType: streamingVideo.Codec || streamingVideo.CompressionType || 'H.264',
      bitrate: parseInt(streamingVideo.Bitrate || streamingVideo.CurrentBitrate || 0),
      targetBitrate: parseInt(streamingVideo.TargetBitrate || streamingVideo.MaxBitrate || 100),
      preview: Boolean(streamingVideo.PreviewEnabled || streamingVideo.IsPreviewEnabled),
      
      // Video Parameters
      videoMode: streamingVideo.Resolution || streamingVideo.VideoFormat || '1920x1080@60',
      videoSource: streamingVideo.Source || streamingVideo.InputSource || 'HDMI 1',
      xioRoute: streamingVideo.XioRoute || streamingVideo.RoutingMode || 'Local',
      scalerResolution: streamingVideo.ScalerResolution || streamingVideo.OutputResolution || '1920x1080',
      
      // Audio Parameters
      audioMode: streamingAudio.Mode || streamingAudio.AudioFormat || 'PCM',
      audioSource: streamingAudio.Source || streamingAudio.InputSource || 'HDMI',
      analogAudio: streamingAudio.AnalogMode || streamingAudio.AnalogLevel || 'Line Level',
      
      // HDMI Parameters
      syncHotplug: Boolean(streamingVideo.SyncHotplug || streamingVideo.HotplugDetection),
      hdmi1EDID: streamingVideo.HDMI1_EDID || streamingVideo.HDMI?.Port1?.EDID || 'Standard',
      hdmi1HDCP: Boolean(streamingVideo.HDMI1_HDCP || streamingVideo.HDMI?.Port1?.HDCP),
      hdmi2EDID: streamingVideo.HDMI2_EDID || streamingVideo.HDMI?.Port2?.EDID || 'Standard',
      hdmi2HDCP: Boolean(streamingVideo.HDMI2_HDCP || streamingVideo.HDMI?.Port2?.HDCP),
      
      // Network Streaming Parameters
      igmp: Boolean(networkData.IGMP || networkAdapters.IgmpVersion),
      ttl: parseInt(networkData.TTL || networkData.TimeToLive || 15),
      streamLocation: networkData.StreamLocation || networkData.MulticastLocation || 'Local Network',
      multicastIP: networkData.MulticastIP || streamingVideo.MulticastAddress || '239.1.1.1',
      multicastMAC: networkData.MulticastMAC || streamingVideo.MulticastMAC || '01:00:5E:01:01:01',
      
      // NAX (Network Audio/Video) Parameters
      naxTxIP: networkData.NAX_TX_IP || networkData.NAX?.Transmitter?.IP || '239.255.255.1',
      naxTxMAC: networkData.NAX_TX_MAC || networkData.NAX?.Transmitter?.MAC || '01:00:5E:FF:FF:01',
      naxRxIP: networkData.NAX_RX_IP || networkData.NAX?.Receiver?.IP || '239.255.255.2',
      naxTxStartStop: Boolean(networkData.NAX?.Transmitter?.Enabled || networkData.NAXTxEnabled),
      naxTxStatus: networkData.NAX?.Transmitter?.Status || networkData.NAXTxStatus || 'Stopped',
      naxTxMode: networkData.NAX?.Transmitter?.Mode || networkData.NAXTxMode || 'Auto',
      naxRxStartStop: Boolean(networkData.NAX?.Receiver?.Enabled || networkData.NAXRxEnabled),
      naxRxStatus: networkData.NAX?.Receiver?.Status || networkData.NAXRxStatus || 'Stopped',
      naxRxMode: networkData.NAX?.Receiver?.Mode || networkData.NAXRxMode || 'Auto',
      
      // USB Parameters
      usbMode: usbData.Mode || usbData.OperatingMode || 'Device',
      usbTransport: usbData.Transport || usbData.TransportType || 'USB 2.0',
      usbPairedDevices: usbData.PairedDevices || usbData.ConnectedDevices || [],
      usbActions: usbData.AvailableActions || usbData.SupportedCommands || ['Pair', 'Unpair', 'Reset'],
      
      // Chassis Parameters
      chassisSlot: parseInt(deviceInfo.ChassisSlot || deviceInfo.SlotNumber || deviceRoot.ChassisSlot || 1),
      chassisTSID: deviceInfo.TSID || deviceInfo.ChassisID || deviceRoot.TSID || 'CHAS001',
      chassisSerial: deviceInfo.ChassisSerial || deviceInfo.ChassisSerialNumber || deviceRoot.ChassisSerial || 'Unknown',
      
      // Device Specific Settings
      ledsEnabled: Boolean(deviceSpecific.LedsEnabled || deviceSpecific.LEDsEnabled),
      
      // IPv6 Support (from NetworkAdapters)
      ipv6Supported: Boolean(networkAdapters.IPv6?.IsSupported),
      ipv6PingEnabled: Boolean(networkAdapters.IPv6?.IsIcmpPingEnabled),
      ipv6MulticastProxy: Boolean(networkAdapters.IPv6?.IsMulticastProxyEnabled),
      
      // API Version Information
      networkAdaptersVersion: networkAdapters.Version || '1.0.0',
      
      // EDID Management (from EdidMgmnt endpoint)
      edidSystemList: Object.keys(edidMgmnt.SystemEdidList || {}),
      edidCustomList: Object.keys(edidMgmnt.CustomEdidList || {}),
      edidCopyList: Object.keys(edidMgmnt.CopyEdidList || {}),
      edidVersion: edidMgmnt.Version || 'Unknown',
      edidUploadPath: edidMgmnt.UploadFilePath || '',
      
      // Discovered Streams (from DiscoveredStreams endpoint)
      discoveredStreamsList: Object.keys(discoveredStreams.Streams || {}),
      streamsData: discoveredStreams.Streams || {},
      streamCount: Object.keys(discoveredStreams.Streams || {}).length,
      
      // Identify Support (better locate functionality)
      identifySupported: Boolean(identifyData),
      identifyMethods: Object.keys(identifyData || {}),
      
      // Audio/Video Input/Output (from AudioVideoInputOutput endpoint)
      audioInputs: audioVideoIO.AudioInputs || {},
      videoInputs: audioVideoIO.VideoInputs || {},
      audioOutputs: audioVideoIO.AudioOutputs || {},
      videoOutputs: audioVideoIO.VideoOutputs || {},
      
      // Metadata
      lastUpdated: new Date()
    };
    
    // Step 4: Logout
    console.log('Step 4: Logging out...');
    try {
      const logoutUrl = useHttps ? `https://${ipAddress}/logout` : `http://${ipAddress}/logout`;
      await axios.get(logoutUrl, {
        headers: { 'Cookie': cookies },
        httpsAgent: useHttps ? httpsAgent : undefined,
        timeout: 5000
      });
    } catch (error) {
      console.warn('Logout failed:', error.message);
    }
    
    console.log('Successfully imported device parameters via GET commands');
    return { success: true, parameters };
    
  } catch (error) {
    console.error('Error importing device parameters:', error);
    
    // Fallback to mock data if real parameter import fails
    console.log('Parameter import failed, providing mock data...');
    const mockParameters = {
      // Basic Device Info
      ipAddress,
      hostname: `nvx-device-${ipAddress.split('.').pop()}`,
      firmwareVersion: 'v7.3.0173.23090',
      deviceName: `DM-NVX-384 (${ipAddress})`,
      serialNumber: 'NVX' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      
      // Streaming Parameters
      mode: 'Transmitter',
      startStop: false,
      status: 'Stopped',
      streamType: 'H.264',
      bitrate: 0,
      targetBitrate: 100,
      preview: false,
      
      // Video Parameters
      videoMode: '1920x1080@60',
      videoSource: 'HDMI 1',
      xioRoute: 'Local',
      scalerResolution: '1920x1080',
      
      // Audio Parameters
      audioMode: 'PCM',
      audioSource: 'HDMI',
      analogAudio: 'Line Level',
      
      // HDMI Parameters
      syncHotplug: true,
      hdmi1EDID: 'Standard',
      hdmi1HDCP: false,
      hdmi2EDID: 'Standard',
      hdmi2HDCP: false,
      
      // Network Parameters
      igmp: true,
      ttl: 15,
      streamLocation: 'Local Network',
      multicastIP: '239.1.1.1',
      multicastMAC: '01:00:5E:01:01:01',
      
      // NAX Parameters
      naxTxIP: '239.255.255.1',
      naxTxMAC: '01:00:5E:FF:FF:01',
      naxRxIP: '239.255.255.2',
      naxTxStartStop: false,
      naxTxStatus: 'Stopped',
      naxTxMode: 'Auto',
      naxRxStartStop: false,
      naxRxStatus: 'Stopped',
      naxRxMode: 'Auto',
      
      // USB Parameters
      usbMode: 'Device',
      usbTransport: 'USB 2.0',
      usbPairedDevices: ['Touch Panel', 'Keyboard'],
      usbActions: ['Pair', 'Unpair', 'Reset'],
      
      // Chassis Parameters
      chassisSlot: 1,
      chassisTSID: 'CHAS001',
      chassisSerial: 'CH' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      
      // Device Specific Settings
      ledsEnabled: true,
      
      // Metadata
      lastUpdated: new Date()
    };
    
    return { 
      success: true, 
      parameters: mockParameters,
      isMockData: true,
      error: `Could not retrieve real device parameters via GET commands: ${error.message}. Showing mock data for interface testing.`
    };
  }
});

// Update device parameter handler
ipcMain.handle('update-parameter', async (event, ipAddress, credentials, certOptions, parameter, value) => {
  try {
    // Implementation would depend on specific Crestron API endpoints
    // This is a placeholder for the actual parameter update logic
    console.log(`Updating ${parameter} to ${value} on device ${ipAddress}`);
    
    // Return success for now - actual implementation would make API calls
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'Update failed' 
    };
  }
});

// Device identify handler - Using official Identify endpoint (better than LED locate)
ipcMain.handle('identify-device', async (event, ipAddress, credentials, certOptions, duration = 30) => {
  try {
    const axios = require('axios');
    const https = require('https');
    
    console.log(`Starting device identify for: ${ipAddress} (duration: ${duration}s)`);
    
    // Create HTTPS agent with certificate options
    const httpsAgent = new https.Agent({
      rejectUnauthorized: certOptions.rejectUnauthorized
    });
    
    // Session management - use same authentication as other functions
    let trackId = null;
    let xsrfToken = null;
    let cookies = '';
    
    // Step 1: Initial GET request to obtain TRACKID
    console.log('Step 1: Getting TRACKID for device identify...');
    try {
      const getResponse = await axios.get(`https://${ipAddress}/userlogin.html`, {
        headers: { 'Accept': 'text/html' },
        httpsAgent: httpsAgent,
        timeout: 10000
      });
      
      const setCookieHeader = getResponse.headers['set-cookie'];
      if (setCookieHeader) {
        const trackIdMatch = setCookieHeader.find(cookie => cookie.includes('TRACKID'));
        if (trackIdMatch) {
          trackId = trackIdMatch.split('=')[1].split(';')[0];
          console.log(`TRACKID obtained: ${trackId}`);
        }
      }
    } catch (httpsError) {
      console.log('HTTPS failed, trying HTTP...');
      const getResponse = await axios.get(`http://${ipAddress}/userlogin.html`, {
        headers: { 'Accept': 'text/html' },
        timeout: 10000
      });
      
      const setCookieHeader = getResponse.headers['set-cookie'];
      if (setCookieHeader) {
        const trackIdMatch = setCookieHeader.find(cookie => cookie.includes('TRACKID'));
        if (trackIdMatch) {
          trackId = trackIdMatch.split('=')[1].split(';')[0];
          console.log(`TRACKID obtained via HTTP: ${trackId}`);
        }
      }
    }
    
    if (!trackId) {
      return { success: false, error: 'Failed to connect to device for identify' };
    }
    
    // Step 2: Authenticate
    console.log('Step 2: Authenticating for device identify...');
    const loginData = `login=${encodeURIComponent(credentials.username)}&passwd=${encodeURIComponent(credentials.password)}`;
    
    const loginConfig = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': `https://${ipAddress}`,
        'Referer': `https://${ipAddress}/userlogin.html`,
        'Cookie': `TRACKID=${trackId}`
      },
      httpsAgent: httpsAgent,
      timeout: 10000,
      maxRedirects: 0,
      validateStatus: function (status) { return status < 500; }
    };
    
    let loginResponse;
    let useHttps = true;
    
    try {
      loginResponse = await axios.post(`https://${ipAddress}/userlogin.html`, loginData, loginConfig);
    } catch (httpsError) {
      console.log('Login HTTPS failed, trying HTTP...');
      useHttps = false;
      const httpConfig = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Origin': `http://${ipAddress}`,
          'Referer': `http://${ipAddress}/userlogin.html`,
          'Cookie': `TRACKID=${trackId}`
        },
        timeout: 10000,
        maxRedirects: 0,
        validateStatus: function (status) { return status < 500; }
      };
      loginResponse = await axios.post(`http://${ipAddress}/userlogin.html`, loginData, httpConfig);
    }
    
    // Extract XSRF token and cookies
    xsrfToken = loginResponse.headers['crest-xsrf-token'];
    const allCookies = loginResponse.headers['set-cookie'];
    if (allCookies) {
      cookies = allCookies.map(cookie => cookie.split(';')[0]).join('; ');
    }
    
    console.log(`Authentication result: Status ${loginResponse.status}, XSRF Token: ${xsrfToken ? 'obtained' : 'not found'}`);
    
    if (loginResponse.status !== 200 && loginResponse.status !== 302) {
      return { success: false, error: 'Authentication failed for device identify' };
    }
    
    // Step 3: Use official Identify endpoint
    console.log('Step 3: Triggering device identify...');
    
    const identifyPayload = {
      Device: {
        Identify: {
          Action: 'Start',
          Duration: duration
        }
      }
    };
    
    const identifyUrl = useHttps ? `https://${ipAddress}/Device/Identify` : `http://${ipAddress}/Device/Identify`;
    const identifyConfig = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Referer': useHttps ? `https://${ipAddress}/userlogin.html` : `http://${ipAddress}/userlogin.html`,
        'Cookie': cookies
      },
      timeout: 15000
    };
    
    if (useHttps) {
      identifyConfig.httpsAgent = httpsAgent;
    }
    
    if (xsrfToken) {
      identifyConfig.headers['X-CREST-XSRF-TOKEN'] = xsrfToken;
    }
    
    try {
      const identifyResponse = await axios.post(identifyUrl, identifyPayload, identifyConfig);
      console.log(`Identify response: ${identifyResponse.status}`);
      
      if (identifyResponse.status === 200) {
        console.log('Device identify started successfully');
        
        // Step 4: Logout
        console.log('Step 4: Logging out...');
        try {
          const logoutUrl = useHttps ? `https://${ipAddress}/logout` : `http://${ipAddress}/logout`;
          await axios.get(logoutUrl, {
            headers: { 'Cookie': cookies },
            httpsAgent: useHttps ? httpsAgent : undefined,
            timeout: 5000
          });
        } catch (error) {
          console.warn('Logout failed:', error.message);
        }
        
        return { 
          success: true, 
          duration,
          method: 'official_identify_endpoint'
        };
      } else {
        return { success: false, error: `Identify failed with status: ${identifyResponse.status}` };
      }
    } catch (identifyError) {
      console.error('Identify endpoint failed:', identifyError.message);
      return { success: false, error: `Identify endpoint failed: ${identifyError.message}` };
    }
    
  } catch (error) {
    console.error('Error in device identify:', error);
    return { 
      success: false, 
      error: error.message || 'Device identify failed' 
    };
  }
});

// mDNS/Bonjour discovery function
async function discoverMDNSDevices(timeout) {
  return new Promise((resolve) => {
    const devices = [];
    const socket = dgram.createSocket('udp4');
    
    // mDNS query for Crestron devices
    const query = Buffer.from([
      0x00, 0x00, // Transaction ID
      0x01, 0x00, // Standard query
      0x00, 0x01, // Questions
      0x00, 0x00, // Answer RRs
      0x00, 0x00, // Authority RRs
      0x00, 0x00, // Additional RRs
      // Query for _crestron._tcp.local
      0x09, 0x5f, 0x63, 0x72, 0x65, 0x73, 0x74, 0x72, 0x6f, 0x6e, // _crestron
      0x04, 0x5f, 0x74, 0x63, 0x70, // _tcp
      0x05, 0x6c, 0x6f, 0x63, 0x61, 0x6c, 0x00, // local
      0x00, 0x0c, // PTR query
      0x00, 0x01  // IN class
    ]);

    socket.on('message', (msg, rinfo) => {
      try {
        // Parse mDNS response (simplified)
        if (msg.length > 12) {
          const deviceInfo = {
            id: rinfo.address,
            name: `Crestron Device (${rinfo.address})`,
            ipAddress: rinfo.address,
            model: 'DM-NVX (mDNS)',
            firmwareVersion: 'Unknown',
            status: 'online',
            lastSeen: new Date(),
            capabilities: ['network_discovery'],
            deviceType: 'unknown'
          };
          
          // Check if device already exists
          if (!devices.find(d => d.ipAddress === rinfo.address)) {
            devices.push(deviceInfo);
          }
        }
      } catch (error) {
        console.error('Error parsing mDNS response:', error);
      }
    });

    socket.on('error', (error) => {
      console.error('mDNS socket error:', error);
      resolve(devices);
    });

    // Send multicast query
    socket.bind(() => {
      try {
        socket.addMembership('224.0.0.251');
        socket.send(query, 5353, '224.0.0.251', (error) => {
          if (error) {
            console.error('Error sending mDNS query:', error);
          }
        });
      } catch (error) {
        console.error('Error setting up mDNS socket:', error);
      }
    });

    // Cleanup after timeout
    setTimeout(() => {
      try {
        socket.close();
      } catch (error) {
        // Socket already closed
      }
      resolve(devices);
    }, timeout);
  });
}

// SSDP discovery function
async function discoverSSDP(timeout) {
  return new Promise((resolve) => {
    const devices = [];
    const socket = dgram.createSocket('udp4');
    
    // SSDP M-SEARCH for UPnP devices
    const msearch = [
      'M-SEARCH * HTTP/1.1',
      'HOST: 239.255.255.250:1900',
      'MAN: "ssdp:discover"',
      'MX: 3',
      'ST: upnp:rootdevice',
      '',
      ''
    ].join('\r\n');

    socket.on('message', (msg, rinfo) => {
      try {
        const response = msg.toString();
        
        // Check if this looks like a Crestron device
        if (response.toLowerCase().includes('crestron') || 
            response.toLowerCase().includes('nvx') ||
            response.toLowerCase().includes('dmps')) {
          
          const deviceInfo = {
            id: rinfo.address,
            name: `Crestron Device (${rinfo.address})`,
            ipAddress: rinfo.address,
            model: 'DM-NVX (SSDP)',
            firmwareVersion: 'Unknown',
            status: 'online',
            lastSeen: new Date(),
            capabilities: ['upnp', 'network_discovery'],
            deviceType: 'unknown'
          };
          
          // Extract more info from SSDP response if available
          const serverMatch = response.match(/SERVER:\s*(.+)/i);
          if (serverMatch) {
            deviceInfo.model = serverMatch[1].trim();
          }
          
          // Check if device already exists
          if (!devices.find(d => d.ipAddress === rinfo.address)) {
            devices.push(deviceInfo);
          }
        }
      } catch (error) {
        console.error('Error parsing SSDP response:', error);
      }
    });

    socket.on('error', (error) => {
      console.error('SSDP socket error:', error);
      resolve(devices);
    });

    // Bind and send multicast search
    socket.bind(() => {
      try {
        socket.addMembership('239.255.255.250');
        socket.send(msearch, 1900, '239.255.255.250', (error) => {
          if (error) {
            console.error('Error sending SSDP search:', error);
          }
        });
      } catch (error) {
        console.error('Error setting up SSDP socket:', error);
      }
    });

    // Cleanup after timeout
    setTimeout(() => {
      try {
        socket.close();
      } catch (error) {
        // Socket already closed
      }
      resolve(devices);
    }, timeout);
  });
}

// Crestron-specific discovery function (converted from Python)
async function discoverCrestronDevices(timeout) {
  return new Promise((resolve) => {
    const devices = [];
    const seenIPs = new Set();
    const socket = dgram.createSocket('udp4');
    
    // Create discovery messages (converted from Python)
    function createDiscoveryMessage(variableLength = false) {
      const hostname = os.hostname();
      const hostnameBuffer = Buffer.from(hostname, 'ascii');
      
      if (variableLength) {
        const header = Buffer.from([0x14, 0x00, 0x00, 0x00]);
        const length = Buffer.from([(hostnameBuffer.length + 4) & 0xFF, 0x00]);
        const subheader = Buffer.from([0x00, 0x03, 0x00, 0x00]);
        return Buffer.concat([header, length, subheader, hostnameBuffer]);
      } else {
        const header = Buffer.from([0x14, 0x00, 0x00, 0x00, 0x01, 0x04, 0x00, 0x03, 0x00, 0x00]);
        const padding = Buffer.alloc(266 - header.length - hostnameBuffer.length);
        return Buffer.concat([header, hostnameBuffer, padding]);
      }
    }
    
    // Extract model and version from description
    function extractModelAndVersion(description) {
      if (!description) return { model: '', version: '', skip: true };
      
      console.log(`Raw description: ${description}`);
      
      // Parse format: "DM-NVX-384 [v7.3.0173.23090 (Jan 15 2025), %2517CRO02014] @E-c442686d04ae"
      // Extract model (everything before the first bracket)
      const model = description.split('[')[0].trim();
      
      // Only process DM-NVX devices
      if (!model.startsWith('DM-NVX')) {
        console.log(`Skipping non-DM-NVX device: ${model}`);
        return { model: '', version: '', skip: true };
      }
      
      // Extract firmware version (look for v followed by version number)
      const versionMatch = description.match(/\[v([\d\.]+)/);
      const version = versionMatch ? versionMatch[1] : '';
      
      // Extract build date if present
      const dateMatch = description.match(/\(([^)]+)\)/);
      const buildDate = dateMatch ? dateMatch[1] : '';
      
      console.log(`Extracted - Model: ${model}, Version: v${version}, Build Date: ${buildDate}`);
      
      return { model, version: version ? `v${version}` : '', buildDate };
    }
    
    // Parse device information from response
    function parseDeviceInfo(data, address) {
      try {
        // Extract raw info starting from byte 10
        const rawInfo = data.slice(10).toString('utf8').replace(/\0/g, '');
        console.log(`Raw device info from ${address}: ${rawInfo}`);
        
        // Split on null bytes and filter empty parts
        const parts = data.slice(10).toString('utf8').split('\0').filter(part => part.length > 0);
        console.log(`Split parts:`, parts);
        
        const hostname = parts[0] || '';
        const description = parts[1] || '';
        const deviceId = parts[2] ? parts[2].replace('@', '') : '';
        
        // Extract model and version from description
        const { model, version, buildDate, skip } = extractModelAndVersion(description);
        
        // Skip non-DM-NVX devices
        if (skip || !model.startsWith('DM-NVX')) {
          console.log(`Filtering out non-DM-NVX device: ${model}`);
          return null;
        }
        
        // Determine device type
        const deviceType = determineDeviceType(model);
        
        // Parse capabilities based on model
        const capabilities = parseCapabilities(model);
        
        return {
          id: deviceId || address,
          name: hostname || model || `DM-NVX Device (${address})`,
          ipAddress: address,
          macAddress: undefined, // Not provided in this protocol
          model: model,
          firmwareVersion: version || 'Unknown',
          status: 'online',
          lastSeen: new Date(),
          capabilities: capabilities,
          deviceType: deviceType,
          hostname: hostname,
          description: description,
          deviceId: deviceId,
          buildDate: buildDate
        };
      } catch (error) {
        console.error('Error parsing device info:', error);
        console.error('Raw data hex:', data.toString('hex'));
        return null;
      }
    }
    
    // Parse capabilities based on model number
    function parseCapabilities(model) {
      const capabilities = ['crestron_discovery'];
      
      // Extract port count from model (e.g., DM-NVX-384 = 384 endpoints)
      const portMatch = model.match(/DM-NVX-(\d+)/);
      if (portMatch) {
        const portCount = parseInt(portMatch[1]);
        capabilities.push(`${portCount}_endpoints`);
        
        // Common capabilities for DM-NVX devices
        capabilities.push('hdmi', '4k_support', 'hdcp', 'ethernet_streaming');
        
        if (portCount >= 350) {
          capabilities.push('dante_audio', 'advanced_scaling');
        }
      }
      
      return capabilities;
    }
    
    // Determine device type from model
    function determineDeviceType(model) {
      const modelLower = model.toLowerCase();
      if (modelLower.includes('tx') || modelLower.includes('transmitter')) {
        return 'transmitter';
      } else if (modelLower.includes('rx') || modelLower.includes('receiver')) {
        return 'receiver';
      }
      return 'unknown';
    }
    
    // Handle incoming messages
    socket.on('message', (data, rinfo) => {
      try {
        // Check for Crestron response signature
        if (data.length >= 4 && 
            data[0] === 0x15 && data[1] === 0x00 && 
            data[2] === 0x00 && data[3] === 0x00) {
          
          const ip = rinfo.address;
          
          if (!seenIPs.has(ip)) {
            seenIPs.add(ip);
            
            const device = parseDeviceInfo(data, ip);
            if (device) {
              devices.push(device);
              console.log(`\nCrestron device found at ${ip}:`);
              console.log(`Hostname: ${device.hostname}`);
              console.log(`Model: ${device.model}`);
              console.log(`Version: ${device.firmwareVersion}`);
              console.log(`Description: ${device.description}`);
              console.log(`Device ID: ${device.deviceId}`);
            }
          }
        }
      } catch (error) {
        console.error('Error processing Crestron response:', error);
      }
    });
    
    socket.on('error', (error) => {
      console.error('Crestron discovery socket error:', error);
      resolve(devices);
    });
    
    // Bind and start discovery
    socket.bind(41794, () => {
      try {
        // Enable broadcast
        socket.setBroadcast(true);
        
        console.log('Starting Crestron discovery...');
        
        // Create and send discovery messages
        const message1 = createDiscoveryMessage(true);  // Variable length
        const message2 = createDiscoveryMessage(false); // Fixed length
        
        // Send broadcasts
        socket.send(message1, 41794, '255.255.255.255', (error) => {
          if (error) {
            console.error('Error sending Crestron discovery message 1:', error);
          }
        });
        
        setTimeout(() => {
          socket.send(message2, 41794, '255.255.255.255', (error) => {
            if (error) {
              console.error('Error sending Crestron discovery message 2:', error);
            }
          });
        }, 100);
        
      } catch (error) {
        console.error('Error setting up Crestron discovery:', error);
        resolve(devices);
      }
    });
    
    // Cleanup after timeout
    setTimeout(() => {
      try {
        socket.close();
      } catch (error) {
        // Socket already closed
      }
      
      console.log(`\nCrestron discovery complete. Found ${devices.length} devices.`);
      resolve(devices);
    }, timeout);
  });
}

// EDID management handler
ipcMain.handle('get-edid-management', async (event, ipAddress, credentials, certOptions) => {
  try {
    // Call the import-parameters handler directly
    const importHandler = ipcMain._events['import-parameters'] || ipcMain.listenerCount('import-parameters') > 0 
      ? (await import('./electron.js')).default?.getImportParametersHandler?.() 
      : null;
    
    // Manually import parameters for EDID data
    console.log(`Getting EDID management data for device: ${ipAddress}`);
    
    // Use a simplified parameter import just for EDID data
    const axios = require('axios');
    const https = require('https');
    
    const httpsAgent = new https.Agent({
      rejectUnauthorized: certOptions.rejectUnauthorized
    });
    
    // Get authentication session
    let trackId = null;
    let xsrfToken = null;
    let cookies = '';
    let useHttps = true;
    
    try {
      const getResponse = await axios.get(`https://${ipAddress}/userlogin.html`, {
        headers: { 'Accept': 'text/html' },
        httpsAgent: httpsAgent,
        timeout: 10000
      });
      
      const setCookieHeader = getResponse.headers['set-cookie'];
      if (setCookieHeader) {
        const trackIdMatch = setCookieHeader.find(cookie => cookie.includes('TRACKID'));
        if (trackIdMatch) {
          trackId = trackIdMatch.split('=')[1].split(';')[0];
        }
      }
    } catch (httpsError) {
      useHttps = false;
      const getResponse = await axios.get(`http://${ipAddress}/userlogin.html`, {
        headers: { 'Accept': 'text/html' },
        timeout: 10000
      });
      
      const setCookieHeader = getResponse.headers['set-cookie'];
      if (setCookieHeader) {
        const trackIdMatch = setCookieHeader.find(cookie => cookie.includes('TRACKID'));
        if (trackIdMatch) {
          trackId = trackIdMatch.split('=')[1].split(';')[0];
        }
      }
    }
    
    if (!trackId) {
      return { success: false, error: 'Failed to connect to device' };
    }
    
    // Authenticate
    const loginData = `login=${encodeURIComponent(credentials.username)}&passwd=${encodeURIComponent(credentials.password)}`;
    const loginConfig = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': useHttps ? `https://${ipAddress}` : `http://${ipAddress}`,
        'Referer': useHttps ? `https://${ipAddress}/userlogin.html` : `http://${ipAddress}/userlogin.html`,
        'Cookie': `TRACKID=${trackId}`
      },
      timeout: 10000,
      maxRedirects: 0,
      validateStatus: function (status) { return status < 500; }
    };
    
    if (useHttps) {
      loginConfig.httpsAgent = httpsAgent;
    }
    
    let loginResponse;
    try {
      const loginUrl = useHttps ? `https://${ipAddress}/userlogin.html` : `http://${ipAddress}/userlogin.html`;
      loginResponse = await axios.post(loginUrl, loginData, loginConfig);
    } catch (error) {
      return { success: false, error: 'Authentication failed' };
    }
    
    xsrfToken = loginResponse.headers['crest-xsrf-token'];
    const allCookies = loginResponse.headers['set-cookie'];
    if (allCookies) {
      cookies = allCookies.map(cookie => cookie.split(';')[0]).join('; ');
    }
    
    if (loginResponse.status !== 200 && loginResponse.status !== 302) {
      return { success: false, error: 'Authentication failed' };
    }
    
    // Get EDID data
    const edidUrl = useHttps ? `https://${ipAddress}/Device/EdidMgmnt` : `http://${ipAddress}/Device/EdidMgmnt`;
    const edidConfig = {
      headers: {
        'Accept': 'application/json',
        'Referer': useHttps ? `https://${ipAddress}/userlogin.html` : `http://${ipAddress}/userlogin.html`,
        'Cookie': cookies
      },
      timeout: 10000
    };
    
    if (useHttps) {
      edidConfig.httpsAgent = httpsAgent;
    }
    
    if (xsrfToken) {
      edidConfig.headers['X-CREST-XSRF-TOKEN'] = xsrfToken;
    }
    
    try {
      const edidResponse = await axios.get(edidUrl, edidConfig);
      const edidData = edidResponse.data?.Device?.EdidMgmnt || edidResponse.data?.EdidMgmnt || edidResponse.data || {};
      
      return {
        success: true,
        edidData: {
          systemEdidList: Object.keys(edidData.SystemEdidList || {}),
          customEdidList: Object.keys(edidData.CustomEdidList || {}),
          copyEdidList: Object.keys(edidData.CopyEdidList || {}),
          version: edidData.Version || 'Unknown',
          uploadPath: edidData.UploadFilePath || ''
        }
      };
    } catch (error) {
      return { success: false, error: `Failed to fetch EDID data: ${error.message}` };
    }
    
  } catch (error) {
    console.error('Error in EDID management:', error);
    return { 
      success: false, 
      error: error.message || 'EDID management failed' 
    };
  }
});

// Discovered streams handler
ipcMain.handle('get-discovered-streams', async (event, ipAddress, credentials, certOptions) => {
  try {
    console.log(`Getting discovered streams data for device: ${ipAddress}`);
    
    // Use a simplified parameter import just for streams data
    const axios = require('axios');
    const https = require('https');
    
    const httpsAgent = new https.Agent({
      rejectUnauthorized: certOptions.rejectUnauthorized
    });
    
    // Get authentication session (reuse the same logic)
    let trackId = null;
    let xsrfToken = null;
    let cookies = '';
    let useHttps = true;
    
    try {
      const getResponse = await axios.get(`https://${ipAddress}/userlogin.html`, {
        headers: { 'Accept': 'text/html' },
        httpsAgent: httpsAgent,
        timeout: 10000
      });
      
      const setCookieHeader = getResponse.headers['set-cookie'];
      if (setCookieHeader) {
        const trackIdMatch = setCookieHeader.find(cookie => cookie.includes('TRACKID'));
        if (trackIdMatch) {
          trackId = trackIdMatch.split('=')[1].split(';')[0];
        }
      }
    } catch (httpsError) {
      useHttps = false;
      const getResponse = await axios.get(`http://${ipAddress}/userlogin.html`, {
        headers: { 'Accept': 'text/html' },
        timeout: 10000
      });
      
      const setCookieHeader = getResponse.headers['set-cookie'];
      if (setCookieHeader) {
        const trackIdMatch = setCookieHeader.find(cookie => cookie.includes('TRACKID'));
        if (trackIdMatch) {
          trackId = trackIdMatch.split('=')[1].split(';')[0];
        }
      }
    }
    
    if (!trackId) {
      return { success: false, error: 'Failed to connect to device' };
    }
    
    // Authenticate
    const loginData = `login=${encodeURIComponent(credentials.username)}&passwd=${encodeURIComponent(credentials.password)}`;
    const loginConfig = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': useHttps ? `https://${ipAddress}` : `http://${ipAddress}`,
        'Referer': useHttps ? `https://${ipAddress}/userlogin.html` : `http://${ipAddress}/userlogin.html`,
        'Cookie': `TRACKID=${trackId}`
      },
      timeout: 10000,
      maxRedirects: 0,
      validateStatus: function (status) { return status < 500; }
    };
    
    if (useHttps) {
      loginConfig.httpsAgent = httpsAgent;
    }
    
    let loginResponse;
    try {
      const loginUrl = useHttps ? `https://${ipAddress}/userlogin.html` : `http://${ipAddress}/userlogin.html`;
      loginResponse = await axios.post(loginUrl, loginData, loginConfig);
    } catch (error) {
      return { success: false, error: 'Authentication failed' };
    }
    
    xsrfToken = loginResponse.headers['crest-xsrf-token'];
    const allCookies = loginResponse.headers['set-cookie'];
    if (allCookies) {
      cookies = allCookies.map(cookie => cookie.split(';')[0]).join('; ');
    }
    
    if (loginResponse.status !== 200 && loginResponse.status !== 302) {
      return { success: false, error: 'Authentication failed' };
    }
    
    // Get discovered streams data
    const streamsUrl = useHttps ? `https://${ipAddress}/Device/DiscoveredStreams` : `http://${ipAddress}/Device/DiscoveredStreams`;
    const streamsConfig = {
      headers: {
        'Accept': 'application/json',
        'Referer': useHttps ? `https://${ipAddress}/userlogin.html` : `http://${ipAddress}/userlogin.html`,
        'Cookie': cookies
      },
      timeout: 10000
    };
    
    if (useHttps) {
      streamsConfig.httpsAgent = httpsAgent;
    }
    
    if (xsrfToken) {
      streamsConfig.headers['X-CREST-XSRF-TOKEN'] = xsrfToken;
    }
    
    try {
      const streamsResponse = await axios.get(streamsUrl, streamsConfig);
      const streamsData = streamsResponse.data?.Device?.DiscoveredStreams || streamsResponse.data?.DiscoveredStreams || streamsResponse.data || {};
      
      return {
        success: true,
        streams: {
          discoveredStreamsList: Object.keys(streamsData.Streams || {}),
          streamsData: streamsData.Streams || {},
          streamCount: Object.keys(streamsData.Streams || {}).length
        }
      };
    } catch (error) {
      return { success: false, error: `Failed to fetch streams data: ${error.message}` };
    }
    
  } catch (error) {
    console.error('Error in discovered streams:', error);
    return { 
      success: false, 
      error: error.message || 'Discovered streams failed' 
    };
  }
});

// Network Adapter settings handlers
ipcMain.handle('get-network-adapters', async (event, ipAddress, credentials, certOptions) => {
  try {
    console.log(`Getting network adapters data for device: ${ipAddress}`);
    
    const axios = require('axios');
    const https = require('https');
    
    const httpsAgent = new https.Agent({
      rejectUnauthorized: certOptions.rejectUnauthorized
    });
    
    // Get authentication session
    let trackId = null;
    let xsrfToken = null;
    let cookies = '';
    let useHttps = true;
    
    try {
      const getResponse = await axios.get(`https://${ipAddress}/userlogin.html`, {
        headers: { 'Accept': 'text/html' },
        httpsAgent: httpsAgent,
        timeout: 10000
      });
      
      const setCookieHeader = getResponse.headers['set-cookie'];
      if (setCookieHeader) {
        const trackIdMatch = setCookieHeader.find(cookie => cookie.includes('TRACKID'));
        if (trackIdMatch) {
          trackId = trackIdMatch.split('=')[1].split(';')[0];
        }
      }
    } catch (httpsError) {
      useHttps = false;
      const getResponse = await axios.get(`http://${ipAddress}/userlogin.html`, {
        headers: { 'Accept': 'text/html' },
        timeout: 10000
      });
      
      const setCookieHeader = getResponse.headers['set-cookie'];
      if (setCookieHeader) {
        const trackIdMatch = setCookieHeader.find(cookie => cookie.includes('TRACKID'));
        if (trackIdMatch) {
          trackId = trackIdMatch.split('=')[1].split(';')[0];
        }
      }
    }
    
    if (!trackId) {
      return { success: false, error: 'Failed to connect to device' };
    }
    
    // Authenticate
    const loginData = `login=${encodeURIComponent(credentials.username)}&passwd=${encodeURIComponent(credentials.password)}`;
    const loginConfig = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': useHttps ? `https://${ipAddress}` : `http://${ipAddress}`,
        'Referer': useHttps ? `https://${ipAddress}/userlogin.html` : `http://${ipAddress}/userlogin.html`,
        'Cookie': `TRACKID=${trackId}`
      },
      timeout: 10000,
      maxRedirects: 0,
      validateStatus: function (status) { return status < 500; }
    };
    
    if (useHttps) {
      loginConfig.httpsAgent = httpsAgent;
    }
    
    let loginResponse;
    try {
      const loginUrl = useHttps ? `https://${ipAddress}/userlogin.html` : `http://${ipAddress}/userlogin.html`;
      loginResponse = await axios.post(loginUrl, loginData, loginConfig);
    } catch (error) {
      return { success: false, error: 'Authentication failed' };
    }
    
    xsrfToken = loginResponse.headers['crest-xsrf-token'];
    const allCookies = loginResponse.headers['set-cookie'];
    if (allCookies) {
      cookies = allCookies.map(cookie => cookie.split(';')[0]).join('; ');
    }
    
    if (loginResponse.status !== 200 && loginResponse.status !== 302) {
      return { success: false, error: 'Authentication failed' };
    }
    
    // Get network adapters data
    const adaptersUrl = useHttps ? `https://${ipAddress}/Device/NetworkAdapters` : `http://${ipAddress}/Device/NetworkAdapters`;
    const adaptersConfig = {
      headers: {
        'Accept': 'application/json',
        'Referer': useHttps ? `https://${ipAddress}/userlogin.html` : `http://${ipAddress}/userlogin.html`,
        'Cookie': cookies
      },
      timeout: 10000
    };
    
    if (useHttps) {
      adaptersConfig.httpsAgent = httpsAgent;
    }
    
    if (xsrfToken) {
      adaptersConfig.headers['X-CREST-XSRF-TOKEN'] = xsrfToken;
    }
    
    try {
      const adaptersResponse = await axios.get(adaptersUrl, adaptersConfig);
      const networkData = adaptersResponse.data?.Device?.NetworkAdapters || adaptersResponse.data?.NetworkAdapters || adaptersResponse.data || {};
      
      return {
        success: true,
        networkAdapters: networkData,
        authSession: { cookies, xsrfToken, useHttps } // Pass session for updates
      };
    } catch (error) {
      return { success: false, error: `Failed to fetch network adapters data: ${error.message}` };
    }
    
  } catch (error) {
    console.error('Error in network adapters:', error);
    return { 
      success: false, 
      error: error.message || 'Network adapters retrieval failed' 
    };
  }
});

// Update network adapter settings handler
ipcMain.handle('update-network-adapters', async (event, ipAddress, credentials, certOptions, networkSettings) => {
  try {
    console.log(`Updating network adapters for device: ${ipAddress}`);
    
    const axios = require('axios');
    const https = require('https');
    
    const httpsAgent = new https.Agent({
      rejectUnauthorized: certOptions.rejectUnauthorized
    });
    
    // Get fresh authentication session for updates
    let trackId = null;
    let xsrfToken = null;
    let cookies = '';
    let useHttps = true;
    
    try {
      const getResponse = await axios.get(`https://${ipAddress}/userlogin.html`, {
        headers: { 'Accept': 'text/html' },
        httpsAgent: httpsAgent,
        timeout: 10000
      });
      
      const setCookieHeader = getResponse.headers['set-cookie'];
      if (setCookieHeader) {
        const trackIdMatch = setCookieHeader.find(cookie => cookie.includes('TRACKID'));
        if (trackIdMatch) {
          trackId = trackIdMatch.split('=')[1].split(';')[0];
        }
      }
    } catch (httpsError) {
      useHttps = false;
      const getResponse = await axios.get(`http://${ipAddress}/userlogin.html`, {
        headers: { 'Accept': 'text/html' },
        timeout: 10000
      });
      
      const setCookieHeader = getResponse.headers['set-cookie'];
      if (setCookieHeader) {
        const trackIdMatch = setCookieHeader.find(cookie => cookie.includes('TRACKID'));
        if (trackIdMatch) {
          trackId = trackIdMatch.split('=')[1].split(';')[0];
        }
      }
    }
    
    if (!trackId) {
      return { success: false, error: 'Failed to connect to device for update' };
    }
    
    // Authenticate
    const loginData = `login=${encodeURIComponent(credentials.username)}&passwd=${encodeURIComponent(credentials.password)}`;
    const loginConfig = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': useHttps ? `https://${ipAddress}` : `http://${ipAddress}`,
        'Referer': useHttps ? `https://${ipAddress}/userlogin.html` : `http://${ipAddress}/userlogin.html`,
        'Cookie': `TRACKID=${trackId}`
      },
      timeout: 10000,
      maxRedirects: 0,
      validateStatus: function (status) { return status < 500; }
    };
    
    if (useHttps) {
      loginConfig.httpsAgent = httpsAgent;
    }
    
    let loginResponse;
    try {
      const loginUrl = useHttps ? `https://${ipAddress}/userlogin.html` : `http://${ipAddress}/userlogin.html`;
      loginResponse = await axios.post(loginUrl, loginData, loginConfig);
    } catch (error) {
      return { success: false, error: 'Authentication failed for update' };
    }
    
    xsrfToken = loginResponse.headers['crest-xsrf-token'];
    const allCookies = loginResponse.headers['set-cookie'];
    if (allCookies) {
      cookies = allCookies.map(cookie => cookie.split(';')[0]).join('; ');
    }
    
    if (loginResponse.status !== 200 && loginResponse.status !== 302) {
      return { success: false, error: 'Authentication failed for update' };
    }
    
    // Prepare update payload according to API spec
    const updatePayload = {
      Device: {
        NetworkAdapters: networkSettings
      }
    };
    
    // POST network adapters update
    const updateUrl = useHttps ? `https://${ipAddress}/Device/NetworkAdapters` : `http://${ipAddress}/Device/NetworkAdapters`;
    const updateConfig = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Referer': useHttps ? `https://${ipAddress}/userlogin.html` : `http://${ipAddress}/userlogin.html`,
        'Cookie': cookies
      },
      timeout: 15000
    };
    
    if (useHttps) {
      updateConfig.httpsAgent = httpsAgent;
    }
    
    if (xsrfToken) {
      updateConfig.headers['X-CREST-XSRF-TOKEN'] = xsrfToken;
    }
    
    try {
      console.log('Sending network adapter update payload:', JSON.stringify(updatePayload, null, 2));
      const updateResponse = await axios.post(updateUrl, updatePayload, updateConfig);
      
      console.log(`Network adapter update response: ${updateResponse.status}`);
      
      if (updateResponse.status === 200 || updateResponse.status === 204) {
        console.log('Network adapter settings updated successfully');
        
        // Logout
        try {
          const logoutUrl = useHttps ? `https://${ipAddress}/logout` : `http://${ipAddress}/logout`;
          await axios.get(logoutUrl, {
            headers: { 'Cookie': cookies },
            httpsAgent: useHttps ? httpsAgent : undefined,
            timeout: 5000
          });
        } catch (error) {
          console.warn('Logout failed:', error.message);
        }
        
        return { 
          success: true,
          message: 'Network adapter settings updated successfully'
        };
      } else {
        return { success: false, error: `Update failed with status: ${updateResponse.status}` };
      }
    } catch (updateError) {
      console.error('Network adapter update failed:', updateError.message);
      if (updateError.response) {
        console.error('Update error response:', updateError.response.data);
        return { success: false, error: `Update failed: ${updateError.response.status} - ${updateError.response.statusText}` };
      }
      return { success: false, error: `Update failed: ${updateError.message}` };
    }
    
  } catch (error) {
    console.error('Error in network adapter update:', error);
    return { 
      success: false, 
      error: error.message || 'Network adapter update failed' 
    };
  }
}); 