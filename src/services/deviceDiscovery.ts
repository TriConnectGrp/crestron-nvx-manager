import axios, { AxiosRequestConfig } from 'axios';

export interface NVXDevice {
  id: string;
  name: string;
  ipAddress: string;
  macAddress?: string;
  model: string;
  firmwareVersion: string;
  status: 'online' | 'offline' | 'unknown';
  lastSeen: Date;
  capabilities: string[];
  deviceType: 'transmitter' | 'receiver' | 'unknown';
}

export interface DiscoveryOptions {
  timeout: number;
  networkRanges: string[];
  enableMDNS: boolean;
  enableSSDP: boolean;
  enableNetworkScan: boolean;
  enableCrestronProtocol: boolean;
}

class DeviceDiscoveryService {
  private discoveredDevices: Map<string, NVXDevice> = new Map();
  private discoveryCallbacks: Array<(devices: NVXDevice[]) => void> = [];
  private isDiscovering = false;

  constructor() {
    this.setupDiscoveryInterval();
  }

  /**
   * Start device discovery with multiple methods
   */
  async startDiscovery(options: Partial<DiscoveryOptions> = {}): Promise<NVXDevice[]> {
    const defaultOptions: DiscoveryOptions = {
      timeout: 5000,
      networkRanges: this.getLocalNetworkRanges(),
      enableMDNS: true,
      enableSSDP: true,
      enableNetworkScan: true,
      enableCrestronProtocol: true,
      ...options
    };

    this.isDiscovering = true;
    const discoveryPromises: Promise<NVXDevice[]>[] = [];

    // Network range scanning
    if (defaultOptions.enableNetworkScan) {
      discoveryPromises.push(this.discoverByNetworkScan(defaultOptions.networkRanges, defaultOptions.timeout));
    }

    // mDNS discovery
    if (defaultOptions.enableMDNS) {
      discoveryPromises.push(this.discoverByMDNS(defaultOptions.timeout));
    }

    // SSDP discovery
    if (defaultOptions.enableSSDP) {
      discoveryPromises.push(this.discoverBySSDP(defaultOptions.timeout));
    }

    // Crestron proprietary discovery
    if (defaultOptions.enableCrestronProtocol) {
      discoveryPromises.push(this.discoverByCrestronProtocol(defaultOptions.timeout));
    }

    try {
      const results = await Promise.allSettled(discoveryPromises);
      const allDevices: NVXDevice[] = [];

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          allDevices.push(...result.value);
        }
      });

      // Deduplicate devices by IP address
      const uniqueDevices = this.deduplicateDevices(allDevices);
      
      // Update internal device map
      uniqueDevices.forEach(device => {
        this.discoveredDevices.set(device.ipAddress, device);
      });

      // Notify callbacks
      this.notifyDiscoveryCallbacks();

      return uniqueDevices;
    } finally {
      this.isDiscovering = false;
    }
  }

  /**
   * Network range scanning for NVX devices
   */
  private async discoverByNetworkScan(networkRanges: string[], timeout: number): Promise<NVXDevice[]> {
    const devices: NVXDevice[] = [];
    const scanPromises: Promise<NVXDevice | null>[] = [];

    for (const range of networkRanges) {
      const ips = this.generateIPRange(range);
      
      for (const ip of ips) {
        scanPromises.push(this.scanDeviceAtIP(ip, timeout));
      }
    }

    const results = await Promise.allSettled(scanPromises);
    
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        devices.push(result.value);
      }
    });

    return devices;
  }

  /**
   * Scan a specific IP for NVX device
   */
  private async scanDeviceAtIP(ip: string, timeout: number): Promise<NVXDevice | null> {
    try {
      // Try common NVX ports and endpoints
      const endpoints = [
        { port: 80, path: '/cws/control/system/info' },
        { port: 443, path: '/cws/control/system/info' },
        { port: 8080, path: '/cws/control/system/info' }
      ];

      for (const endpoint of endpoints) {
        try {
          const url = `http://${ip}:${endpoint.port}${endpoint.path}`;
          const requestConfig: AxiosRequestConfig = {
            timeout,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          };

          const response = await axios.get(url, requestConfig);
          
          if (response.data && this.isNVXDevice(response.data)) {
            return this.parseNVXDeviceInfo(ip, response.data);
          }
        } catch (error) {
          // Try HTTPS if HTTP fails
          if (endpoint.port === 80) {
            try {
              const httpsUrl = `https://${ip}:443${endpoint.path}`;
              const requestConfigForHTTPS: AxiosRequestConfig = {
                timeout,
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              };
              const httpsConfig: AxiosRequestConfig = { 
                ...requestConfigForHTTPS, 
                httpsAgent: new (require('https').Agent)({
                  rejectUnauthorized: false
                })
              };
              const response = await axios.get(httpsUrl, httpsConfig);
              
              if (response.data && this.isNVXDevice(response.data)) {
                return this.parseNVXDeviceInfo(ip, response.data);
              }
            } catch (httpsError) {
              // Continue to next endpoint
            }
          }
        }
      }
    } catch (error) {
      // Device not found or not responding
    }

    return null;
  }

  /**
   * mDNS/Bonjour discovery for NVX devices
   */
  private async discoverByMDNS(timeout: number): Promise<NVXDevice[]> {
    // Note: In Electron, we'll need to use the main process for mDNS
    // This is a placeholder for the mDNS implementation
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.electronAPI?.discoverMDNS) {
        window.electronAPI.discoverMDNS(timeout)
          .then((devices: any[]) => resolve(devices as NVXDevice[]))
          .catch(() => resolve([]));
      } else {
        resolve([]);
      }
    });
  }

  /**
   * SSDP discovery for UPnP devices
   */
  private async discoverBySSDP(timeout: number): Promise<NVXDevice[]> {
    // Note: SSDP discovery would be implemented in the main Electron process
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.electronAPI?.discoverSSDP) {
        window.electronAPI.discoverSSDP(timeout)
          .then((devices: any[]) => resolve(devices as NVXDevice[]))
          .catch(() => resolve([]));
      } else {
        resolve([]);
      }
    });
  }

  /**
   * Crestron proprietary discovery protocol
   */
  private async discoverByCrestronProtocol(timeout: number): Promise<NVXDevice[]> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.electronAPI?.discoverCrestron) {
        window.electronAPI.discoverCrestron(timeout)
          .then((devices: any[]) => resolve(devices as NVXDevice[]))
          .catch(() => resolve([]));
      } else {
        resolve([]);
      }
    });
  }

  /**
   * Validate if response indicates an NVX device
   */
  private isNVXDevice(data: any): boolean {
    // Check for DM-NVX specific identifiers in the response
    const nvxIndicators = [
      'DM-NVX',
      'DMPS',
      'Crestron'
    ];

    const responseStr = JSON.stringify(data).toLowerCase();
    
    // First check if it's a Crestron device
    const isCrestron = nvxIndicators.some(indicator => 
      responseStr.includes(indicator.toLowerCase())
    );
    
    if (!isCrestron) return false;
    
    // More specific check for DM-NVX devices
    if (responseStr.includes('dm-nvx') || responseStr.includes('dm nvx')) {
      return true;
    }
    
    // Check device model field specifically
    if (data.model && typeof data.model === 'string') {
      return data.model.toUpperCase().includes('DM-NVX');
    }
    
    // Check device name/description fields
    const fieldsToCheck = ['deviceName', 'friendlyName', 'description', 'productName'];
    for (const field of fieldsToCheck) {
      if (data[field] && typeof data[field] === 'string') {
        if (data[field].toUpperCase().includes('DM-NVX')) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Parse device information from API response
   */
  private parseNVXDeviceInfo(ip: string, data: any): NVXDevice {
    // Extract and validate model name
    const modelCandidates = [
      data.model,
      data.deviceType,
      data.productName,
      data.deviceName,
      data.friendlyName
    ].filter(Boolean);
    
    let model = 'Unknown DM-NVX';
    for (const candidate of modelCandidates) {
      if (typeof candidate === 'string' && candidate.toUpperCase().includes('DM-NVX')) {
        model = candidate;
        break;
      }
    }
    
    // Only proceed if this is actually a DM-NVX device
    if (!model.toUpperCase().includes('DM-NVX')) {
      model = 'DM-NVX (Unknown Model)';
    }

    const device: NVXDevice = {
      id: data.hostname || data.deviceId || ip,
      name: data.friendlyName || data.deviceName || data.hostname || `${model} (${ip})`,
      ipAddress: ip,
      macAddress: data.macAddress,
      model: model,
      firmwareVersion: data.firmwareVersion || data.version || 'Unknown',
      status: 'online',
      lastSeen: new Date(),
      capabilities: this.parseCapabilities(data, model),
      deviceType: this.determineDeviceType(data, model)
    };

    return device;
  }

  /**
   * Parse device capabilities from API response
   */
  private parseCapabilities(data: any, model: string): string[] {
    const capabilities: string[] = ['api_discovery'];
    
    // Extract capabilities from model number (e.g., DM-NVX-384)
    const portMatch = model.match(/DM-NVX-(\d+)/i);
    if (portMatch) {
      const portCount = parseInt(portMatch[1]);
      capabilities.push(`${portCount}_endpoints`);
    }
    
    // Standard DM-NVX capabilities
    capabilities.push('hdmi', '4k_support', 'hdcp', 'ethernet_streaming');
    
    // Parse from API response
    if (data.inputs) capabilities.push('video_input');
    if (data.outputs) capabilities.push('video_output');
    if (data.audioInputs) capabilities.push('audio_input');
    if (data.audioOutputs) capabilities.push('audio_output');
    if (data.networkPorts) capabilities.push('network_switching');
    if (data.streamingSupport) capabilities.push('streaming');
    
    return capabilities;
  }

  /**
   * Determine device type (transmitter/receiver)
   */
  private determineDeviceType(data: any, model: string): 'transmitter' | 'receiver' | 'unknown' {
    const modelStr = model.toLowerCase();
    const dataStr = JSON.stringify(data).toLowerCase();
    
    if (modelStr.includes('tx') || modelStr.includes('transmitter') || 
        dataStr.includes('transmitter') || dataStr.includes('encode')) {
      return 'transmitter';
    } else if (modelStr.includes('rx') || modelStr.includes('receiver') || 
               dataStr.includes('receiver') || dataStr.includes('decode')) {
      return 'receiver';
    }
    
    return 'unknown';
  }

  /**
   * Get local network ranges for scanning
   */
  private getLocalNetworkRanges(): string[] {
    // Default common network ranges
    return [
      '192.168.1.0/24',
      '192.168.0.0/24',
      '10.0.0.0/24',
      '172.16.0.0/24'
    ];
  }

  /**
   * Generate IP addresses from CIDR range
   */
  private generateIPRange(cidr: string): string[] {
    const [baseIP, maskBits] = cidr.split('/');
    const mask = parseInt(maskBits, 10);
    const [a, b, c, d] = baseIP.split('.').map(Number);
    
    const ips: string[] = [];
    const hostBits = 32 - mask;
    const numHosts = Math.pow(2, hostBits) - 2; // Exclude network and broadcast
    
    if (mask >= 24) {
      // /24 or smaller network
      for (let i = 1; i <= numHosts && i < 254; i++) {
        ips.push(`${a}.${b}.${c}.${i}`);
      }
    }
    
    return ips;
  }

  /**
   * Remove duplicate devices based on IP address
   */
  private deduplicateDevices(devices: NVXDevice[]): NVXDevice[] {
    const deviceMap = new Map<string, NVXDevice>();
    
    devices.forEach(device => {
      const existing = deviceMap.get(device.ipAddress);
      if (!existing || device.lastSeen > existing.lastSeen) {
        deviceMap.set(device.ipAddress, device);
      }
    });
    
    return Array.from(deviceMap.values());
  }

  /**
   * Add discovery callback
   */
  onDevicesDiscovered(callback: (devices: NVXDevice[]) => void): void {
    this.discoveryCallbacks.push(callback);
  }

  /**
   * Remove discovery callback
   */
  removeDiscoveryCallback(callback: (devices: NVXDevice[]) => void): void {
    const index = this.discoveryCallbacks.indexOf(callback);
    if (index > -1) {
      this.discoveryCallbacks.splice(index, 1);
    }
  }

  /**
   * Notify all callbacks of device changes
   */
  private notifyDiscoveryCallbacks(): void {
    const devices = Array.from(this.discoveredDevices.values());
    this.discoveryCallbacks.forEach(callback => callback(devices));
  }

  /**
   * Setup periodic discovery
   */
  private setupDiscoveryInterval(): void {
    // Refresh device status every 30 seconds
    setInterval(async () => {
      if (!this.isDiscovering && this.discoveredDevices.size > 0) {
        const devices = Array.from(this.discoveredDevices.values());
        for (const device of devices) {
          try {
            const updatedDevice = await this.scanDeviceAtIP(device.ipAddress, 3000);
            if (updatedDevice) {
              this.discoveredDevices.set(device.ipAddress, updatedDevice);
            } else {
              // Mark as offline
              device.status = 'offline';
              this.discoveredDevices.set(device.ipAddress, device);
            }
          } catch (error) {
            device.status = 'offline';
            this.discoveredDevices.set(device.ipAddress, device);
          }
        }
        this.notifyDiscoveryCallbacks();
      }
    }, 30000);
  }

  /**
   * Get all discovered devices
   */
  getDiscoveredDevices(): NVXDevice[] {
    return Array.from(this.discoveredDevices.values());
  }

  /**
   * Get device by IP
   */
  getDeviceByIP(ip: string): NVXDevice | undefined {
    return this.discoveredDevices.get(ip);
  }

  /**
   * Add device manually
   */
  async addDevice(ip: string): Promise<NVXDevice | null> {
    return this.scanDeviceAtIP(ip, 5000);
  }

  /**
   * Remove device from discovery
   */
  removeDevice(ip: string): void {
    this.discoveredDevices.delete(ip);
    this.notifyDiscoveryCallbacks();
  }

  /**
   * Clear all discovered devices
   */
  clearDevices(): void {
    this.discoveredDevices.clear();
    this.notifyDiscoveryCallbacks();
  }
}

// Export singleton instance
export const deviceDiscoveryService = new DeviceDiscoveryService();
export default DeviceDiscoveryService; 