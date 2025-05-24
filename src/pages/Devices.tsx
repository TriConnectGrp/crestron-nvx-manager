import React, { useState } from 'react';
import { 
  Monitor, 
  Settings, 
  Activity, 
  Globe,
  Network,
  Eye,
  Edit,
  Power,
  Database,
  MapPin
} from 'lucide-react';
import DeviceDiscovery from '../components/DeviceDiscovery';
import DeviceConnection from '../components/DeviceConnection';
import DeviceParameters from '../components/DeviceParameters';
import DeviceLocate from '../components/DeviceLocate';
import { NVXDevice } from '../services/deviceDiscovery';
import { NVXDeviceParameters } from '../services/deviceConnection';

const Devices: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<NVXDevice | null>(null);
  const [devices, setDevices] = useState<NVXDevice[]>([]);
  const [activeTab, setActiveTab] = useState<'discovery' | 'management' | 'parameters' | 'locate'>('discovery');
  const [isDeviceConnected, setIsDeviceConnected] = useState(false);
  const [deviceParameters, setDeviceParameters] = useState<NVXDeviceParameters | null>(null);

  const handleDeviceSelect = (device: NVXDevice) => {
    setSelectedDevice(device);
    setActiveTab('management');
    setIsDeviceConnected(false);
    setDeviceParameters(null);
  };

  const handleDevicesChanged = (newDevices: NVXDevice[]) => {
    setDevices(newDevices);
  };

  const handleConnectionChange = (connected: boolean) => {
    setIsDeviceConnected(connected);
    if (!connected) {
      setDeviceParameters(null);
    }
  };

  const handleParametersImported = (parameters: NVXDeviceParameters) => {
    setDeviceParameters(parameters);
    setActiveTab('parameters');
  };

  const handleParameterUpdate = (parameter: string, value: any) => {
    if (deviceParameters) {
      setDeviceParameters(prev => prev ? { ...prev, [parameter]: value, lastUpdated: new Date() } : null);
    }
  };

  const getDeviceStatusBadge = (status: string) => {
    const colors = {
      online: 'bg-green-100 text-green-800 border-green-200',
      offline: 'bg-red-100 text-red-800 border-red-200',
      unknown: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[status as keyof typeof colors] || colors.unknown;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Device Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover, connect, and manage your Crestron DM-NVX devices
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('discovery')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'discovery'
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Monitor className="w-4 h-4 inline-block mr-2" />
          Device Discovery
        </button>
        <button
          onClick={() => setActiveTab('management')}
          disabled={!selectedDevice}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === 'management'
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Settings className="w-4 h-4 inline-block mr-2" />
          Device Connection
        </button>
        <button
          onClick={() => setActiveTab('parameters')}
          disabled={!deviceParameters}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === 'parameters'
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Database className="w-4 h-4 inline-block mr-2" />
          Parameters & Settings
        </button>
        <button
          onClick={() => setActiveTab('locate')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'locate'
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <MapPin className="w-4 h-4 inline-block mr-2" />
          Locate
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === 'discovery' && (
            <DeviceDiscovery
              onDeviceSelect={handleDeviceSelect}
              onDevicesChanged={handleDevicesChanged}
            />
          )}

          {activeTab === 'management' && selectedDevice && (
            <div className="space-y-6">
              <DeviceConnection
                ipAddress={selectedDevice.ipAddress}
                deviceName={selectedDevice.name}
                onConnectionChange={handleConnectionChange}
                onParametersImported={handleParametersImported}
              />
              
              {/* Device List for Management Tab */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Available Devices
                </h2>

                {devices.length === 0 ? (
                  <div className="text-center py-12">
                    <Globe className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No devices found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Start device discovery to find and manage your NVX devices
                    </p>
                    <button
                      onClick={() => setActiveTab('discovery')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Go to Discovery
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {devices.map((device) => (
                      <div
                        key={device.ipAddress}
                        className={`p-4 border rounded-lg transition-all cursor-pointer ${
                          selectedDevice?.ipAddress === device.ipAddress
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedDevice(device)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              {isDeviceConnected && selectedDevice?.ipAddress === device.ipAddress ? (
                                <Network className="w-8 h-8 text-green-600" />
                              ) : (
                                <Monitor className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {device.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {device.ipAddress} • {device.model}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-1 text-xs rounded-full border ${getDeviceStatusBadge(device.status)}`}>
                                  {device.status}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {device.deviceType}
                                </span>
                                {isDeviceConnected && selectedDevice?.ipAddress === device.ipAddress && (
                                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                    Connected
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDevice(device);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Select Device"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'parameters' && deviceParameters && selectedDevice && (
            <DeviceParameters
              parameters={deviceParameters}
              ipAddress={selectedDevice.ipAddress}
              onParameterUpdate={handleParameterUpdate}
            />
          )}

          {activeTab === 'locate' && selectedDevice && (
            <DeviceLocate
              ipAddress={selectedDevice.ipAddress}
              deviceName={selectedDevice.name}
            />
          )}
        </div>

        {/* Sidebar - Device Details */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Device Details
            </h3>
            
            {selectedDevice ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {selectedDevice.name}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">IP Address:</span>
                      <span className="text-gray-900 dark:text-white font-mono">
                        {selectedDevice.ipAddress}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Model:</span>
                      <span className="text-gray-900 dark:text-white">
                        {selectedDevice.model}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Type:</span>
                      <span className="text-gray-900 dark:text-white capitalize">
                        {selectedDevice.deviceType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Connection:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        isDeviceConnected 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}>
                        {isDeviceConnected ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Firmware:</span>
                      <span className="text-gray-900 dark:text-white">
                        {selectedDevice.firmwareVersion}
                      </span>
                    </div>
                    {selectedDevice.macAddress && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">MAC:</span>
                        <span className="text-gray-900 dark:text-white font-mono text-xs">
                          {selectedDevice.macAddress}
                        </span>
                      </div>
                    )}
                    {(selectedDevice as any).buildDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Build Date:</span>
                        <span className="text-gray-900 dark:text-white text-xs">
                          {(selectedDevice as any).buildDate}
                        </span>
                      </div>
                    )}
                    {(selectedDevice as any).deviceId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Device ID:</span>
                        <span className="text-gray-900 dark:text-white font-mono text-xs">
                          {(selectedDevice as any).deviceId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedDevice.capabilities.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                      Capabilities
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedDevice.capabilities.map((capability) => (
                        <span
                          key={capability}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded"
                        >
                          {capability.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                    Quick Actions
                  </h5>
                  <div className="space-y-2">
                    {!isDeviceConnected ? (
                      <button 
                        onClick={() => setActiveTab('management')}
                        className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Network className="w-4 h-4 mr-2" />
                        Connect
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => setActiveTab('parameters')}
                          disabled={!deviceParameters}
                          className="w-full flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 transition-colors"
                        >
                          <Database className="w-4 h-4 mr-2" />
                          View Parameters
                        </button>
                        <button className="w-full flex items-center justify-center px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors">
                          <Activity className="w-4 h-4 mr-2" />
                          Monitor
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {deviceParameters && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                      Parameter Summary
                    </h5>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Mode:</span>
                        <span className="text-gray-900 dark:text-white">{deviceParameters.mode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Stream Status:</span>
                        <span className="text-gray-900 dark:text-white">{deviceParameters.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Bitrate:</span>
                        <span className="text-gray-900 dark:text-white">{deviceParameters.bitrate} Mbps</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Last seen: {selectedDevice.lastSeen.toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Monitor className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 dark:text-gray-400">
                  Select a device to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Devices; 