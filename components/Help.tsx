
import React, { useState, useEffect } from 'react';
import { playVoiceWarning, stopVoice } from '../services/geminiService';

const Help: React.FC = () => {
  const [called, setCalled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  
  // Load from localStorage or defaults
  const [contactName, setContactName] = useState(() => 
    localStorage.getItem('trustedName') || 'Anak (Juan Dela Cruz)'
  );
  const [contactNumber, setContactNumber] = useState(() => 
    localStorage.getItem('trustedNumber') || '+63 917 123 4567'
  );

  // Play a welcoming voice message when this section is opened
  useEffect(() => {
    const welcome = "Andito po kami para tumulong. Kung kayo po ay nag-aalangan, pindutin lamang ang pulang button para tawagan ang inyong pinagkakatiwalaang tao. Huwag po kayong mag-alala, ligtas po kayo.";
    playVoiceWarning(welcome);
    
    return () => stopVoice();
  }, []);

  const handleSave = () => {
    localStorage.setItem('trustedName', contactName);
    localStorage.setItem('trustedNumber', contactNumber);
    setIsEditing(false);
    setJustSaved(true);
    playVoiceWarning("Na-save na po ang bagong detalye ng inyong pinagkakatiwalaan. Ligtas na po ito.");
    setTimeout(() => setJustSaved(false), 3000);
  };

  const handleHelp = async () => {
    if (isEditing || justSaved) return;
    setCalled(true);
    
    const message = `Tinatawagan na po natin si ${contactName}. Sandali lang po, Lolo at Lola.`;
    await playVoiceWarning(message);

    setTimeout(() => {
      setCalled(false);
      window.location.href = `tel:${contactNumber}`;
    }, 2000);
  };

  return (
    <div className="space-y-8 pb-32 animate-fadeIn px-2">
      {/* Reassurance Banner */}
      <div className="bg-white p-8 rounded-[3rem] safe-shadow border-4 border-red-100 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-red-50 rounded-full opacity-50"></div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-4xl animate-pulse">
            <i className="fa-solid fa-heart"></i>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-black text-gray-900 leading-none mb-1">Huwag Mangamba</h2>
            <p className="text-xl font-bold text-gray-600 leading-tight">Hindi po kayo nag-iisa. Andito po kami para sa inyo.</p>
          </div>
        </div>
      </div>

      {/* Main Help Action */}
      <div className="flex flex-col items-center justify-center space-y-8 bg-gradient-to-b from-red-600 to-red-700 p-10 rounded-[4rem] shadow-2xl relative border-b-[10px] border-red-800">
        <div className="text-center text-white space-y-2">
          <h3 className="text-4xl font-black uppercase tracking-widest">PINDUTIN ITO</h3>
          <p className="text-red-100 text-xl font-bold">Para tumawag ng saklolo</p>
        </div>

        <button
          onClick={handleHelp}
          disabled={isEditing || called || justSaved}
          className={`w-64 h-64 rounded-full flex flex-col items-center justify-center gap-4 transition-all active:scale-95 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-[12px] border-white/30 relative overflow-hidden ${
            called ? 'bg-gray-400' : 'bg-white text-red-600 hover:bg-red-50'
          } ${(isEditing || justSaved) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
        >
          {called && (
            <div className="absolute inset-0 bg-red-600/10 animate-pulse"></div>
          )}
          <i className={`fa-solid fa-phone-flip text-7xl ${called ? 'animate-bounce' : 'animate-bounce-short'}`}></i>
          <span className="text-4xl font-black uppercase tracking-tighter">TULONG!</span>
        </button>

        <div className="bg-red-800/30 py-3 px-6 rounded-full border border-red-400/20">
          <p className="text-red-50 text-center font-bold text-lg italic">
            "Mabilis at ligtas na pagtawag."
          </p>
        </div>
      </div>

      {/* Trusted Contact Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-4">
          <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
            <i className="fa-solid fa-user-shield text-blue-600"></i>
            Pinagkakatiwalaan
          </h3>
          {!isEditing && !justSaved && (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2 bg-blue-50 border-2 border-blue-200 rounded-full text-blue-700 font-black text-lg active:scale-95 transition-all shadow-sm"
            >
              <i className="fa-solid fa-pen-to-square text-sm"></i>
              I-EDIT
            </button>
          )}
        </div>

        <div className={`bg-white rounded-[3.5rem] safe-shadow border-4 transition-all duration-500 overflow-hidden ${
          isEditing ? 'border-blue-400 p-8' : justSaved ? 'border-green-500 p-8' : 'border-gray-100 p-8'
        }`}>
          
          {isEditing ? (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-400 uppercase tracking-widest ml-4">Sino po ang tatawagan?</label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500 text-xl">
                    <i className="fa-solid fa-user"></i>
                  </div>
                  <input 
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full pl-14 pr-4 py-5 border-4 border-blue-50 rounded-[2rem] text-xl font-black outline-none focus:border-blue-500 bg-blue-50/30 transition-all"
                    placeholder="Pangalan (e.g. Anak)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-gray-400 uppercase tracking-widest ml-4">Ano po ang kanyang numero?</label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500 text-xl">
                    <i className="fa-solid fa-phone"></i>
                  </div>
                  <input 
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full pl-14 pr-4 py-5 border-4 border-blue-50 rounded-[2rem] text-xl font-black outline-none focus:border-blue-500 bg-blue-50/30 transition-all"
                    placeholder="09..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-6 rounded-[2rem] font-black text-xl text-gray-500 bg-gray-100 active:scale-95 transition-all"
                >
                  I-CANCEL
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-[2] py-6 rounded-[2rem] font-black text-xl text-white bg-blue-600 shadow-lg shadow-blue-200 active:scale-95 transition-all"
                >
                  I-SAVE ITO
                </button>
              </div>
            </div>
          ) : justSaved ? (
            <div className="flex flex-col items-center justify-center py-6 animate-popIn">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-5xl mb-4">
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <h4 className="text-3xl font-black text-green-800">NA-SAVE NA PO!</h4>
              <p className="text-xl font-bold text-green-600">Handa na pong tumulong.</p>
            </div>
          ) : (
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white text-4xl shadow-xl relative overflow-hidden shrink-0">
                <i className="fa-solid fa-user-tie"></i>
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Inyong Kakampi</p>
                <h4 className="text-3xl font-black text-gray-900 leading-tight break-words">
                  {contactName}
                </h4>
                <div className="flex items-center gap-2 text-blue-600 font-black text-2xl mt-2">
                  <i className="fa-solid fa-phone-volume text-lg"></i>
                  {contactNumber}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-center py-6 opacity-40">
        <i className="fa-solid fa-hands-holding-child text-red-600 text-3xl mb-2"></i>
        <p className="text-lg font-black text-gray-500 uppercase tracking-tighter">
          Katuwang niyo kami sa lahat ng oras.
        </p>
      </div>

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-popIn {
          animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default Help;
