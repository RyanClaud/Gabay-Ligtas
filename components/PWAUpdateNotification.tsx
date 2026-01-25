import React, { useState, useEffect } from 'react';
import { pwaService, PWAUpdateInfo } from '../services/pwaService';

const PWAUpdateNotification: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<PWAUpdateInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Register for update notifications
    pwaService.register((info) => {
      setUpdateInfo(info);
    });
  }, []);

  const handleUpdate = async () => {
    if (!updateInfo?.registration) return;

    setIsUpdating(true);
    try {
      await pwaService.skipWaiting(updateInfo.registration);
      // The page will reload automatically when the new SW takes control
    } catch (error) {
      console.error('Failed to update app:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setUpdateInfo(null);
  };

  if (!updateInfo?.updateAvailable) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 bg-green-50 border-2 border-green-600 rounded-lg shadow-lg p-4 z-50 safe-shadow">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <i className="fas fa-sync-alt text-green-600 text-2xl"></i>
        </div>
        <div className="flex-1">
          <h3 className="elder-text-small font-semibold text-gray-900 mb-2">
            App Update Available
          </h3>
          <p className="elder-text-small text-gray-600 mb-3">
            A new version of Gabay Ligtas is available with improvements and bug fixes.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="bg-green-600 text-white px-4 py-2 rounded-lg elder-text-small font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Updating...
                </>
              ) : (
                <>
                  <i className="fas fa-download mr-2"></i>
                  Update Now
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              disabled={isUpdating}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg elder-text-small font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          disabled={isUpdating}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>
    </div>
  );
};

export default PWAUpdateNotification;