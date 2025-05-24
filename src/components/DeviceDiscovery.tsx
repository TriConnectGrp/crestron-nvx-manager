import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  RefreshCw, 
  Plus, 
  Network, 
  Monitor,
  Settings,
  Trash2,
  Play,
  Pause,
  MapPin,
  Zap,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Key,
  Shield
} from 'lucide-react';
import { deviceDiscoveryService, NVXDevice, DiscoveryOptions } from '../services/deviceDiscovery';
import { deviceConnectionService } from '../services/deviceConnection';

interface DeviceDiscoveryProps {
  onDeviceSelect?: (device: NVXDevice) => void;
  onDevicesChanged?: (devices: NVXDevice[]) => void;
}

interface LocateProgress {
  ipAddress: string;
  flashCount: number;
  elapsed: number;
  duration: number;
}

interface DeviceConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
}

const DeviceDiscovery: React.FC<DeviceDiscoveryProps> = ({ 
  onDeviceSelect, 
  onDevicesChanged 
}) => {
  const [devices, setDevices] = useState<NVXDevice[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [manualIP, setManualIP] = useState('');
  const [discoveryOptions, setDiscoveryOptions] = useState<Partial<DiscoveryOptions>>({
    timeout: 5000,
    enableMDNS: true,
    enableSSDP: true,
    enableNetworkScan: true,
    enableCrestronProtocol: true,
    networkRanges: ['192.168.1.0/24']
  });
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Bulk connection state
  const [showBulkConnection, setShowBulkConnection] = useState(false);
  const [bulkCredentials, setBulkCredentials] = useState({
    username: 'admin',
    password: ''
  });
  const [bulkCertOptions, setBulkCertOptions] = useState({
    type: 'any_certificate' as 'valid_ca_only' | 'valid_ca_and_self_signed' | 'any_certificate',
    rejectUnauthorized: false
  });
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [isBulkConnecting, setIsBulkConnecting] = useState(false);
  
  // Device connection status tracking
  const [deviceConnections, setDeviceConnections] = useState<Map<string, DeviceConnectionStatus>>(new Map());
  
  // Identify state (replaces locate)
  const [identifyingDevices, setIdentifyingDevices] = useState<Set<string>>(new Set());

  // Handle discovered devices callback
  const handleDevicesDiscovered = useCallback((discoveredDevices: NVXDevice[]) => {
    setDevices(discoveredDevices);
    onDevicesChanged?.(discoveredDevices);
  }, [onDevicesChanged]);

  useEffect(() => {
    // Subscribe to discovery updates
    deviceDiscoveryService.onDevicesDiscovered(handleDevicesDiscovered);
    
    // Load initial devices
    const initialDevices = deviceDiscoveryService.getDiscoveredDevices();
    setDevices(initialDevices);

    return () => {
      deviceDiscoveryService.removeDiscoveryCallback(handleDevicesDiscovered);
    };
  }, [handleDevicesDiscovered]);

  const handleStartDiscovery = async () => {
    setIsDiscovering(true);
    try {
      await deviceDiscoveryService.startDiscovery(discoveryOptions);
    } catch (error) {
      console.error('Discovery failed:', error);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleAddManualDevice = async () => {
    if (!manualIP.trim()) return;
    
    setIsDiscovering(true);
    try {
      const device = await deviceDiscoveryService.addDevice(manualIP.trim());
      if (device) {
        setManualIP('');
      } else {
        alert('Device not found at the specified IP address');
      }
    } catch (error) {
      console.error('Failed to add device:', error);
      alert('Failed to connect to device');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleRemoveDevice = (ip: string) => {
    deviceDiscoveryService.removeDevice(ip);
    setSelectedDevices(prev => {
      const newSet = new Set(prev);
      newSet.delete(ip);
      return newSet;
    });
    setDeviceConnections(prev => {
      const newMap = new Map(prev);
      newMap.delete(ip);
      return newMap;
    });
  };

  const handleDeviceClick = (device: NVXDevice) => {
    setSelectedDevice(device.ipAddress);
    onDeviceSelect?.(device);
  };

  const handleDeviceSelect = (ip: string, selected: boolean) => {
    setSelectedDevices(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(ip);
      } else {
        newSet.delete(ip);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedDevices.size === devices.length) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(devices.map(d => d.ipAddress)));
    }
  };

  const handleBulkConnect = async () => {
    if (selectedDevices.size === 0 || !bulkCredentials.username || !bulkCredentials.password) {
      alert('Please select devices and enter credentials');
      return;
    }

    setIsBulkConnecting(true);
    
    const connectPromises = Array.from(selectedDevices).map(async (ip) => {
      setDeviceConnections(prev => new Map(prev).set(ip, {
        isConnected: false,
        isConnecting: true
      }));

      try {
        const result = await window.electronAPI.connectDevice(ip, bulkCredentials, bulkCertOptions);
        
        setDeviceConnections(prev => new Map(prev).set(ip, {
          isConnected: result.success,
          isConnecting: false,
          error: result.success ? undefined : result.error
        }));

        return { ip, success: result.success, error: result.error };
      } catch (error) {
        setDeviceConnections(prev => new Map(prev).set(ip, {
          isConnected: false,
          isConnecting: false,
          error: error instanceof Error ? error.message : 'Connection failed'
        }));
        return { ip, success: false, error: error instanceof Error ? error.message : 'Connection failed' };
      }
    });

    try {
      const results = await Promise.all(connectPromises);
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      alert(`Bulk connection completed:\n✓ ${successful} successful\n✗ ${failed} failed`);
    } catch (error) {
      console.error('Bulk connection error:', error);
    } finally {
      setIsBulkConnecting(false);
    }
  };

  const handleLocateDevice = async (device: NVXDevice) => {
    const connectionStatus = deviceConnections.get(device.ipAddress);
    if (!connectionStatus?.isConnected) {
      alert('Device must be connected before using identify function');
      return;
    }

    setIdentifyingDevices(prev => new Set(prev).add(device.ipAddress));
    
    try {
      const result = await window.electronAPI.identifyDevice(
        device.ipAddress,
        bulkCredentials, // Use bulk credentials if device was connected via bulk
        bulkCertOptions,
        30 // 30 second duration
      );

      if (!result.success) {
        alert(`Identify failed: ${result.error}`);
      } else {
        // Show success message briefly
        setTimeout(() => {
          setIdentifyingDevices(prev => {
            const newSet = new Set(prev);
            newSet.delete(device.ipAddress);
            return newSet;
          });
        }, 2000); // Show identifying state for 2 seconds
      }
    } catch (error) {
      console.error('Identify error:', error);
      alert(`Identify failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIdentifyingDevices(prev => {
        const newSet = new Set(prev);
        newSet.delete(device.ipAddress);
        return newSet;
      });
    }
  };

  const handleStopLocate = async (ip: string) => {
    try {
      await window.electronAPI.stopLocate(ip);
    } catch (error) {
      console.error('Stop locate error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Network className="w-4 h-4" />;
      case 'offline': return <Monitor className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getDeviceTypeColor = (type: string) => {
    switch (type) {
      case 'transmitter': return 'bg-blue-100 text-blue-800';
      case 'receiver': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConnectionStatusIcon = (ip: string) => {
    const status = deviceConnections.get(ip);
    if (!status) return null;
    
    if (status.isConnecting) {
      return <Clock className="w-4 h-4 text-yellow-600 animate-spin" />;
    } else if (status.isConnected) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (status.error) {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Device Discovery
        </h2>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Settings className="w-4 h-4 mr-1" />
          Advanced
        </button>
      </div>

      {/* Discovery Controls */}
      <div className="space-y-4 mb-6">
        {/* Auto Discovery */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleStartDiscovery}
            disabled={isDiscovering}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {isDiscovering ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Discovering...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Start Discovery
              </>
            )}
          </button>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Found {devices.length} device{devices.length !== 1 ? 's' : ''}
          </div>
          
          {/* Bulk Connection Toggle */}
          {devices.length > 0 && (
            <button
              onClick={() => setShowBulkConnection(!showBulkConnection)}
              className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Users className="w-4 h-4 mr-2" />
              Bulk Connect
            </button>
          )}
        </div>

        {/* Manual Device Addition */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={manualIP}
            onChange={(e) => setManualIP(e.target.value)}
            placeholder="Enter IP address (e.g., 192.168.1.100)"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            onKeyPress={(e) => e.key === 'Enter' && handleAddManualDevice()}
          />
          <button
            onClick={handleAddManualDevice}
            disabled={isDiscovering || !manualIP.trim()}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </button>
        </div>

        {/* Bulk Connection Panel */}
        {showBulkConnection && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-purple-900 dark:text-purple-100 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Bulk Device Connection
              </h3>
              <div className="text-sm text-purple-700 dark:text-purple-300">
                {selectedDevices.size} device{selectedDevices.size !== 1 ? 's' : ''} selected
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Credentials */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200 flex items-center">
                  <Key className="w-4 h-4 mr-1" />
                  Credentials
                </h4>
                <div>
                  <label className="block text-xs text-purple-700 dark:text-purple-300 mb-1">Username</label>
                  <input
                    type="text"
                    value={bulkCredentials.username}
                    onChange={(e) => setBulkCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-purple-300 dark:border-purple-600 rounded bg-white dark:bg-purple-800"
                  />
                </div>
                <div>
                  <label className="block text-xs text-purple-700 dark:text-purple-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={bulkCredentials.password}
                    onChange={(e) => setBulkCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-purple-300 dark:border-purple-600 rounded bg-white dark:bg-purple-800"
                  />
                </div>
              </div>

              {/* Certificate Options */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200 flex items-center">
                  <Shield className="w-4 h-4 mr-1" />
                  Security
                </h4>
                <div>
                  <label className="block text-xs text-purple-700 dark:text-purple-300 mb-1">Certificate Validation</label>
                  <select
                    value={bulkCertOptions.type}
                    onChange={(e) => setBulkCertOptions(prev => ({ 
                      ...prev, 
                      type: e.target.value as 'valid_ca_only' | 'valid_ca_and_self_signed' | 'any_certificate',
                      rejectUnauthorized: e.target.value === 'valid_ca_only'
                    }))}
                    className="w-full px-2 py-1 text-sm border border-purple-300 dark:border-purple-600 rounded bg-white dark:bg-purple-800"
                  >
                    <option value="any_certificate">Any Certificate (Least Secure)</option>
                    <option value="valid_ca_and_self_signed">Valid CA + Self-Signed</option>
                    <option value="valid_ca_only">Valid CA Only (Most Secure)</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={handleSelectAll}
                    className="w-full px-3 py-2 text-sm bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors"
                  >
                    {selectedDevices.size === devices.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={handleBulkConnect}
                    disabled={isBulkConnecting || selectedDevices.size === 0 || !bulkCredentials.username || !bulkCredentials.password}
                    className="w-full px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                  >
                    {isBulkConnecting ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin inline" />
                        Connecting...
                      </>
                    ) : (
                      `Connect ${selectedDevices.size} Device${selectedDevices.size !== 1 ? 's' : ''}`
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-white">Discovery Options</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  value={discoveryOptions.timeout}
                  onChange={(e) => setDiscoveryOptions(prev => ({ 
                    ...prev, 
                    timeout: parseInt(e.target.value) || 5000 
                  }))}
                  className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-600"
                  min="1000"
                  max="30000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Network Range
                </label>
                <input
                  type="text"
                  value={discoveryOptions.networkRanges?.[0] || ''}
                  onChange={(e) => setDiscoveryOptions(prev => ({ 
                    ...prev, 
                    networkRanges: [e.target.value] 
                  }))}
                  placeholder="192.168.1.0/24"
                  className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={discoveryOptions.enableMDNS}
                  onChange={(e) => setDiscoveryOptions(prev => ({ 
                    ...prev, 
                    enableMDNS: e.target.checked 
                  }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">mDNS</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={discoveryOptions.enableSSDP}
                  onChange={(e) => setDiscoveryOptions(prev => ({ 
                    ...prev, 
                    enableSSDP: e.target.checked 
                  }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">SSDP</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={discoveryOptions.enableCrestronProtocol}
                  onChange={(e) => setDiscoveryOptions(prev => ({ 
                    ...prev, 
                    enableCrestronProtocol: e.target.checked 
                  }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Crestron Protocol</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Device List */}
      <div className="space-y-2">
        {devices.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No devices discovered yet</p>
            <p className="text-sm">Click "Start Discovery" to find NVX devices on your network</p>
          </div>
        ) : (
          devices.map((device) => {
            const isIdentifying = identifyingDevices.has(device.ipAddress);
            const connectionStatus = deviceConnections.get(device.ipAddress);
            const isSelected = selectedDevices.has(device.ipAddress);
            
            return (
              <div
                key={device.ipAddress}
                className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                  selectedDevice === device.ipAddress
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                } ${isSelected ? 'ring-2 ring-purple-300 dark:ring-purple-600' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Selection Checkbox */}
                    {showBulkConnection && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleDeviceSelect(device.ipAddress, e.target.checked)}
                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                      />
                    )}
                    
                    <div 
                      className={`${getStatusColor(device.status)} cursor-pointer`}
                      onClick={() => handleDeviceClick(device)}
                    >
                      {getStatusIcon(device.status)}
                    </div>
                    
                    <div onClick={() => handleDeviceClick(device)} className="cursor-pointer">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {device.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {device.ipAddress} • {device.model}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Connection Status */}
                    {connectionStatus && (
                      <div className="flex items-center gap-1 text-xs">
                        {getConnectionStatusIcon(device.ipAddress)}
                        <span className={`${
                          connectionStatus.isConnected ? 'text-green-600' : 
                          connectionStatus.isConnecting ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {connectionStatus.isConnecting ? 'Connecting...' :
                           connectionStatus.isConnected ? 'Connected' :
                           connectionStatus.error ? 'Failed' : 'Disconnected'}
                        </span>
                      </div>
                    )}
                    
                    {/* Locate Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isIdentifying) {
                          handleStopLocate(device.ipAddress);
                        } else {
                          handleLocateDevice(device);
                        }
                      }}
                      disabled={!connectionStatus?.isConnected}
                      className={`p-2 rounded-md transition-colors ${
                        isIdentifying 
                          ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      } disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
                      title={connectionStatus?.isConnected ? 
                        (isIdentifying ? 'Stop flashing LEDs' : 'Flash device LEDs') : 
                        'Connect device first to use identify'
                      }
                    >
                      {isIdentifying ? (
                        <Zap className="w-4 h-4 animate-pulse" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                    </button>
                    
                    <span className={`px-2 py-1 text-xs rounded-full ${getDeviceTypeColor(device.deviceType)}`}>
                      {device.deviceType}
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveDevice(device.ipAddress);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Connection Error */}
                {connectionStatus?.error && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    <p className="text-xs text-red-700 dark:text-red-300">
                      Connection failed: {connectionStatus.error}
                    </p>
                  </div>
                )}
                
                {device.capabilities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {device.capabilities.map((capability) => (
                      <span
                        key={capability}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded"
                      >
                        {capability.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Last seen: {device.lastSeen.toLocaleString()}
                  {device.firmwareVersion && device.firmwareVersion !== 'Unknown' && ` • Firmware: ${device.firmwareVersion}`}
                  {(device as any).buildDate && ` • Built: ${(device as any).buildDate}`}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DeviceDiscovery; 