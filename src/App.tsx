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
// Commenting out Header temporarily to fix import issue
// import Header from './components/Header';
import Dashboard from './pages/Dashboard';

// Types
interface AppState {
  darkMode: boolean;
  isConnected: boolean;
  appVersion: string;
}

// Simplified Header component inline
const SimpleHeader: React.FC<{ appVersion: string; darkMode: boolean }> = ({ appVersion, darkMode }) => (
  <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
      Crestron NVX Manager
    </h1>
    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
      v{appVersion}
    </div>
  </header>
);

// Main App Component with routing logic
const AppContent: React.FC = () => {
  const location = useLocation();
  
  const [state, setState] = useState<AppState>({
    darkMode: false,
    isConnected: true,
    appVersion: '1.0.0'
  });

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setState(prev => ({ ...prev, darkMode: true }));
      document.documentElement.classList.add('dark');
    }
  }, []);

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
        {/* Simplified Header */}
        <SimpleHeader 
          appVersion={state.appVersion}
          darkMode={state.darkMode}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/devices" element={<div className="p-6 bg-white dark:bg-gray-800 m-6 rounded-lg"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Device Management</h1><p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p></div>} />
            <Route path="/users" element={<div className="p-6 bg-white dark:bg-gray-800 m-6 rounded-lg"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1><p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p></div>} />
            <Route path="/monitoring" element={<div className="p-6 bg-white dark:bg-gray-800 m-6 rounded-lg"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Monitor</h1><p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p></div>} />
            <Route path="/settings" element={<div className="p-6 bg-white dark:bg-gray-800 m-6 rounded-lg"><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1><p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p></div>} />
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