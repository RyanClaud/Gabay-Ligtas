import React from 'react';

// Debug component to check environment variables in production
export const EnvDebug: React.FC = () => {
  const envVars = {
    'import.meta.env.VITE_ELEVENLABS_API_KEY': import.meta.env.VITE_ELEVENLABS_API_KEY ? 
      `Present (${import.meta.env.VITE_ELEVENLABS_API_KEY.length} chars) - ${import.meta.env.VITE_ELEVENLABS_API_KEY.substring(0, 8)}...` : 
      'Missing/Empty',
    'process.env.ELEVENLABS_API_KEY': (process.env as any).ELEVENLABS_API_KEY ? 
      `Present (${(process.env as any).ELEVENLABS_API_KEY.length} chars) - ${(process.env as any).ELEVENLABS_API_KEY.substring(0, 8)}...` : 
      'Missing/Empty',
    'import.meta.env.GEMINI_API_KEY': import.meta.env.GEMINI_API_KEY ? 
      `Present (${import.meta.env.GEMINI_API_KEY.length} chars) - ${import.meta.env.GEMINI_API_KEY.substring(0, 8)}...` : 
      'Missing/Empty',
    'process.env.GEMINI_API_KEY': (process.env as any).GEMINI_API_KEY ? 
      `Present (${(process.env as any).GEMINI_API_KEY.length} chars) - ${(process.env as any).GEMINI_API_KEY.substring(0, 8)}...` : 
      'Missing/Empty',
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded text-xs max-w-sm z-50 max-h-64 overflow-y-auto">
      <h3 className="font-bold mb-2">Environment Debug</h3>
      {Object.entries(envVars).map(([key, value]) => (
        <div key={key} className="mb-1">
          <div className="text-gray-300 text-xs">{key}:</div>
          <div className={value.includes('Present') ? 'text-green-400' : 'text-red-400'}>
            {value}
          </div>
        </div>
      ))}
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div className="text-gray-300 text-xs">Environment:</div>
        <div className="text-blue-400">{import.meta.env.MODE}</div>
      </div>
    </div>
  );
};