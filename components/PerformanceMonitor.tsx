import React, { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  cacheHits: number;
  apiCalls: number;
  offlineMode: boolean;
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    cacheHits: 0,
    apiCalls: 0,
    offlineMode: !navigator.onLine
  });

  const [showMetrics, setShowMetrics] = useState(false);

  useEffect(() => {
    // Calculate load time
    const loadTime = performance.now();
    setMetrics(prev => ({ ...prev, loadTime }));

    // Monitor online/offline status
    const handleOnline = () => setMetrics(prev => ({ ...prev, offlineMode: false }));
    const handleOffline = () => setMetrics(prev => ({ ...prev, offlineMode: true }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor cache usage (simplified)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      setMetrics(prev => ({ ...prev, apiCalls: prev.apiCalls + 1 }));
      return originalFetch(...args);
    };

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.fetch = originalFetch;
    };
  }, []);

  // Only show in development or when explicitly enabled
  const isDevelopment = import.meta.env.DEV;
  if (!isDevelopment && !showMetrics) {
    return null;
  }

  return (
    <div className="fixed bottom-2 left-2 z-40">
      {!showMetrics ? (
        <button
          onClick={() => setShowMetrics(true)}
          className="bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-50 hover:opacity-100"
        >
          📊
        </button>
      ) : (
        <div className="bg-gray-800 text-white text-xs p-2 rounded shadow-lg max-w-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold">Performance</span>
            <button
              onClick={() => setShowMetrics(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-1">
            <div>Load: {Math.round(metrics.loadTime)}ms</div>
            <div>API Calls: {metrics.apiCalls}</div>
            <div className={`${metrics.offlineMode ? 'text-red-400' : 'text-green-400'}`}>
              {metrics.offlineMode ? '📴 Offline' : '🌐 Online'}
            </div>
            
            {isDevelopment && (
              <div className="text-yellow-400 text-xs mt-1">
                Dev Mode
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;