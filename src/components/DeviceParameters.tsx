import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Network, 
  Volume2, 
  Settings, 
  Usb, 
  HardDrive,
  Info,
  Edit3,
  Save,
  X,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { NVXDeviceParameters, deviceConnectionService } from '../services/deviceConnection';

interface DeviceParametersProps {
  parameters: NVXDeviceParameters;
  ipAddress: string;
  onParameterUpdate?: (parameter: string, value: any) => void;
}

type ParameterTab = 'device' | 'streaming' | 'video' | 'audio' | 'network' | 'usb' | 'chassis';

const DeviceParameters: React.FC<DeviceParametersProps> = ({
  parameters,
  ipAddress,
  onParameterUpdate
}) => {
  const [activeTab, setActiveTab] = useState<ParameterTab>('device');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ [key: string]: any }>({});
  const [updatingField, setUpdatingField] = useState<string | null>(null);

  useEffect(() => {
    // Initialize edit values with current parameters
    setEditValues({});
    setEditingField(null);
  }, [parameters]);

  const handleEdit = (field: string, currentValue: any) => {
    setEditingField(field);
    setEditValues(prev => ({ ...prev, [field]: currentValue }));
  };

  const handleSave = async (field: string) => {
    setUpdatingField(field);
    
    try {
      const result = await deviceConnectionService.updateParameter(
        ipAddress, 
        field, 
        editValues[field]
      );
      
      if (result.success) {
        onParameterUpdate?.(field, editValues[field]);
        setEditingField(null);
      } else {
        console.error('Update failed:', result.error);
        // Could show error toast here
      }
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setUpdatingField(null);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValues(prev => {
      const newValues = { ...prev };
      if (editingField) {
        delete newValues[editingField];
      }
      return newValues;
    });
  };

  const tabs = [
    { id: 'device' as ParameterTab, label: 'Device Info', icon: Info },
    { id: 'streaming' as ParameterTab, label: 'Streaming', icon: Monitor },
    { id: 'video' as ParameterTab, label: 'Video', icon: Monitor },
    { id: 'audio' as ParameterTab, label: 'Audio', icon: Volume2 },
    { id: 'network' as ParameterTab, label: 'Network', icon: Network },
    { id: 'usb' as ParameterTab, label: 'USB', icon: Usb },
    { id: 'chassis' as ParameterTab, label: 'Chassis', icon: HardDrive }
  ];

  const renderField = (
    label: string, 
    field: string, 
    value: any, 
    type: 'text' | 'number' | 'boolean' | 'select' = 'text',
    options?: string[]
  ) => {
    const isEditing = editingField === field;
    const isUpdating = updatingField === field;

    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          {isEditing ? (
            <div className="mt-1">
              {type === 'boolean' ? (
                <select
                  value={editValues[field]?.toString() || 'false'}
                  onChange={(e) => setEditValues(prev => ({ 
                    ...prev, 
                    [field]: e.target.value === 'true' 
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : type === 'select' && options ? (
                <select
                  value={editValues[field] || value}
                  onChange={(e) => setEditValues(prev => ({ ...prev, [field]: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                >
                  {options.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={type}
                  value={editValues[field] ?? value}
                  onChange={(e) => setEditValues(prev => ({ 
                    ...prev, 
                    [field]: type === 'number' ? Number(e.target.value) : e.target.value 
                  }))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                />
              )}
            </div>
          ) : (
            <div className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
              {type === 'boolean' ? (value ? 'Yes' : 'No') : value}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 ml-4">
          {isEditing ? (
            <>
              <button
                onClick={() => handleSave(field)}
                disabled={isUpdating}
                className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
              >
                {isUpdating ? (
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isUpdating}
                className="p-1 text-gray-600 hover:text-gray-700 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => handleEdit(field, value)}
              className="p-1 text-gray-400 hover:text-blue-600"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderDeviceTab = () => (
    <div className="space-y-1">
      {renderField('IP Address', 'ipAddress', parameters.ipAddress)}
      {renderField('Hostname', 'hostname', parameters.hostname)}
      {renderField('Device Name', 'deviceName', parameters.deviceName)}
      {renderField('Firmware Version', 'firmwareVersion', parameters.firmwareVersion)}
      {renderField('Serial Number', 'serialNumber', parameters.serialNumber)}
    </div>
  );

  const renderStreamingTab = () => (
    <div className="space-y-1">
      {renderField('Mode', 'mode', parameters.mode, 'select', ['Transmitter', 'Receiver', 'Auto'])}
      {renderField('Start/Stop', 'startStop', parameters.startStop, 'boolean')}
      {renderField('Status', 'status', parameters.status)}
      {renderField('Stream Type', 'streamType', parameters.streamType, 'select', ['H.264', 'H.265', 'Raw'])}
      {renderField('Bitrate (Mbps)', 'bitrate', parameters.bitrate, 'number')}
      {renderField('Target Bitrate (Mbps)', 'targetBitrate', parameters.targetBitrate, 'number')}
      {renderField('Preview', 'preview', parameters.preview, 'boolean')}
    </div>
  );

  const renderVideoTab = () => (
    <div className="space-y-1">
      {renderField('Video Mode', 'videoMode', parameters.videoMode)}
      {renderField('Video Source', 'videoSource', parameters.videoSource)}
      {renderField('Xio Route', 'xioRoute', parameters.xioRoute)}
      {renderField('Scaler Resolution', 'scalerResolution', parameters.scalerResolution)}
      {renderField('Sync/Hotplug', 'syncHotplug', parameters.syncHotplug, 'boolean')}
      {renderField('HDMI 1 EDID', 'hdmi1EDID', parameters.hdmi1EDID)}
      {renderField('HDMI 1 HDCP', 'hdmi1HDCP', parameters.hdmi1HDCP, 'boolean')}
      {renderField('HDMI 2 EDID', 'hdmi2EDID', parameters.hdmi2EDID)}
      {renderField('HDMI 2 HDCP', 'hdmi2HDCP', parameters.hdmi2HDCP, 'boolean')}
    </div>
  );

  const renderAudioTab = () => (
    <div className="space-y-1">
      {renderField('Audio Mode', 'audioMode', parameters.audioMode)}
      {renderField('Audio Source', 'audioSource', parameters.audioSource)}
      {renderField('Analog Audio', 'analogAudio', parameters.analogAudio)}
    </div>
  );

  const renderNetworkTab = () => (
    <div className="space-y-1">
      {renderField('IGMP', 'igmp', parameters.igmp, 'boolean')}
      {renderField('TTL', 'ttl', parameters.ttl, 'number')}
      {renderField('Stream Location', 'streamLocation', parameters.streamLocation)}
      {renderField('Multicast IP', 'multicastIP', parameters.multicastIP)}
      {renderField('Multicast MAC', 'multicastMAC', parameters.multicastMAC)}
      {renderField('NAX Tx IP', 'naxTxIP', parameters.naxTxIP)}
      {renderField('NAX Tx MAC', 'naxTxMAC', parameters.naxTxMAC)}
      {renderField('NAX Rx IP', 'naxRxIP', parameters.naxRxIP)}
      {renderField('NAX Tx Start/Stop', 'naxTxStartStop', parameters.naxTxStartStop, 'boolean')}
      {renderField('NAX Tx Status', 'naxTxStatus', parameters.naxTxStatus)}
      {renderField('NAX Tx Mode', 'naxTxMode', parameters.naxTxMode)}
      {renderField('NAX Rx Start/Stop', 'naxRxStartStop', parameters.naxRxStartStop, 'boolean')}
      {renderField('NAX Rx Status', 'naxRxStatus', parameters.naxRxStatus)}
      {renderField('NAX Rx Mode', 'naxRxMode', parameters.naxRxMode)}
    </div>
  );

  const renderUSBTab = () => (
    <div className="space-y-1">
      {renderField('USB Mode', 'usbMode', parameters.usbMode)}
      {renderField('USB Transport', 'usbTransport', parameters.usbTransport)}
      <div className="py-2 border-b border-gray-100 dark:border-gray-700">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          USB Paired Devices
        </label>
        <div className="mt-1">
          {parameters.usbPairedDevices.length > 0 ? (
            parameters.usbPairedDevices.map((device, index) => (
              <div key={index} className="text-sm text-gray-900 dark:text-white font-mono">
                {device}
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">No paired devices</div>
          )}
        </div>
      </div>
      <div className="py-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          USB Actions
        </label>
        <div className="mt-1">
          {parameters.usbActions.length > 0 ? (
            parameters.usbActions.map((action, index) => (
              <div key={index} className="text-sm text-gray-900 dark:text-white font-mono">
                {action}
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">No available actions</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderChassisTab = () => (
    <div className="space-y-1">
      {renderField('Chassis Slot', 'chassisSlot', parameters.chassisSlot, 'number')}
      {renderField('Chassis TSID', 'chassisTSID', parameters.chassisTSID)}
      {renderField('Chassis Serial', 'chassisSerial', parameters.chassisSerial)}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'device': return renderDeviceTab();
      case 'streaming': return renderStreamingTab();
      case 'video': return renderVideoTab();
      case 'audio': return renderAudioTab();
      case 'network': return renderNetworkTab();
      case 'usb': return renderUSBTab();
      case 'chassis': return renderChassisTab();
      default: return renderDeviceTab();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Device Parameters
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            Last updated: {parameters.lastUpdated.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-600">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default DeviceParameters; 