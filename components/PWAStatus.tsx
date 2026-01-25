import React, { useState, useEffect } from 'react';
import { pwaService } from '../services/pwaService';

const PWAStatus: React.FC = () => {
  const [status, setStatus] = useState({
    isInstalled: false,
    canInstall: false,
    isSupported: false,
    isOnline: navigator.onLine
  });

  useEffect(() => {
    const updateStatus = () => {
      const pwaStatus = pwaService.getInstallationStatus();
      setStatus({
        ...pwaStatus,
        isOnline: navigator.onLine
      });
    };

    updateStatus();

    // Listen for online/offline changes
    const handleOnline = () => setStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Only show in development or when there are interesting states
  const isDevelopment = import.meta.env.DEV;
  if (!isDevelopment && status.isOnline && !status.isInstalled) {
    return null;
  }

  return (
    <div className="fixed top-2 right-2 z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border text-xs">
        <div className="flex items-center space-x-2">
          {/* Online/Offline Status */}
          <div className={`w-2 h-2 rounded-full ${status.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          
          {/* PWA Status */}
          {status.isInstalled && (
            <span className="text-blue-600 font-medium">
              <i className="fas fa-mobile-alt mr-1"></i>
              Installed
            </span>
          )}
          
          {!status.isOnline && (
            <span className="text-orange-600 font-medium">
              Offline Mode
            </span>
          )}
          
          {isDevelopment && (
            <span className="text-purple-600 font-medium">
              Dev
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PWAStatus;