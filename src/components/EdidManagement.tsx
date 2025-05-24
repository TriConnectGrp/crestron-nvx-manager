import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  List
} from 'lucide-react';

interface EdidManagementProps {
  ipAddress: string;
  credentials: any;
  certOptions: any;
}

interface EdidData {
  systemEdidList: string[];
  customEdidList: string[];
  copyEdidList: string[];
  version: string;
  uploadPath: string;
}

const EdidManagement: React.FC<EdidManagementProps> = ({ 
  ipAddress, 
  credentials, 
  certOptions 
}) => {
  const [edidData, setEdidData] = useState<EdidData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'system' | 'custom' | 'copy'>('system');

  const loadEdidData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await window.electronAPI.getEdidManagement(ipAddress, credentials, certOptions);
      
      if (result.success && result.edidData) {
        setEdidData(result.edidData);
      } else {
        setError(result.error || 'Failed to load EDID data');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ipAddress && credentials) {
      loadEdidData();
    }
  }, [ipAddress, credentials, certOptions]);

  const renderEdidList = (edids: string[], title: string, description: string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
          {edids.length} items
        </span>
      </div>
      
      {edids.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <Monitor className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No EDID entries found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {edids.map((edid, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
            >
              <div className="flex items-center gap-3">
                <Monitor className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {edid}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  title="View EDID details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                  title="Download EDID"
                >
                  <Download className="w-4 h-4" />
                </button>
                {selectedTab === 'custom' && (
                  <button
                    className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    title="Delete EDID"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading EDID data...</span>
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
            <p className="font-medium">Failed to load EDID data</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={loadEdidData}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!edidData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No EDID data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              EDID Management
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Device: {ipAddress} • Version: {edidData.version}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={loadEdidData}
            className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
            title="Refresh EDID data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            title="Upload custom EDID"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-600 mb-6">
        <button
          onClick={() => setSelectedTab('system')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            selectedTab === 'system'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <List className="w-4 h-4" />
            System EDIDs ({edidData.systemEdidList.length})
          </div>
        </button>
        <button
          onClick={() => setSelectedTab('custom')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            selectedTab === 'custom'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Custom EDIDs ({edidData.customEdidList.length})
          </div>
        </button>
        <button
          onClick={() => setSelectedTab('copy')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            selectedTab === 'copy'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Copy EDIDs ({edidData.copyEdidList.length})
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {selectedTab === 'system' && renderEdidList(
          edidData.systemEdidList,
          'System EDID List',
          'Pre-configured EDID settings provided by the system'
        )}
        
        {selectedTab === 'custom' && renderEdidList(
          edidData.customEdidList,
          'Custom EDID List',
          'User-uploaded custom EDID files'
        )}
        
        {selectedTab === 'copy' && renderEdidList(
          edidData.copyEdidList,
          'Copy EDID List',
          'EDID settings copied from connected outputs'
        )}
      </div>

      {/* Upload Path Info */}
      {edidData.uploadPath && (
        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Upload path: {edidData.uploadPath}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EdidManagement; 