import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  RefreshCw, 
  AlertCircle, 
  Eye, 
  Play,
  Pause,
  Monitor,
  Volume2,
  Wifi,
  Settings,
  Activity
} from 'lucide-react';

interface StreamsManagementProps {
  ipAddress: string;
  credentials: any;
  certOptions: any;
}

interface StreamData {
  UniqueId: string;
  Bitrate: number;
  SessionName: string;
  Transport: string;
  VideoFormat: string;
  Resolution: string;
  Fps: number;
  AudioFormat: string;
  AudioChannels: number;
  Encryption: string;
  RtspUri: string;
  MulticastAddress: string;
  SnapshotUrl: string;
}

interface StreamsData {
  discoveredStreamsList: string[];
  streamsData: { [key: string]: StreamData };
  streamCount: number;
}

const StreamsManagement: React.FC<StreamsManagementProps> = ({ 
  ipAddress, 
  credentials, 
  certOptions 
}) => {
  const [streamsData, setStreamsData] = useState<StreamsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);

  const loadStreamsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await window.electronAPI.getDiscoveredStreams(ipAddress, credentials, certOptions);
      
      if (result.success && result.streams) {
        setStreamsData(result.streams);
      } else {
        setError(result.error || 'Failed to load streams data');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ipAddress && credentials) {
      loadStreamsData();
    }
  }, [ipAddress, credentials, certOptions]);

  const formatBitrate = (bitrate: number) => {
    if (bitrate >= 1000000) {
      return `${(bitrate / 1000000).toFixed(1)} Mbps`;
    } else if (bitrate >= 1000) {
      return `${(bitrate / 1000).toFixed(1)} Kbps`;
    }
    return `${bitrate} bps`;
  };

  const getVideoFormatColor = (format: string) => {
    switch (format.toLowerCase()) {
      case 'h264':
      case 'h.264':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'h265':
      case 'h.265':
      case 'hevc':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'j2k':
      case 'jpeg2000':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTransportColor = (transport: string) => {
    switch (transport.toLowerCase()) {
      case 'rtp/udp':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rtp/tcp':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'rtmp':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading streams data...</span>
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
            <p className="font-medium">Failed to load streams data</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={loadStreamsData}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!streamsData || streamsData.streamCount === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Radio className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No streams discovered</p>
          <p className="text-sm mt-1">This device hasn't discovered any active streams on the network</p>
          <button
            onClick={loadStreamsData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh Streams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Radio className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Discovered Streams
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Device: {ipAddress} • {streamsData.streamCount} stream{streamsData.streamCount !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>
        
        <button
          onClick={loadStreamsData}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          title="Refresh streams"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {streamsData.discoveredStreamsList.map((streamId) => {
          const stream = streamsData.streamsData[streamId];
          if (!stream) return null;
          
          const isSelected = selectedStream === streamId;
          
          return (
            <div
              key={streamId}
              className={`border rounded-lg p-4 transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
              onClick={() => setSelectedStream(isSelected ? null : streamId)}
            >
              {/* Stream Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-green-600" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {stream.SessionName || `Stream ${streamId}`}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ID: {stream.UniqueId}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getVideoFormatColor(stream.VideoFormat)}`}>
                    {stream.VideoFormat}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getTransportColor(stream.Transport)}`}>
                    {stream.Transport}
                  </span>
                </div>
              </div>

              {/* Stream Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">Resolution:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {stream.Resolution}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">FPS:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {stream.Fps}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">Audio:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {stream.AudioFormat} {stream.AudioChannels}ch
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">Bitrate:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatBitrate(stream.Bitrate)}
                  </span>
                </div>
              </div>

              {/* Expanded Details */}
              {isSelected && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Network Details</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">RTSP URI:</span>
                          <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 break-all">
                            {stream.RtspUri || 'Not available'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Multicast:</span>
                          <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1">
                            {stream.MulticastAddress || 'Not available'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Stream Properties</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Encryption:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {stream.Encryption}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Transport:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {stream.Transport}
                          </span>
                        </div>
                        {stream.SnapshotUrl && (
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Snapshot URL:</span>
                            <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 break-all">
                              {stream.SnapshotUrl}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                      <Play className="w-4 h-4 mr-2" />
                      Connect
                    </button>
                    <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </button>
                    <button className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StreamsManagement; 