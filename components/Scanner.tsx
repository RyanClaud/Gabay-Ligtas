
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
  
  if (isScam) {
    if (displayConfidence > 0.7) {
      colorClass = "from-red-500 to-red-700";
      label = "Mataas ang Panganib!";
      icon = "fa-skull-crossbones";
      pulseClass = "animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.4)]";
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
    <div className={`w-full space-y-5 mt-6 bg-white p-7 rounded-[3rem] border-4 border-gray-100 shadow-xl transition-all duration-700 ${pulseClass}`}>
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white shadow-lg`}>
            <i className={`fa-solid ${icon} text-2xl`}></i>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Status</span>
            <span className={`text-2xl font-black leading-none ${isScam && displayConfidence > 0.7 ? 'text-red-600' : 'text-gray-800'}`}>
              {label}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-gray-900">{animatedWidth}%</span>
        </div>
      </div>
      
      <div className="w-full h-12 bg-gray-100 rounded-full overflow-hidden p-2 border-4 border-white shadow-inner relative">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-[1200ms] ease-out shadow-md`}
          style={{ width: `${animatedWidth}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
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
    playVoiceWarning("Binura na po natin ang detalye. Handa na po muli ang inyong checker.");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Input Section */}
      <div className="bg-white p-8 rounded-[3.5rem] safe-shadow border-2 border-gray-50 flex flex-col gap-6 relative overflow-hidden">
        {loading && (
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-100 overflow-hidden">
             <div className="h-full bg-blue-600 w-1/3 animate-scanRay"></div>
          </div>
        )}
        
        <div className="flex items-center gap-4 px-2">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all duration-500 ${loading ? 'bg-blue-600 text-white animate-pulse' : 'bg-blue-100 text-blue-600'}`}>
            <i className={`fa-solid ${loading ? 'fa-satellite-dish' : 'fa-paste'}`}></i>
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 leading-tight">Mensahe na Dumating</h3>
            <p className="text-lg font-bold text-gray-500">I-paste po dito ang text</p>
          </div>
        </div>

        <div className="relative group">
          <textarea
            className={`w-full h-72 p-7 rounded-[2.5rem] border-4 transition-all outline-none text-2xl font-medium shadow-inner resize-none ${
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
              <div className="w-20 h-20 border-8 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleScan}
            disabled={loading || !inputText.trim()}
            className={`py-8 rounded-[2.5rem] text-3xl font-black shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 relative overflow-hidden ${
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
            className="py-5 rounded-[2.5rem] text-xl font-black text-gray-500 bg-white border-4 border-gray-100 flex items-center justify-center gap-3 active:scale-95 active:bg-gray-50 transition-all disabled:opacity-50"
          >
            <i className="fa-solid fa-eraser"></i>
            BURAHIN ANG DETALYE
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="animate-popIn space-y-6">
          <ConfidenceMeter confidence={result.confidence} isScam={result.isScam} />

          <div className={`p-8 rounded-[3.5rem] border-4 shadow-xl ${
            result.isScam ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'
          }`}>
            <div className="flex items-center gap-5 mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-4xl shadow-md ${
                result.isScam ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
              }`}>
                <i className={`fa-solid ${result.isScam ? 'fa-hand' : 'fa-circle-check'}`}></i>
              </div>
              <div>
                <h4 className={`text-3xl font-black ${result.isScam ? 'text-red-800' : 'text-green-800'}`}>
                  {result.isScam ? 'DELIKADO PO!' : 'LIGTAS PO ITO'}
                </h4>
                <p className="text-xl font-bold text-gray-600">Gabay ni Apo</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/90 p-6 rounded-3xl border-2 border-gray-100 shadow-sm">
                <p className="text-xl font-black text-gray-500 uppercase tracking-widest mb-1">Paliwanag ni Apo:</p>
                <p className="text-2xl font-black text-gray-800 leading-tight">
                  {result.reasonTagalog}
                </p>
              </div>

              <div className={`p-8 rounded-3xl shadow-lg transform transition-all hover:scale-[1.02] ${
                result.isScam ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
              }`}>
                <p className="text-3xl font-black text-center leading-tight">
                  {result.actionTagalog}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="py-10 text-center opacity-30 grayscale pointer-events-none">
          <i className="fa-solid fa-shield-halved text-7xl mb-4 text-blue-900"></i>
          <p className="text-xl font-black text-blue-900 uppercase tracking-tighter">Laging Magingat Lolo at Lola</p>
        </div>
      )}

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
        .animate-scanRay {
          animation: scanRay 2s infinite linear;
        }
        .animate-shimmerBtn {
          animation: shimmerBtn 1s infinite linear;
        }
        .animate-spin-slow {
          animation: spin-slow 3s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default Scanner;
