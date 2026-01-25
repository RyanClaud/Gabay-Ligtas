import React, { useState } from 'react';

const DebugPanel: React.FC = () => {
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Only show in development
  const isDevelopment = import.meta.env.DEV;
  if (!isDevelopment) return null;

  const checkEnvironment = () => {
    const info = {
      environment: {
        isDev: import.meta.env.DEV,
        isProd: import.meta.env.PROD,
        mode: import.meta.env.MODE
      },
      apiKeys: {
        API_KEY: process.env.API_KEY ? 'Present' : 'Missing',
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Present' : 'Missing'
      },
      browser: {
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        language: navigator.language
      },
      cache: {
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        indexedDB: typeof indexedDB !== 'undefined'
      }
    };
    
    setDebugInfo(info);
    console.log('🐛 Debug Info:', info);
  };

  const clearAllCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('🧹 All cache cleared');
      alert('Cache cleared successfully!');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
      alert('Error clearing cache: ' + error);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {!showDebug ? (
        <button
          onClick={() => setShowDebug(true)}
          className="bg-purple-600 text-white text-xs px-3 py-2 rounded-full shadow-lg hover:bg-purple-700"
          title="Debug Panel"
        >
          🐛 Debug
        </button>
      ) : (
        <div className="bg-white border-2 border-purple-600 rounded-lg shadow-xl p-4 max-w-sm max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-purple-600">Debug Panel</h3>
            <button
              onClick={() => setShowDebug(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={checkEnvironment}
              className="w-full bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
            >
              Check Environment
            </button>
            
            <button
              onClick={clearAllCache}
              className="w-full bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
            >
              Clear All Cache
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600"
            >
              Reload App
            </button>
          </div>
          
          {debugInfo && (
            <div className="mt-4 text-xs">
              <h4 className="font-bold mb-2">Environment Info:</h4>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DebugPanel;