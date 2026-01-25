import React from 'react';

// Debug component to check environment variables in production
export const EnvDebug: React.FC = () => {
  if (import.meta.env.PROD) {
    return null; // Don't show in production
  }

  const envVars = {
    'import.meta.env.VITE_ELEVENLABS_API_KEY': import.meta.env.VITE_ELEVENLABS_API_KEY ? 'Present' : 'Missing',
    'process.env.ELEVENLABS_API_KEY': (process.env as any).ELEVENLABS_API_KEY ? 'Present' : 'Missing',
    'import.meta.env.GEMINI_API_KEY': import.meta.env.GEMINI_API_KEY ? 'Present' : 'Missing',
    'process.env.GEMINI_API_KEY': (process.env as any).GEMINI_API_KEY ? 'Present' : 'Missing',
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Environment Debug</h3>
      {Object.entries(envVars).map(([key, value]) => (
        <div key={key} className="mb-1">
          <span className="text-gray-300">{key}:</span> 
          <span className={value === 'Present' ? 'text-green-400' : 'text-red-400'}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
};