
import React, { useState, useEffect } from 'react';
import { AppTab } from './types';
import Scanner from './components/Scanner';
import Awareness from './components/Awareness';
import Help from './components/Help';
import SplashScreen from './components/SplashScreen';
import PWAUpdateNotification from './components/PWAUpdateNotification';
import PWAStatus from './components/PWAStatus';
import PerformanceMonitor from './components/PerformanceMonitor';
import DebugPanel from './components/DebugPanel';
import { stopVoice } from './services/geminiService';
import './services/pwaService'; // Initialize PWA service

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.SCANNER);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash screen after its animation is done (3 seconds)
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleTabSwitch = (tab: AppTab) => {
    stopVoice(); // Interrupt any speaking audio when changing screens
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.SCANNER:
        return <Scanner />;
      case AppTab.LEARN:
        return <Awareness />;
      case AppTab.HELP:
        return <Help />;
      default:
        return <Scanner />;
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col w-full max-w-md mx-auto relative shadow-2xl overflow-hidden border-x border-gray-200 sm:max-w-lg md:max-w-xl lg:max-w-2xl">
      {/* PWA Components */}
      <PWAUpdateNotification />
      <PWAStatus />
      <PerformanceMonitor />
      <DebugPanel />
      
      {/* Splash Screen Overlay */}
      {showSplash && <SplashScreen />}

      {/* Header - Fixed height */}
      <header className="bg-blue-600 text-white p-4 sm:p-6 pt-6 sm:pt-8 rounded-b-[2rem] sm:rounded-b-[3rem] shadow-2xl z-10 border-b-4 border-blue-700 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter uppercase">Gabay Ligtas</h1>
            <p className="text-blue-100 text-sm sm:text-base md:text-lg font-bold mt-1">Katuwang ng Lolo at Lola</p>
          </div>
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/40 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-xl border-2 border-white/20 shadow-inner">
            <i className="fa-solid fa-user-shield text-lg sm:text-2xl md:text-3xl text-white"></i>
          </div>
        </div>
      </header>

      {/* Main Content Area - Scrollable with fixed height */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 pt-4 sm:pt-6 min-h-0">
        {!showSplash && renderContent()}
      </main>

      {/* Persistent Navigation Bar - Fixed at bottom */}
      <nav className="bg-white border-t-4 border-gray-100 flex justify-around p-2 sm:p-3 pb-3 sm:pb-4 rounded-t-[1.5rem] sm:rounded-t-[2rem] shadow-[0_-15px_30px_-5px_rgba(0,0,0,0.1)] z-20 flex-shrink-0">
        <button
          onClick={() => handleTabSwitch(AppTab.SCANNER)}
          className={`flex flex-col items-center gap-1 flex-1 py-2 sm:py-3 px-2 rounded-xl sm:rounded-2xl transition-all ${
            activeTab === AppTab.SCANNER ? 'text-blue-700 bg-blue-50 scale-105 shadow-md' : 'text-gray-400'
          }`}
        >
          <i className="fa-solid fa-shield-virus text-xl sm:text-2xl"></i>
          <span className="text-xs sm:text-sm font-black uppercase tracking-tighter">Checker</span>
        </button>
        
        <button
          onClick={() => handleTabSwitch(AppTab.LEARN)}
          className={`flex flex-col items-center gap-1 flex-1 py-2 sm:py-3 px-2 rounded-xl sm:rounded-2xl transition-all ${
            activeTab === AppTab.LEARN ? 'text-blue-700 bg-blue-50 scale-105 shadow-md' : 'text-gray-400'
          }`}
        >
          <i className="fa-solid fa-graduation-cap text-xl sm:text-2xl"></i>
          <span className="text-xs sm:text-sm font-black uppercase tracking-tighter">Kaalaman</span>
        </button>
        
        <button
          onClick={() => handleTabSwitch(AppTab.HELP)}
          className={`flex flex-col items-center gap-1 flex-1 py-2 sm:py-3 px-2 rounded-xl sm:rounded-2xl transition-all ${
            activeTab === AppTab.HELP ? 'text-red-700 bg-red-50 font-black scale-105 shadow-md' : 'text-gray-400'
          }`}
        >
          <i className="fa-solid fa-life-ring text-xl sm:text-2xl"></i>
          <span className="text-xs sm:text-sm font-black uppercase tracking-tighter">Tulong</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
