import React from 'react';
import { 
  Monitor, 
  Settings,
  Plus,
  Search,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Globe
} from 'lucide-react';

const Dashboard: React.FC = () => {
  // Define the stat structure for empty state
  const statsConfig = [
    {
      title: 'Total Devices',
      icon: Monitor
    },
    {
      title: 'Online Devices',
      icon: CheckCircle
    },
    {
      title: 'Offline Devices',
      icon: XCircle
    },
    {
      title: 'Alerts',
      icon: AlertTriangle
    }
  ];

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

      {/* Stats Grid - Empty State */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat, index) => {
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
                      0
                    </p>
                    <p className="text-sm font-medium text-gray-400">
                      No data
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

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device List - Empty State */}
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
          <div className="card-body">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No devices found
              </h4>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                Start by adding or discovering NVX devices on your network
              </p>
              <div className="flex space-x-3">
                <button className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add Device</span>
                </button>
                <button className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                  <span>Discover</span>
                </button>
              </div>
            </div>
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