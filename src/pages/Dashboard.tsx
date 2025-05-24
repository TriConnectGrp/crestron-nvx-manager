import React from 'react';
import { 
  Monitor, 
  Settings,
  Plus,
  Search,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

const Dashboard: React.FC = () => {
  // Mock data for demonstration
  const stats = [
    {
      title: 'Total Devices',
      value: '24',
      change: '+2',
      changeType: 'positive',
      icon: Monitor
    },
    {
      title: 'Online Devices',
      value: '22',
      change: '91.7%',
      changeType: 'positive',
      icon: CheckCircle
    },
    {
      title: 'Offline Devices',
      value: '2',
      change: '-1',
      changeType: 'positive',
      icon: XCircle
    },
    {
      title: 'Alerts',
      value: '3',
      change: '+1',
      changeType: 'negative',
      icon: AlertTriangle
    }
  ];

  const recentDevices = [
    {
      id: 1,
      name: 'NVX-D30-01',
      ip: '192.168.1.101',
      status: 'online',
      type: 'Decoder',
      lastSeen: '2 minutes ago'
    },
    {
      id: 2,
      name: 'NVX-E30-01',
      ip: '192.168.1.102',
      status: 'online',
      type: 'Encoder',
      lastSeen: '5 minutes ago'
    },
    {
      id: 3,
      name: 'NVX-D30-02',
      ip: '192.168.1.103',
      status: 'offline',
      type: 'Decoder',
      lastSeen: '2 hours ago'
    },
    {
      id: 4,
      name: 'NVX-E30-02',
      ip: '192.168.1.104',
      status: 'warning',
      type: 'Encoder',
      lastSeen: '1 minute ago'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-success-600 bg-success-100 dark:bg-success-900 dark:text-success-200';
      case 'offline':
        return 'text-error-600 bg-error-100 dark:bg-error-900 dark:text-error-200';
      case 'warning':
        return 'text-warning-600 bg-warning-100 dark:bg-warning-900 dark:text-warning-200';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Crestron NVX Manager</h1>
            <p className="text-primary-100 text-lg">
              Manage your DM-NVX audio/video devices with confidence
            </p>
          </div>
          <div className="flex space-x-4">
            <button className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-primary-50 transition-colors duration-200 flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Add Device</span>
            </button>
            <button className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-400 transition-colors duration-200 flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Discover</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className={`text-sm font-medium ${
                      stat.changeType === 'positive' 
                        ? 'text-success-600' 
                        : 'text-error-600'
                    }`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
                    <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device List */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Devices
              </h3>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="card-body space-y-4">
            {recentDevices.map((device) => (
              <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Monitor className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {device.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {device.ip} • {device.type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                    {device.status}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {device.lastSeen}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h3>
          </div>
          <div className="card-body space-y-3">
            <button className="w-full flex items-center space-x-3 p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
              <Plus className="w-5 h-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Add New Device</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manually add a device to your network</p>
              </div>
            </button>
            
            <button className="w-full flex items-center space-x-3 p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
              <Search className="w-5 h-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Discover Devices</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Scan network for NVX devices</p>
              </div>
            </button>
            
            <button className="w-full flex items-center space-x-3 p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">View Reports</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">System performance and analytics</p>
              </div>
            </button>
            
            <button className="w-full flex items-center space-x-3 p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
              <Settings className="w-5 h-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">System Settings</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configure application preferences</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 