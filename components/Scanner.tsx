
import React, { useState, useEffect, useRef } from 'react';
import { analyzeMessage, playVoiceWarning, stopVoice, playNotificationSound } from '../services/geminiService';
import { ScamAnalysis } from '../types';

const ConfidenceMeter: React.FC<{ confidence: number; isScam: boolean }> = ({ confidence, isScam }) => {
  const displayConfidence = isScam ? confidence : (1 - confidence);
  const targetPercentage = Math.round(displayConfidence * 100);
  const [animatedWidth, setAnimatedWidth] = useState(0);
  
  useEffect(() => {
    setAnimatedWidth(0);
    const timeout = setTimeout(() => {
      setAnimatedWidth(targetPercentage);
    }, 150);
    return () => clearTimeout(timeout);
  }, [targetPercentage, isScam]);

  let colorClass = "from-green-400 to-green-600";
  let label = "Mababa ang Panganib";
  let icon = "fa-shield-check";
  let pulseClass = "";
  let warningElements = null;
  
  if (isScam) {
    if (displayConfidence > 0.7) {
      colorClass = "from-red-500 to-red-700";
      label = "Mataas ang Panganib!";
      icon = "fa-skull-crossbones";
      pulseClass = "animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.4)]";
      
      // Add extra warning elements for high-risk scams
      warningElements = (
        <>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center animate-ping">
            <span className="text-white text-xs font-black">!</span>
          </div>
          <div className="absolute -top-1 -left-1 text-red-600 animate-bounce text-xl">
            ⚠️
          </div>
        </>
      );
    } else if (displayConfidence > 0.4) {
      colorClass = "from-yellow-400 to-orange-500";
      label = "Katamtamang Panganib";
      icon = "fa-triangle-exclamation";
    } else {
      colorClass = "from-yellow-300 to-yellow-500";
      label = "Duda sa Panganib";
      icon = "fa-eye";
    }
  }

  return (
    <div className={`w-full space-y-3 sm:space-y-4 mt-4 bg-white p-4 sm:p-6 rounded-[2rem] sm:rounded-[3rem] border-4 border-gray-100 shadow-xl transition-all duration-700 relative ${pulseClass}`}>
      {warningElements}
      
      <div className="flex justify-between items-center px-1 sm:px-2">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white shadow-lg ${isScam && displayConfidence > 0.7 ? 'animate-shake' : ''}`}>
            <i className={`fa-solid ${icon} text-lg sm:text-xl ${isScam && displayConfidence > 0.7 ? 'animate-pulse' : ''}`}></i>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Status</span>
            <span className={`text-lg sm:text-xl font-black leading-none ${isScam && displayConfidence > 0.7 ? 'text-red-600 animate-flash' : 'text-gray-800'}`}>
              {label}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xl sm:text-2xl font-black ${isScam && displayConfidence > 0.7 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>
            {animatedWidth}%
          </span>
        </div>
      </div>
      
      <div className="w-full h-8 sm:h-10 bg-gray-100 rounded-full overflow-hidden p-1.5 sm:p-2 border-4 border-white shadow-inner relative">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-[1200ms] ease-out shadow-md ${isScam && displayConfidence > 0.7 ? 'animate-pulse' : ''}`}
          style={{ width: `${animatedWidth}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
        
        {/* Danger indicator for high-risk scams */}
        {isScam && displayConfidence > 0.7 && (
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-700/20 animate-pulse pointer-events-none rounded-full"></div>
        )}
      </div>
    </div>
  );
};

const Scanner: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScamAnalysis | null>(null);
  const currentScanId = useRef(0);

  const handleScan = async () => {
    if (!inputText.trim() || loading) return;
    const myId = ++currentScanId.current;
    
    stopVoice();
    setResult(null);
    setLoading(true);

    try {
      const analysis = await analyzeMessage(inputText);
      if (myId !== currentScanId.current) return;
      
      // Play notification sound based on result type
      playNotificationSound(analysis.isScam);
      
      setResult(analysis);
      setLoading(false);

      const voiceText = `${analysis.reasonTagalog} ${analysis.actionTagalog}`;
      playVoiceWarning(voiceText);
    } catch (error) {
      if (myId === currentScanId.current) {
        setLoading(false);
        playVoiceWarning("Pasensya na po Lolo at Lola, hindi ko po ma-check ngayon. Subukan po nating muli mamaya.");
      }
    }
  };

  const handleClear = () => {
    setInputText('');
    setResult(null);
    stopVoice();
    
    // Clear ALL cached results aggressively
    try {
      // Clear localStorage completely for this domain
      localStorage.clear();
      
      // Clear sessionStorage as well
      sessionStorage.clear();
      
      // Clear IndexedDB cache if accessible
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('GabayLigtasAudioDBV12');
      }
      
      console.log('🧹 Cleared ALL cache data');
    } catch (error) {
      console.warn('Could not clear all cache:', error);
    }
    
    playVoiceWarning("Binura na po natin ang lahat ng cache. Handa na po muli ang inyong checker.");
  };

  return (
    <div className="h-full flex flex-col">
      {/* All content in one scrollable container */}
      <div className="flex-1 overflow-y-auto space-y-4 animate-fadeIn">
        {/* Input Section */}
        <div className="bg-white p-4 sm:p-6 rounded-[2rem] sm:rounded-[3rem] safe-shadow border-2 border-gray-50 flex flex-col gap-4 relative overflow-hidden">
          {loading && (
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-100 overflow-hidden">
               <div className="h-full bg-blue-600 w-1/3 animate-scanRay"></div>
            </div>
          )}
          
          <div className="flex items-center gap-3 px-2">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl transition-all duration-500 ${loading ? 'bg-blue-600 text-white animate-pulse' : 'bg-blue-100 text-blue-600'}`}>
              <i className={`fa-solid ${loading ? 'fa-satellite-dish' : 'fa-paste'}`}></i>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 leading-tight">Mensahe o Link na kahina-hinala</h3>
              <p className="text-sm sm:text-base font-bold text-gray-500">I-paste po dito ang text</p>
            </div>
          </div>

          <div className="relative group">
            <textarea
              className={`w-full h-32 sm:h-40 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border-4 transition-all outline-none text-base sm:text-lg font-medium shadow-inner resize-none ${
                loading 
                  ? 'bg-blue-50 border-blue-200 opacity-60' 
                  : 'bg-blue-50/30 border-blue-50 focus:bg-white focus:border-blue-400'
              }`}
              placeholder="Ex. 'Nanalo ka ng 50k! I-click ang link na ito...'"
              value={inputText}
              readOnly={loading}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 sm:border-6 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleScan}
              disabled={loading || !inputText.trim()}
              className={`py-4 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] text-lg sm:text-2xl font-black shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden ${
                loading 
                  ? 'bg-blue-800 text-white cursor-wait' 
                  : !inputText.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200 active:scale-105'
              }`}
            >
              {loading ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmerBtn"></div>
                  <i className="fa-solid fa-microchip animate-spin-slow"></i>
                  SINUSURI...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-magnifying-glass-shield"></i>
                  ISURI ITO
                </>
              )}
            </button>

            <button
              onClick={handleClear}
              disabled={loading}
              className="py-3 sm:py-4 rounded-[1.5rem] sm:rounded-[2rem] text-sm sm:text-base font-black text-gray-500 bg-white border-4 border-gray-100 flex items-center justify-center gap-2 active:scale-95 active:bg-gray-50 transition-all disabled:opacity-50"
            >
              <i className="fa-solid fa-eraser"></i>
              BURAHIN ANG DETALYE
            </button>

            {/* TTS Test Button for debugging */}
            <button
              onClick={() => {
                import('../services/geminiService').then(({ testVoices }) => {
                  testVoices();
                });
              }}
              className="py-2 sm:py-3 rounded-[1.5rem] sm:rounded-[2rem] text-xs sm:text-sm font-black text-blue-500 bg-blue-50 border-2 border-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <i className="fa-solid fa-volume-high"></i>
              TEST VOICE
            </button>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="animate-popIn space-y-4">
            <ConfidenceMeter confidence={result.confidence} isScam={result.isScam} />

            <div className={`p-4 sm:p-6 rounded-[2rem] sm:rounded-[3rem] border-4 shadow-xl relative overflow-hidden ${
              result.isScam ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'
            }`}>
              {/* Animated Background Elements for Scam */}
              {result.isScam && (
                <>
                  {/* Animated Hand Signal */}
                  <div className="absolute top-4 right-4 w-16 h-16 sm:w-20 sm:h-20">
                    <div className="animate-wave-hand text-4xl sm:text-5xl">
                      ✋
                    </div>
                  </div>
                  
                  {/* Heartbeat SCAM Text */}
                  <div className="absolute top-4 left-4 opacity-20">
                    <div className="animate-heartbeat text-red-600 font-black text-lg sm:text-xl tracking-wider">
                      SCAM
                    </div>
                  </div>
                  
                  {/* Additional Warning Pulse */}
                  <div className="absolute inset-0 animate-danger-pulse pointer-events-none"></div>
                </>
              )}

              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-md ${
                  result.isScam ? 'bg-red-600 text-white animate-shake' : 'bg-green-600 text-white animate-bounce-gentle'
                }`}>
                  <i className={`fa-solid ${result.isScam ? 'fa-hand animate-pulse' : 'fa-circle-check'}`}></i>
                </div>
                <div>
                  <h4 className={`text-xl sm:text-2xl font-black ${result.isScam ? 'text-red-800 animate-flash' : 'text-green-800'}`}>
                    {result.isScam ? 'DELIKADO PO!' : 'LIGTAS PO ITO'}
                  </h4>
                  <p className="text-sm sm:text-base font-bold text-gray-600">Gabay ni Apo</p>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="bg-white/90 p-4 sm:p-5 rounded-2xl border-2 border-gray-100 shadow-sm">
                  <p className="text-sm sm:text-base font-black text-gray-500 uppercase tracking-widest mb-1">Paliwanag ni Apo:</p>
                  <p className="text-base sm:text-lg font-black text-gray-800 leading-tight">
                    {result.reasonTagalog}
                  </p>
                </div>

                <div className={`p-4 sm:p-6 rounded-2xl shadow-lg transform transition-all hover:scale-[1.02] ${
                  result.isScam ? 'bg-red-600 text-white animate-urgent-glow' : 'bg-green-600 text-white'
                }`}>
                  <p className="text-base sm:text-xl font-black text-center leading-tight">
                    {result.actionTagalog}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!result && !loading && (
          <div className="py-8 text-center opacity-30 grayscale pointer-events-none">
            <i className="fa-solid fa-shield-halved text-4xl sm:text-6xl mb-3 text-blue-900"></i>
            <p className="text-sm sm:text-base font-black text-blue-900 uppercase tracking-tighter">Laging Magingat Lolo at Lola</p>
          </div>
        )}

        {/* Add some bottom padding to ensure content doesn't get cut off */}
        <div className="h-4"></div>
      </div>

      <style>{`
        @keyframes scanRay {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes shimmerBtn {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes wave-hand {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-15deg) scale(1.1); }
          50% { transform: rotate(15deg) scale(1.2); }
          75% { transform: rotate(-10deg) scale(1.1); }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.6; }
        }
        @keyframes danger-pulse {
          0%, 100% { background: rgba(239, 68, 68, 0); }
          50% { background: rgba(239, 68, 68, 0.1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px) rotate(-1deg); }
          75% { transform: translateX(2px) rotate(1deg); }
        }
        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes urgent-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.6); }
        }
        
        .animate-scanRay {
          animation: scanRay 2s infinite linear;
        }
        .animate-shimmerBtn {
          animation: shimmerBtn 1s infinite linear;
        }
        .animate-spin-slow {
          animation: spin-slow 3s infinite linear;
        }
        .animate-wave-hand {
          animation: wave-hand 2s infinite ease-in-out;
        }
        .animate-heartbeat {
          animation: heartbeat 1.5s infinite ease-in-out;
        }
        .animate-danger-pulse {
          animation: danger-pulse 2s infinite ease-in-out;
        }
        .animate-shake {
          animation: shake 0.5s infinite ease-in-out;
        }
        .animate-flash {
          animation: flash 1s infinite ease-in-out;
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s infinite ease-in-out;
        }
        .animate-urgent-glow {
          animation: urgent-glow 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Scanner;
