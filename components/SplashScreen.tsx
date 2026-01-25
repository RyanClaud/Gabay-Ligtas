
import React, { useEffect, useState } from 'react';

const SplashScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-blue-600 flex flex-col items-center justify-center overflow-hidden animate-splash-exit">
      {/* Background Decorative Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-500 rounded-full opacity-20 animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-blue-700 rounded-full opacity-30 animate-pulse-slow"></div>

      {/* Main Logo Container */}
      <div className="relative flex flex-col items-center gap-8">
        <div className="relative animate-logo-pop">
          {/* The Guardian Shield */}
          <div className="w-48 h-48 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center border-8 border-blue-100/50">
             <div className="relative">
                <i className="fa-solid fa-shield-halved text-8xl text-blue-600"></i>
                <div className="absolute inset-0 flex items-center justify-center pt-2">
                  <i className="fa-solid fa-heart text-3xl text-red-500 animate-heartbeat"></i>
                </div>
             </div>
          </div>
          
          {/* Guiding Sun Ornament */}
          <div className="absolute -top-6 -right-6 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-white shadow-lg animate-spin-slow">
            <i className="fa-solid fa-sun text-white text-2xl"></i>
          </div>
        </div>

        {/* Text Animation */}
        <div className="text-center space-y-2 animate-text-slide">
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase drop-shadow-lg">
            GABAY LIGTAS
          </h1>
          <div className="h-1.5 w-24 bg-yellow-400 mx-auto rounded-full"></div>
          <p className="text-blue-100 text-xl font-bold tracking-widest mt-2">
            Cyber-Guardian ng Seniors
          </p>
        </div>
      </div>

      <style>{`
        @keyframes logoPop {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes textSlide {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes splashExit {
          0% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-100%); display: none; }
        }
        @keyframes pulseSlow {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.1); opacity: 0.3; }
        }
        .animate-logo-pop {
          animation: logoPop 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-text-slide {
          animation: textSlide 0.8s ease-out 0.5s forwards;
          opacity: 0;
        }
        .animate-heartbeat {
          animation: heartbeat 1.5s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spinSlow 8s linear infinite;
        }
        .animate-splash-exit {
          animation: splashExit 3s ease-in-out forwards;
        }
        .animate-pulse-slow {
          animation: pulseSlow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
