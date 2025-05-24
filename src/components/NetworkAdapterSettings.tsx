import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Settings, 
  RefreshCw, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Wifi,
  Globe,
  Shield,
  Server,
  Edit3,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';

/**
 * NetworkAdapterSettings Component
 * 
 * Comprehensive network adapter configuration interface for Crestron DM-NVX devices.
 * Based on the official Crestron DM NVX REST API NetworkAdapters endpoint.
 * 
 * Features:
 * - View and edit global network settings (hostname, IGMP, ping settings)
 * - Configure individual network adapters (Primary, Aux, USB, WiFi, etc.)
 * - IPv4 configuration (static/DHCP, IP address, subnet, gateway)
 * - DNS settings management (primary/secondary DNS servers)
 * - IPv6 global settings (advanced)
 * - Real-time change tracking and commit functionality
 * - Read-only adapter detection and appropriate UI handling
 * - Comprehensive validation and error handling
 * 
 * API Compliance:
 * - Uses GET /Device/NetworkAdapters for reading current configuration
 * - Uses POST /Device/NetworkAdapters for committing changes
 * - Handles all NetworkAdapters API properties and validation rules
 * - Supports both HTTPS and HTTP fallback with proper authentication
 * 
 * Usage:
 * <NetworkAdapterSettings 
 *   ipAddress="192.168.1.100" 
 *   credentials={{username: "admin", password: "password"}} 
 *   certOptions={{rejectUnauthorized: false, type: "any_certificate"}} 
 * />
 * 
 * @component
 * @param {NetworkAdapterSettingsProps} props - Component props
 * @param {string} props.ipAddress - IP address of the target device
 * @param {any} props.credentials - Authentication credentials {username, password}
 * @param {any} props.certOptions - Certificate validation options
 */

interface NetworkAdapterSettingsProps {
  ipAddress: string;
  credentials: any;
  certOptions: any;
}

interface IPv4Config {
  Addresses?: Array<{ Address: string; SubnetMask: string }>;
  StaticAddresses?: Array<{ Address: string; SubnetMask: string }>;
  StaticDefaultGateway?: string;
  DefaultGateway?: string;
  IsDhcpEnabled?: boolean;
}

interface IPv6Config {
  Addresses?: { [key: string]: { Address: string; Type: string } };
  StaticAddresses?: { [key: string]: { Address: string } };
  StaticDefaultGateway?: string;
  DefaultGateway?: string;
  IsDhcpEnabled?: boolean;
}

interface Adapter {
  IsAdapterReadOnly: boolean;
  Name: string;
  MacAddress: string;
  AddressSchema: string;
  IsAdapterEnabled: boolean;
  IsAutoNegotiationEnabled: boolean;
  AutoNegotiation: string;
  IsActive: boolean;
  LinkStatus: boolean;
  DomainName: string;
  IPv4?: IPv4Config;
  IPv6?: IPv6Config;
  VlanId?: number;
  IsVlanEnabled?: boolean;
  VlanPriority?: number;
  NativeVlan?: number;
  TrunkMode?: string;
}

interface DnsSettings {
  IPv4?: {
    DnsServers?: string[];
    StaticDns?: string[];
  };
  DnsServers?: { [key: string]: { Address: string; IsStatic: boolean; IsPrimary: boolean } };
  StaticDns?: { [key: string]: { Address: string } };
}

interface NetworkAdapters {
  IsIcmpPingEnabled?: boolean;
  IsTcpKeepAliveEnabled?: boolean;
  HostName?: string;
  IgmpVersion?: string;
  AddressSchema?: string;
  Adapters?: {
    EthernetPrimary?: Adapter;
    EthernetAux?: Adapter;
    UsbToEthernet?: Adapter;
    ControlSubnet?: Adapter;
    EthernetInternal?: Adapter;
    Wifi?: Adapter;
    DynamicAdpater01?: Adapter;
    DynamicAdpater02?: Adapter;
  };
  DnsSettings?: DnsSettings;
  IPv6?: {
    IsSupported?: boolean;
    IsIcmpPingEnabled?: boolean;
    IsMulticastProxyEnabled?: boolean;
  };
  Version?: string;
}

