
import React, { useState, useEffect } from 'react';
import { AppTab } from './types';
import Scanner from './components/Scanner';
import Awareness from './components/Awareness';
import Help from './components/Help';
import SplashScreen from './components/SplashScreen';
import PWAUpdateNotification from './components/PWAUpdateNotification';
import PWAStatus from './components/PWAStatus';
import PerformanceMonitor from './components/PerformanceMonitor';
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
    <div className="min-h-screen bg-slate-50 flex flex-col w-full max-w-md mx-auto relative shadow-2xl overflow-x-hidden border-x border-gray-200 sm:max-w-lg md:max-w-xl lg:max-w-2xl">
      {/* PWA Components */}
      <PWAUpdateNotification />
      <PWAStatus />
      <PerformanceMonitor />
      
      {/* Splash Screen Overlay */}
      {showSplash && <SplashScreen />}

      {/* Header - Bigger and bolder */}
      <header className="bg-blue-600 text-white p-6 sm:p-8 pt-8 sm:pt-12 rounded-b-[2rem] sm:rounded-b-[3rem] shadow-2xl z-10 border-b-4 border-blue-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter uppercase">Gabay Ligtas</h1>
            <p className="text-blue-100 text-base sm:text-xl font-bold mt-1">Katuwang ng Lolo at Lola</p>
          </div>
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500/40 rounded-2xl sm:rounded-3xl flex items-center justify-center backdrop-blur-xl border-2 border-white/20 shadow-inner">
            <i className="fa-solid fa-user-shield text-2xl sm:text-3xl md:text-4xl text-white"></i>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto pt-6 sm:pt-10">
        {!showSplash && renderContent()}
      </main>

      {/* Persistent Navigation Bar - Larger touch targets */}
      <nav className="sticky bottom-0 left-0 right-0 bg-white border-t-4 border-gray-100 flex justify-around p-3 sm:p-5 pb-4 sm:pb-8 rounded-t-[2rem] sm:rounded-t-[2.5rem] shadow-[0_-15px_30px_-5px_rgba(0,0,0,0.1)] z-20">
        <button
          onClick={() => handleTabSwitch(AppTab.SCANNER)}
          className={`flex flex-col items-center gap-1 sm:gap-2 flex-1 py-3 sm:py-4 rounded-2xl sm:rounded-3xl transition-all ${
            activeTab === AppTab.SCANNER ? 'text-blue-700 bg-blue-50 scale-105 shadow-md' : 'text-gray-400'
          }`}
        >
          <i className="fa-solid fa-shield-virus text-2xl sm:text-3xl"></i>
          <span className="text-xs sm:text-sm font-black uppercase tracking-tighter">Checker</span>
        </button>
        
        <button
          onClick={() => handleTabSwitch(AppTab.LEARN)}
          className={`flex flex-col items-center gap-1 sm:gap-2 flex-1 py-3 sm:py-4 rounded-2xl sm:rounded-3xl transition-all ${
            activeTab === AppTab.LEARN ? 'text-blue-700 bg-blue-50 scale-105 shadow-md' : 'text-gray-400'
          }`}
        >
          <i className="fa-solid fa-graduation-cap text-2xl sm:text-3xl"></i>
          <span className="text-xs sm:text-sm font-black uppercase tracking-tighter">Kaalaman</span>
        </button>
        
        <button
          onClick={() => handleTabSwitch(AppTab.HELP)}
          className={`flex flex-col items-center gap-1 sm:gap-2 flex-1 py-3 sm:py-4 rounded-2xl sm:rounded-3xl transition-all ${
            activeTab === AppTab.HELP ? 'text-red-700 bg-red-50 font-black scale-105 shadow-md' : 'text-gray-400'
          }`}
        >
          <i className="fa-solid fa-life-ring text-2xl sm:text-3xl"></i>
          <span className="text-xs sm:text-sm font-black uppercase tracking-tighter">Tulong</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
