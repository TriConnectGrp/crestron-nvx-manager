import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Globe, 
  Lock, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Eye,
  EyeOff,
  Settings,
  Shield,
  ChevronDown
} from 'lucide-react';
import { 
  deviceConnectionService, 
  DeviceCredentials, 
  ConnectionStatus,
  NVXDeviceParameters,
  CertificateOptions
} from '../services/deviceConnection';

interface DeviceConnectionProps {
  ipAddress: string;
  deviceName: string;
  onConnectionChange?: (isConnected: boolean) => void;
  onParametersImported?: (parameters: NVXDeviceParameters) => void;
}

const DeviceConnection: React.FC<DeviceConnectionProps> = ({
  ipAddress,
  deviceName,
  onConnectionChange,
  onParametersImported
}) => {
  const [credentials, setCredentials] = useState<DeviceCredentials>({
    username: '',
    password: ''
  });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ isConnected: false });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [certificateOptions, setCertificateOptions] = useState<CertificateOptions>({
    type: 'any_certificate',
    rejectUnauthorized: false
  });

  useEffect(() => {
    // Check initial connection status
    const status = deviceConnectionService.getConnectionStatus(ipAddress);
    setConnectionStatus(status);
    onConnectionChange?.(status.isConnected);
  }, [ipAddress, onConnectionChange]);

  const handleConnect = async () => {
    if (!credentials.username || !credentials.password) {
      setConnectionStatus({
        isConnected: false,
        error: 'Please enter username and password'
      });
      return;
    }

    setIsConnecting(true);
    setConnectionStatus({ isConnected: false });

    try {
      const result = await deviceConnectionService.connectToDevice(
        ipAddress, 
        credentials, 
        certificateOptions
      );
      
      const newStatus: ConnectionStatus = {
        isConnected: result.success,
        lastConnected: result.success ? new Date() : undefined,
        error: result.error
      };

      setConnectionStatus(newStatus);
      onConnectionChange?.(result.success);

      if (result.success) {
        // Clear any previous errors
        setImportError(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setConnectionStatus({
        isConnected: false,
        error: errorMessage
      });
      onConnectionChange?.(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    deviceConnectionService.disconnectDevice(ipAddress);
    setConnectionStatus({ isConnected: false });
    onConnectionChange?.(false);
    setImportError(null);
  };

  const handleImportParameters = async () => {
    setIsImporting(true);
    setImportError(null);

    try {
      const result = await deviceConnectionService.importDeviceParameters(ipAddress);
      
      if (result.success && result.parameters) {
        onParametersImported?.(result.parameters);
        
        // Show warning if mock data is being used
        if ((result as any).isMockData) {
          setImportError(
            'Warning: Real device data could not be retrieved. Displaying mock data for interface testing. ' +
            'This may indicate the device does not have the expected API endpoints or authentication failed.'
          );
        }
      } else {
        setImportError(result.error || 'Failed to import parameters');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      setImportError(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCertificateTypeChange = (type: CertificateOptions['type']) => {
    const newOptions: CertificateOptions = {
      type,
      rejectUnauthorized: type === 'valid_ca_only'
    };
    setCertificateOptions(newOptions);
  };

  const getCertificateDescription = (type: CertificateOptions['type']) => {
    switch (type) {
      case 'valid_ca_only':
        return 'Only accept certificates signed by a trusted Certificate Authority (CA). Most secure option.';
      case 'valid_ca_and_self_signed':
        return 'Accept valid CA certificates and self-signed certificates. Moderate security.';
      case 'any_certificate':
        return 'Accept any certificate presented by the device. Least secure but most compatible.';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    if (connectionStatus.isConnected) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (connectionStatus.error) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    } else {
      return <Globe className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (connectionStatus.isConnected) {
      return 'Connected';
    } else if (connectionStatus.error) {
      return 'Connection Failed';
    } else {
      return 'Not Connected';
    }
  };

  const getStatusColor = () => {
    if (connectionStatus.isConnected) {
      return 'text-green-600';
    } else if (connectionStatus.error) {
      return 'text-red-600';
    } else {
      return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Device Connection
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {deviceName} ({ipAddress})
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {!connectionStatus.isConnected ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                disabled={isConnecting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  disabled={isConnecting}
                  onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isConnecting}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Certificate Options */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Certificate Options
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
            
            {showAdvanced && (
              <div className="mt-3 space-y-3">
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="certificateType"
                      value="valid_ca_only"
                      checked={certificateOptions.type === 'valid_ca_only'}
                      onChange={(e) => handleCertificateTypeChange(e.target.value as CertificateOptions['type'])}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Valid CA Certificates Only
                    </span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="certificateType"
                      value="valid_ca_and_self_signed"
                      checked={certificateOptions.type === 'valid_ca_and_self_signed'}
                      onChange={(e) => handleCertificateTypeChange(e.target.value as CertificateOptions['type'])}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Valid CA + Self-Signed Certificates
                    </span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="certificateType"
                      value="any_certificate"
                      checked={certificateOptions.type === 'any_certificate'}
                      onChange={(e) => handleCertificateTypeChange(e.target.value as CertificateOptions['type'])}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Any Certificate (Not Recommended)
                    </span>
                  </label>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {getCertificateDescription(certificateOptions.type)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {connectionStatus.error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-700 dark:text-red-300">
                {connectionStatus.error}
              </p>
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={isConnecting || !credentials.username || !credentials.password}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Connect
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Network className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Successfully connected to device
              </span>
            </div>
            {connectionStatus.lastConnected && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Connected at {connectionStatus.lastConnected.toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleImportParameters}
              disabled={isImporting}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 transition-colors"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Import Parameters
                </>
              )}
            </button>
            
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Disconnect
            </button>
          </div>

          {importError && (
            <div className={`p-3 border rounded-md ${
              importError.startsWith('Warning:') 
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <p className={`text-sm ${
                importError.startsWith('Warning:')
                  ? 'text-yellow-700 dark:text-yellow-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {importError.startsWith('Warning:') ? 'ℹ️ ' : 'Import Error: '}{importError}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeviceConnection; 