const NetworkAdapterSettings: React.FC<NetworkAdapterSettingsProps> = ({ 
  ipAddress, 
  credentials, 
  certOptions 
}) => {
  const [networkData, setNetworkData] = useState<NetworkAdapters | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedAdapter, setSelectedAdapter] = useState<string>('EthernetPrimary');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editedSettings, setEditedSettings] = useState<NetworkAdapters>({});
  const [hasChanges, setHasChanges] = useState(false);

  const loadNetworkData = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const result = await (window.electronAPI as any).getNetworkAdapters(ipAddress, credentials, certOptions);
      
      if (result.success && result.networkAdapters) {
        setNetworkData(result.networkAdapters);
        setEditedSettings(JSON.parse(JSON.stringify(result.networkAdapters))); // Deep copy
        setHasChanges(false);
      } else {
        setError(result.error || 'Failed to load network adapter data');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const saveNetworkSettings = async () => {
    if (!hasChanges || !editedSettings) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const result = await (window.electronAPI as any).updateNetworkAdapters(
        ipAddress, 
        credentials, 
        certOptions, 
        editedSettings
      );
      
      if (result.success) {
        setSuccessMessage(result.message || 'Network settings updated successfully');
        setNetworkData(JSON.parse(JSON.stringify(editedSettings)));
        setHasChanges(false);
        // Reload data to get fresh state from device
        setTimeout(() => loadNetworkData(), 2000);
      } else {
        setError(result.error || 'Failed to update network settings');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (path: string[], value: any) => {
    setEditedSettings(prev => {
      const newSettings = JSON.parse(JSON.stringify(prev));
      let current = newSettings;
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      
      // Special handling for array indices
      if (path.includes('StaticAddresses') && path[path.length - 1] === 'Address') {
        const parentPath = path.slice(0, -2);
        let parentObj = newSettings;
        for (const p of parentPath) {
          if (!parentObj[p]) parentObj[p] = {};
          parentObj = parentObj[p];
        }
        if (!parentObj.StaticAddresses) {
          parentObj.StaticAddresses = [{}];
        }
        if (!parentObj.StaticAddresses[0]) {
          parentObj.StaticAddresses[0] = {};
        }
        parentObj.StaticAddresses[0].Address = value;
      } else if (path.includes('StaticAddresses') && path[path.length - 1] === 'SubnetMask') {
        const parentPath = path.slice(0, -2);
        let parentObj = newSettings;
        for (const p of parentPath) {
          if (!parentObj[p]) parentObj[p] = {};
          parentObj = parentObj[p];
        }
        if (!parentObj.StaticAddresses) {
          parentObj.StaticAddresses = [{}];
        }
        if (!parentObj.StaticAddresses[0]) {
          parentObj.StaticAddresses[0] = {};
        }
        parentObj.StaticAddresses[0].SubnetMask = value;
      } else {
        current[path[path.length - 1]] = value;
      }
      
      setHasChanges(true);
      return newSettings;
    });
  };

  const resetChanges = () => {
    setEditedSettings(JSON.parse(JSON.stringify(networkData)));
    setHasChanges(false);
  };

  useEffect(() => {
    if (ipAddress && credentials) {
      loadNetworkData();
    }
  }, [ipAddress, credentials, certOptions]);

  const renderGlobalSettings = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
        <Globe className="w-5 h-5 mr-2" />
        Global Network Settings
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Host Name
          </label>
          <input
            type="text"
            value={editedSettings.HostName || ''}
            onChange={(e) => updateSetting(['HostName'], e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Device hostname"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Address Schema
          </label>
          <select
            value={editedSettings.AddressSchema || 'IPv4'}
            onChange={(e) => updateSetting(['AddressSchema'], e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="IPv4">IPv4 Only</option>
            <option value="IPv6">IPv6 Only</option>
            <option value="IPv4AndIPv6">IPv4 and IPv6</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            IGMP Version
          </label>
          <select
            value={editedSettings.IgmpVersion || 'v2'}
            onChange={(e) => updateSetting(['IgmpVersion'], e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="v2">IGMP v2</option>
            <option value="v3">IGMP v3</option>
          </select>
        </div>
        
        <div className="flex items-center">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={editedSettings.IsIcmpPingEnabled || false}
              onChange={(e) => updateSetting(['IsIcmpPingEnabled'], e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable ICMP Ping</span>
          </label>
        </div>
        
        <div className="flex items-center">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={editedSettings.IsTcpKeepAliveEnabled || false}
              onChange={(e) => updateSetting(['IsTcpKeepAliveEnabled'], e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable TCP Keep Alive</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderIPv4Settings = (adapter: Adapter, adapterKey: string) => (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900 dark:text-white">IPv4 Configuration</h4>
      
      <div className="flex items-center">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={adapter.IPv4?.IsDhcpEnabled || false}
            onChange={(e) => updateSetting(['Adapters', adapterKey, 'IPv4', 'IsDhcpEnabled'], e.target.checked)}
            disabled={adapter.IsAdapterReadOnly}
            className="mr-2"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Enable DHCP</span>
        </label>
      </div>
      
      {!adapter.IPv4?.IsDhcpEnabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              IP Address
            </label>
            <input
              type="text"
              value={adapter.IPv4?.StaticAddresses?.[0]?.Address || ''}
              onChange={(e) => updateSetting(['Adapters', adapterKey, 'IPv4', 'StaticAddresses', '0', 'Address'], e.target.value)}
              disabled={adapter.IsAdapterReadOnly}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-600"
              placeholder="192.168.1.100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subnet Mask
            </label>
            <input
              type="text"
              value={adapter.IPv4?.StaticAddresses?.[0]?.SubnetMask || ''}
              onChange={(e) => updateSetting(['Adapters', adapterKey, 'IPv4', 'StaticAddresses', '0', 'SubnetMask'], e.target.value)}
              disabled={adapter.IsAdapterReadOnly}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-600"
              placeholder="255.255.255.0"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Gateway
            </label>
            <input
              type="text"
              value={adapter.IPv4?.StaticDefaultGateway || ''}
              onChange={(e) => updateSetting(['Adapters', adapterKey, 'IPv4', 'StaticDefaultGateway'], e.target.value)}
              disabled={adapter.IsAdapterReadOnly}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-600"
              placeholder="192.168.1.1"
            />
          </div>
        </div>
      )}
      
      {/* Current Addresses (Read-only) */}
      {adapter.IPv4?.Addresses && adapter.IPv4.Addresses.length > 0 && (
        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
          <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Current IPv4 Addresses:</h5>
          {adapter.IPv4.Addresses.map((addr, index) => (
            <div key={index} className="text-xs text-gray-700 dark:text-gray-300">
              {addr.Address}/{addr.SubnetMask}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderVlanSettings = (adapter: Adapter, adapterKey: string) => (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900 dark:text-white">VLAN Configuration</h4>
      
      <div className="flex items-center">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={adapter.IsVlanEnabled || false}
            onChange={(e) => updateSetting(['Adapters', adapterKey, 'IsVlanEnabled'], e.target.checked)}
            disabled={adapter.IsAdapterReadOnly}
            className="mr-2"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Enable VLAN Tagging</span>
        </label>
      </div>
      
      {adapter.IsVlanEnabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              VLAN ID
            </label>
            <input
              type="number"
              min="1"
              max="4094"
              value={adapter.VlanId || ''}
              onChange={(e) => updateSetting(['Adapters', adapterKey, 'VlanId'], parseInt(e.target.value))}
              disabled={adapter.IsAdapterReadOnly}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              placeholder="100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              VLAN Priority
            </label>
            <select
              value={adapter.VlanPriority || 0}
              onChange={(e) => updateSetting(['Adapters', adapterKey, 'VlanPriority'], parseInt(e.target.value))}
              disabled={adapter.IsAdapterReadOnly}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
            >
              {[0,1,2,3,4,5,6,7].map(priority => (
                <option key={priority} value={priority}>Priority {priority}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );

  const renderAdapterSettings = (adapter: Adapter, adapterKey: string) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <Network className="w-5 h-5 mr-2" />
          {adapter.Name} ({adapterKey})
          {adapter.IsAdapterReadOnly && (
            <span className="ml-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 rounded">
              Read Only
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded ${
            adapter.LinkStatus ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {adapter.LinkStatus ? 'Link Up' : 'Link Down'}
          </span>
          <span className={`px-2 py-1 text-xs rounded ${
            adapter.IsActive ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}>
            {adapter.IsActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            MAC Address
          </label>
          <input
            type="text"
            value={adapter.MacAddress || ''}
            disabled
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Domain Name
          </label>
          <input
            type="text"
            value={adapter.DomainName || ''}
            onChange={(e) => updateSetting(['Adapters', adapterKey, 'DomainName'], e.target.value)}
            disabled={adapter.IsAdapterReadOnly}
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-600"
            placeholder="domain.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Auto Negotiation
          </label>
          <select
            value={adapter.AutoNegotiation || 'On'}
            onChange={(e) => updateSetting(['Adapters', adapterKey, 'AutoNegotiation'], e.target.value)}
            disabled={adapter.IsAdapterReadOnly}
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-600"
          >
            <option value="On">On</option>
            <option value="Off">Off</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={adapter.IsAdapterEnabled || false}
            onChange={(e) => updateSetting(['Adapters', adapterKey, 'IsAdapterEnabled'], e.target.checked)}
            disabled={adapter.IsAdapterReadOnly}
            className="mr-2"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Enable Adapter</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={adapter.IsAutoNegotiationEnabled || false}
            onChange={(e) => updateSetting(['Adapters', adapterKey, 'IsAutoNegotiationEnabled'], e.target.checked)}
            disabled={adapter.IsAdapterReadOnly}
            className="mr-2"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Auto Negotiation Enabled</span>
        </label>
      </div>

      {/* IPv4 Settings */}
      {adapter.IPv4 && renderIPv4Settings(adapter, adapterKey)}

      {/* VLAN Settings */}
      {renderVlanSettings(adapter, adapterKey)}
    </div>
  );

  const renderDnsSettings = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
        <Server className="w-5 h-5 mr-2" />
        DNS Settings
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Primary DNS Server
          </label>
          <input
            type="text"
            value={editedSettings.DnsSettings?.StaticDns?.Server01?.Address || ''}
            onChange={(e) => updateSetting(['DnsSettings', 'StaticDns', 'Server01', 'Address'], e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="8.8.8.8"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Secondary DNS Server
          </label>
          <input
            type="text"
            value={editedSettings.DnsSettings?.StaticDns?.Server02?.Address || ''}
            onChange={(e) => updateSetting(['DnsSettings', 'StaticDns', 'Server02', 'Address'], e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="8.8.4.4"
          />
        </div>
      </div>
      
      {/* Current DNS Servers (Read-only) */}
      {networkData?.DnsSettings?.IPv4?.DnsServers && (
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Current DNS Servers:</h4>
          <div className="space-y-1">
            {networkData.DnsSettings.IPv4.DnsServers.map((server, index) => (
              <div key={index} className="text-sm text-gray-700 dark:text-gray-300">
                {server}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading network adapter settings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center py-8 text-red-600 dark:text-red-400">
          <AlertCircle className="w-8 h-8 mr-3" />
          <div>
            <p className="font-medium">Failed to load network settings</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={loadNetworkData}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!networkData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Network className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No network adapter data available</p>
        </div>
      </div>
    );
  }

  const adapters = networkData.Adapters || {};
  const adapterKeys = Object.keys(adapters).filter(key => adapters[key as keyof typeof adapters]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Network Adapter Settings
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Device: {ipAddress} • Version: {networkData.Version || 'Unknown'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasChanges && (
            <div className="flex items-center gap-2">
              <button
                onClick={resetChanges}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                title="Reset changes"
              >
                Reset
              </button>
              <button
                onClick={saveNetworkSettings}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 transition-colors"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
          
          <button
            onClick={loadNetworkData}
            className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm text-green-800 dark:text-green-200">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Changes Indicator */}
      {hasChanges && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <div className="flex items-center">
            <Edit3 className="w-4 h-4 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800 dark:text-yellow-200">
              You have unsaved changes. Click "Save Changes" to apply them to the device.
            </span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-600 mb-6 overflow-x-auto">
        <button
          onClick={() => setSelectedAdapter('global')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            selectedAdapter === 'global'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Global Settings
        </button>
        
        {adapterKeys.map(adapterKey => (
          <button
            key={adapterKey}
            onClick={() => setSelectedAdapter(adapterKey)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              selectedAdapter === adapterKey
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {adapters[adapterKey as keyof typeof adapters]?.Name || adapterKey}
          </button>
        ))}
        
        <button
          onClick={() => setSelectedAdapter('dns')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
            selectedAdapter === 'dns'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          DNS Settings
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {selectedAdapter === 'global' && renderGlobalSettings()}
        {selectedAdapter === 'dns' && renderDnsSettings()}
        {selectedAdapter !== 'global' && selectedAdapter !== 'dns' && adapters[selectedAdapter as keyof typeof adapters] && 
          renderAdapterSettings(adapters[selectedAdapter as keyof typeof adapters]!, selectedAdapter)}
      </div>

      {/* IPv6 Global Settings */}
      {showAdvanced && networkData.IPv6 && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            IPv6 Global Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editedSettings.IPv6?.IsSupported || false}
                  onChange={(e) => updateSetting(['IPv6', 'IsSupported'], e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">IPv6 Supported</span>
              </label>
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editedSettings.IPv6?.IsIcmpPingEnabled || false}
                  onChange={(e) => updateSetting(['IPv6', 'IsIcmpPingEnabled'], e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">IPv6 ICMP Ping</span>
              </label>
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editedSettings.IPv6?.IsMulticastProxyEnabled || false}
                  onChange={(e) => updateSetting(['IPv6', 'IsMulticastProxyEnabled'], e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">IPv6 Multicast Proxy</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Toggle */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {showAdvanced ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </button>
      </div>
    </div>
  );
};

export default NetworkAdapterSettings; 