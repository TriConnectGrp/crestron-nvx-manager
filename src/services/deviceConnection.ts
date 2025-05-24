export interface DeviceCredentials {
  username: string;
  password: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastConnected?: Date;
  error?: string;
}

export interface CertificateOptions {
  type: 'valid_ca_only' | 'valid_ca_and_self_signed' | 'any_certificate';
  rejectUnauthorized: boolean;
}

export interface NVXDeviceParameters {
  // Basic Device Info
  ipAddress: string;
  hostname: string;
  firmwareVersion: string;
  deviceName: string;
  serialNumber: string;
  
  // Streaming Parameters
  mode: string;
  startStop: boolean;
  status: string;
  streamType: string;
  bitrate: number;
  targetBitrate: number;
  preview: boolean;
  
  // Video Parameters
  videoMode: string;
  videoSource: string;
  xioRoute: string;
  scalerResolution: string;
  
  // Audio Parameters
  audioMode: string;
  audioSource: string;
  analogAudio: string;
  
  // HDMI Parameters
  syncHotplug: boolean;
  hdmi1EDID: string;
  hdmi1HDCP: boolean;
  hdmi2EDID: string;
  hdmi2HDCP: boolean;
  
  // Network Parameters
  igmp: boolean;
  ttl: number;
  streamLocation: string;
  multicastIP: string;
  multicastMAC: string;
  
  // NAX Parameters
  naxTxIP: string;
  naxTxMAC: string;
  naxRxIP: string;
  naxTxStartStop: boolean;
  naxTxStatus: string;
  naxTxMode: string;
  naxRxStartStop: boolean;
  naxRxStatus: string;
  naxRxMode: string;
  
  // USB Parameters
  usbMode: string;
  usbTransport: string;
  usbPairedDevices: string[];
  usbActions: string[];
  
  // Chassis Parameters
  chassisSlot: number;
  chassisTSID: string;
  chassisSerial: string;
  
  // Metadata
  lastUpdated: Date;
}

class DeviceConnectionService {
  private connections = new Map<string, ConnectionStatus>();
  private credentials = new Map<string, DeviceCredentials>();
  private deviceParameters = new Map<string, NVXDeviceParameters>();
  private certificateOptions = new Map<string, CertificateOptions>();

  /**
   * Connect to a device with username/password authentication and certificate options
   */
  async connectToDevice(
    ipAddress: string, 
    credentials: DeviceCredentials,
    certOptions?: CertificateOptions
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Set default certificate options if not provided
      const defaultCertOptions: CertificateOptions = {
        type: 'any_certificate',
        rejectUnauthorized: false
      };
      
      const options = certOptions || defaultCertOptions;
      this.certificateOptions.set(ipAddress, options);

      // Use Electron API for authentication
      const result = await window.electronAPI.connectDevice(ipAddress, credentials, options);
      
      if (result.success) {
        this.connections.set(ipAddress, {
          isConnected: true,
          lastConnected: new Date()
        });
        this.credentials.set(ipAddress, credentials);
        
        return { success: true };
      } else {
        this.connections.set(ipAddress, {
          isConnected: false,
          error: result.error
        });
        
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      
      this.connections.set(ipAddress, {
        isConnected: false,
        error: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Import all device parameters
   */
  async importDeviceParameters(ipAddress: string): Promise<{ success: boolean; parameters?: NVXDeviceParameters; error?: string }> {
    try {
      if (!this.isDeviceConnected(ipAddress)) {
        return { success: false, error: 'Device not connected. Please connect first.' };
      }

      const credentials = this.credentials.get(ipAddress);
      if (!credentials) {
        return { success: false, error: 'No credentials found for device.' };
      }

      const certOptions = this.certificateOptions.get(ipAddress) || {
        type: 'any_certificate',
        rejectUnauthorized: false
      };

      // Use Electron API for parameter import
      const result = await window.electronAPI.importParameters(ipAddress, credentials, certOptions);
      
      if (result.success && result.parameters) {
        // Add lastUpdated to parameters if not present
        const parameters = {
          ...result.parameters,
          lastUpdated: result.parameters.lastUpdated ? new Date(result.parameters.lastUpdated) : new Date()
        };
        
        this.deviceParameters.set(ipAddress, parameters);
        return { success: true, parameters };
      } else {
        return { success: false, error: result.error || 'Failed to import parameters' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Parameter import failed' 
      };
    }
  }

  /**
   * Get connection status for a device
   */
  getConnectionStatus(ipAddress: string): ConnectionStatus {
    return this.connections.get(ipAddress) || { isConnected: false };
  }

  /**
   * Check if device is connected
   */
  isDeviceConnected(ipAddress: string): boolean {
    const status = this.connections.get(ipAddress);
    return status?.isConnected || false;
  }

  /**
   * Get cached device parameters
   */
  getDeviceParameters(ipAddress: string): NVXDeviceParameters | undefined {
    return this.deviceParameters.get(ipAddress);
  }

  /**
   * Disconnect from device
   */
  disconnectDevice(ipAddress: string): void {
    this.connections.set(ipAddress, { isConnected: false });
    this.credentials.delete(ipAddress);
    this.certificateOptions.delete(ipAddress);
  }

  /**
   * Update specific parameter
   */
  async updateParameter(
    ipAddress: string, 
    parameter: string, 
    value: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isDeviceConnected(ipAddress)) {
        return { success: false, error: 'Device not connected' };
      }

      const credentials = this.credentials.get(ipAddress);
      if (!credentials) {
        return { success: false, error: 'No credentials found' };
      }

      const certOptions = this.certificateOptions.get(ipAddress) || {
        type: 'any_certificate',
        rejectUnauthorized: false
      };

      // Use Electron API for parameter update
      const result = await window.electronAPI.updateParameter(ipAddress, credentials, certOptions, parameter, value);
      
      if (result.success) {
        // Refresh parameters after update
        await this.importDeviceParameters(ipAddress);
      }
      
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Update failed' 
      };
    }
  }

  /**
   * Get all connected devices
   */
  getConnectedDevices(): string[] {
    const connected: string[] = [];
    Array.from(this.connections.entries()).forEach(([ip, status]) => {
      if (status.isConnected) {
        connected.push(ip);
      }
    });
    return connected;
  }

  /**
   * Get stored credentials for a device
   */
  getCredentials(ipAddress: string): DeviceCredentials | undefined {
    return this.credentials.get(ipAddress);
  }

  /**
   * Get stored certificate options for a device
   */
  getCertificateOptions(ipAddress: string): CertificateOptions | undefined {
    return this.certificateOptions.get(ipAddress);
  }
}

// Export singleton instance
export const deviceConnectionService = new DeviceConnectionService();
export default DeviceConnectionService; 