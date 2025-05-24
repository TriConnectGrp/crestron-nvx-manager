import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Play, 
  Square,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { 
  deviceConnectionService,
  DeviceCredentials,
  CertificateOptions
} from '../services/deviceConnection';

interface DeviceLocateProps {
  ipAddress: string;
  deviceName: string;
}

interface IdentifyProgress {
  isIdentifying: boolean;
  timeRemaining: number;
  totalDuration: number;
}

const DeviceLocate: React.FC<DeviceLocateProps> = ({
  ipAddress,
  deviceName
}) => {
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [duration, setDuration] = useState(30);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Local timer for progress tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isIdentifying && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsIdentifying(false);
            setResult(`Device identify completed successfully! Device was identified for ${duration} seconds.`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isIdentifying, timeRemaining, duration]);

  const handleStartIdentify = async () => {
    // Check if device is connected
    if (!deviceConnectionService.isDeviceConnected(ipAddress)) {
      setError('Device not connected. Please connect to the device first.');
      return;
    }

    const credentials = deviceConnectionService.getCredentials(ipAddress);
    const certOptions = deviceConnectionService.getCertificateOptions(ipAddress);

    if (!credentials) {
      setError('No credentials found. Please reconnect to the device.');
      return;
    }

    setIsIdentifying(true);
    setTimeRemaining(duration);
    setError(null);
    setResult(null);

    try {
      const result = await window.electronAPI.identifyDevice(
        ipAddress, 
        credentials, 
        certOptions, 
        duration
      );

      if (result.success) {
        setResult(`Device identify started successfully! Device will be identified for ${result.duration || duration} seconds.`);
      } else {
        setError(result.error || 'Identify failed');
        setIsIdentifying(false);
        setTimeRemaining(0);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Identify failed');
      setIsIdentifying(false);
      setTimeRemaining(0);
    }
  };

  const handleStopIdentify = async () => {
    try {
      // For identify, we just need to reset the local state
      // The device will automatically stop after the duration
      setIsIdentifying(false);
      setTimeRemaining(0);
      setResult('Device identify operation stopped manually.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to stop identify');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getProgressPercentage = () => {
    if (!isIdentifying || duration === 0) return 0;
    return Math.min(((duration - timeRemaining) / duration) * 100, 100);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Identify Device
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {deviceName} ({ipAddress})
            </p>
          </div>
        </div>
        
        {isIdentifying && (
          <div className="flex items-center gap-2 text-blue-600">
            <Zap className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-medium">Identifying Device...</span>
          </div>
        )}
      </div>

      {/* Duration Setting */}
      {!isIdentifying && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Identify Duration
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 min-w-[60px]">
              <Clock className="w-4 h-4" />
              {formatTime(duration)}
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>5s</span>
            <span>2min</span>
          </div>
        </div>
      )}

      {/* Progress Display */}
      {isIdentifying && (
        <div className="mb-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progress:</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {duration - timeRemaining}s / {duration}s
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Time Remaining:</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mb-4">
        {!isIdentifying ? (
          <button
            onClick={handleStartIdentify}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex-1"
          >
            <Play className="w-4 h-4" />
            Start Identify
          </button>
        ) : (
          <button
            onClick={handleStopIdentify}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex-1"
          >
            <Square className="w-4 h-4" />
            Stop Identify
          </button>
        )}
      </div>

      {/* Result/Error Messages */}
      {result && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-800 dark:text-green-200">{result}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <strong>Device Identify:</strong> This feature will activate the device's identification system 
          for the specified duration. The exact identification method (LEDs, display, etc.) depends on 
          the device model and firmware version.
        </p>
      </div>
    </div>
  );
};

export default DeviceLocate; 