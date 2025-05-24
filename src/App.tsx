import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { 
  Monitor, 
  Settings, 
  Activity, 
  Users, 
  Database
} from 'lucide-react';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';

// Types
interface AppState {
  darkMode: boolean;
  isConnected: boolean;
  appVersion: string;
}

// Main App Component with routing logic
const AppContent: React.FC = () => {
  const location = useLocation();
  
  const [state, setState] = useState<AppState>({
    darkMode: false,
    isConnected: false,
    appVersion: '1.0.0'
  });

  useEffect(() => {
    // Initialize app
    initializeApp();
    
    // Check if running in Electron
    if (window.electronAPI) {
      // Get app version
      window.electronAPI.getAppVersion().then(version => {
        setState(prev => ({ ...prev, appVersion: version }));
      }).catch(console.error);
    }

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setState(prev => ({ ...prev, darkMode: true }));
      document.documentElement.classList.add('dark');
    }
  }, []);

  const initializeApp = async () => {
    try {
      // Simulate connection check
      await new Promise(resolve => setTimeout(resolve, 1000));
      setState(prev => ({ ...prev, isConnected: true }));
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !state.darkMode;
    setState(prev => ({ ...prev, darkMode: newDarkMode }));
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Dynamic navigation items based on current location
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Monitor,
      path: '/',
      active: location.pathname === '/'
    },
    {
      id: 'devices',
      label: 'Device Management',
      icon: Activity,
      path: '/devices',
      active: location.pathname === '/devices'
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      path: '/users',
      active: location.pathname === '/users'
    },
    {
      id: 'monitoring',
      label: 'System Monitor',
      icon: Database,
      path: '/monitoring',
      active: location.pathname === '/monitoring'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      active: location.pathname === '/settings'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar 
        navigationItems={navigationItems}
        darkMode={state.darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          isConnected={state.isConnected}
          appVersion={state.appVersion}
          darkMode={state.darkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/devices" element={<div className="p-6"><h1 className="text-2xl font-bold">Device Management</h1><p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p></div>} />
            <Route path="/users" element={<div className="p-6"><h1 className="text-2xl font-bold">User Management</h1><p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p></div>} />
            <Route path="/monitoring" element={<div className="p-6"><h1 className="text-2xl font-bold">System Monitor</h1><p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p></div>} />
            <Route path="/settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Settings</h1><p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p></div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// Main App wrapper with Router
const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App; 