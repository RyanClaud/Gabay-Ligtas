
import React, { useState, useEffect } from 'react';
import { AwarenessArticle } from '../types';
import { playVoiceWarning, stopVoice } from '../services/geminiService';

const SCAMS: AwarenessArticle[] = [
  {
    id: '1',
    title: 'Phishing Texts (GCash, Maya, Banks)',
    description: 'Pekeng mensahe na may kakaibang link at humihingi ng OTP o MPIN.',
    icon: 'fa-mobile-screen-button',
    color: 'bg-blue-500',
    details: 'Mga Red Flags: May shortened links tulad ng bit.ly o tinyurl. May urgent na banta tulad ng "Ang iyong account ay isu-suspend sa loob ng 24 oras!" Humihingi ng OTP, MPIN, o buong numero ng card. Ano ang dapat gawin: Huwag kailanman mag-click ng links mula sa text messages. Buksan ang inyong banking app nang direkta. Huwag magbahagi ng OTP kahit sabihin pa ng tumatawag na sila ay staff ng bangko.'
  },
  {
    id: '2',
    title: 'Fake Calls from Government or Banks',
    description: 'Mga scammer na nagpapanggap na mula sa BSP, AMLC, o fraud department.',
    icon: 'fa-phone',
    color: 'bg-red-600',
    details: 'Mga Red Flags: Ang tumatawag ay nag-pressure sa inyo na kumilos kaagad. Humihingi sila ng sensitive information. May banta ng pag-aresto o pag-freeze ng account. Ano ang dapat gawin: Ibaba kaagad ang telepono. Tawagan ang opisyal na hotline na nakalista sa website ng kumpanya. Tandaan: Ang mga ahensya ng gobyerno ay HINDI humihingi ng OTP.'
  },
  {
    id: '3',
    title: 'Investment & Crypto Scams',
    description: 'Nangangako ng garantisadong kita at kailangan mag-recruit ng iba.',
    icon: 'fa-chart-line',
    color: 'bg-green-600',
    details: 'Mga Red Flags: Garantisadong kita (halimbawa, "10% weekly"). "Limited slots only." Kailangan mag-recruit ng iba para kumita. Ano ang dapat gawin: Tingnan kung ang kumpanya ay rehistrado sa Securities and Exchange Commission. Mag-ingat sa Facebook o Telegram "investment groups". Kung masyadong maganda para maging totoo, scam yan.'
  },
  {
    id: '4',
    title: 'Fake Online Sellers',
    description: 'Sobrang murang presyo sa Facebook o TikTok, walang COD option.',
    icon: 'fa-shopping-cart',
    color: 'bg-purple-600',
    details: 'Mga Red Flags: Sobrang murang presyo (₱15,000 iPhone 15). Walang COD (Cash on Delivery). Bagong page na may kaunting reviews. Ano ang dapat gawin: Piliin ang COD sa platforms tulad ng Shopee o Lazada. Tingnan ang reviews at history ng seller. Iwasan ang direct bank transfers sa personal accounts.'
  },
  {
    id: '5',
    title: 'Job & Task Scams',
    description: 'Kailangan magbayad ng training fee, nangangako ng ₱5,000-₱10,000 daily.',
    icon: 'fa-briefcase',
    color: 'bg-orange-600',
    details: 'Mga Red Flags: Kailangan magbayad ng "training" o "activation" fees. Nangangako ng ₱5,000–₱10,000 daily para sa simpleng tasks. Communication lang sa Telegram. Ano ang dapat gawin: Ang lehitimong employers ay HINDI humihingi ng bayad. I-verify ang kumpanya sa opisyal na website o SEC registration. Mag-search online: "Company name + scam Philippines".'
  },
  {
    id: '6',
    title: 'Romance Scams',
    description: 'Mabilis magsabi ng I love you, humihingi ng pera para sa emergency.',
    icon: 'fa-heart',
    color: 'bg-pink-500',
    details: 'Mga Red Flags: Mabilis magsabi ng "I love you". Nag-claim na foreign professional (doctor, engineer, sundalo). Biglang humihingi ng pera para sa emergency, customs fees, o travel. Ano ang dapat gawin: Huwag magpadala ng pera sa taong hindi pa nakikita personally. Reverse-image search ang kanilang photos. Mag-ingat kung tumatanggi sila sa video calls.'
  },
  {
    id: '7',
    title: 'Pekeng Panalo sa Raffle',
    description: 'Sinasabing nanalo ka kahit wala kang sinalihan, kailangan magbayad ng fee.',
    icon: 'fa-trophy',
    color: 'bg-yellow-500',
    details: 'Mga Red Flags: Sinabi nilang nanalo kayo pero kailangan magbayad muna ng pera o fee. Hindi niyo naalala na sumali sa raffle. Humihingi ng personal information o bank details. Ano ang dapat gawin: Burahin ang mensahe at huwag pansinin. Huwag magbayad ng kahit anong fee. Ang tunay na raffle ay hindi humihingi ng bayad para makuha ang premyo.'
  },
  {
    id: '8',
    title: 'Pekeng Virus sa Cellphone',
    description: 'May pop-up na nagsasabing may virus ang phone, kailangan mag-download.',
    icon: 'fa-virus',
    color: 'bg-red-500',
    details: 'Mga Red Flags: May lumabas sa screen na nagsasabing may virus. Nag-pressure na mag-download ng app o mag-click ng link. Humihingi ng access sa inyong phone. Ano ang dapat gawin: Huwag mag-click ng kahit ano. Isara ang browser o app. Huwag mag-download ng kahit anong "antivirus" mula sa pop-up. Gumamit lang ng trusted antivirus apps mula sa Google Play Store.'
  }
];

const TIPS = [
  "Huwag po tayong magmadali sa pagpindot. Mas mabuti pong magtanong muna sa inyong mga anak o apo.",
  "Ang inyong password po ay parang sikreto sa kusina, huwag na huwag niyo pong ipagsasabi kahit kanino.",
  "Laging mag-ingat po sa mga hindi kilalang numero na bigla na lang tumatawag sa inyo.",
  "Galing niyo po Lolo at Lola! Ang pagiging mapanuri ay tanda ng isang matalinong senior."
];

const Awareness: React.FC = () => {
  const [selected, setSelected] = useState<AwarenessArticle | null>(null);
  const [currentTip, setCurrentTip] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      stopVoice();
    };
  }, []);

  const handleNextTip = () => {
    setCurrentTip((currentTip + 1) % TIPS.length);
  };

  const handleSelect = (scam: AwarenessArticle) => {
    setSelected(scam);
    // Automatically speak the title to confirm selection
    playVoiceWarning(`Tungkol po ito sa ${scam.title}.`);
  };

  const handleListenDetails = async () => {
    if (!selected) return;
    setIsSpeaking(true);
    await playVoiceWarning(selected.details);
    setIsSpeaking(false);
  };

  const handleClose = () => {
    setSelected(null);
    stopVoice();
  };

  return (
    <div className="space-y-8 pb-24 px-1">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[2.5rem] shadow-xl text-white">
        <h2 className="text-3xl font-black mb-2 tracking-tight">Handog na Karunungan</h2>
        <p className="text-blue-100 text-lg font-bold">Matuto tayo para laging ligtas!</p>
      </div>

      <div className="bg-white rounded-[2rem] border-4 border-yellow-400 shadow-md relative overflow-hidden group">
        <div className="p-6">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <i className="fa-solid fa-lightbulb text-5xl"></i>
          </div>
          <div className="mb-1">
            <p className="text-xs font-black text-yellow-600 uppercase tracking-widest">Paalala para sa inyo:</p>
          </div>
          
          <p className="text-xl font-black text-gray-800 leading-tight mb-4 text-left block w-full">
            "{TIPS[currentTip]}"
          </p>
          
          <div className="flex gap-4">
            <button 
              onClick={handleNextTip}
              className="text-blue-600 font-black text-md flex items-center gap-2 hover:underline active:scale-95 transition-all"
            >
              Ibang payo <i className="fa-solid fa-arrow-right"></i>
            </button>
            <button 
              onClick={() => playVoiceWarning(TIPS[currentTip])}
              className="text-gray-500 font-black text-md flex items-center gap-2 hover:underline active:scale-95 transition-all"
            >
              <i className="fa-solid fa-volume-high"></i> Pakinggan
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-black text-gray-800 flex items-center gap-3 px-2">
          <i className="fa-solid fa-shield-halved text-blue-600"></i>
          Mga Dapat Iwasan:
        </h3>
        
        <div className="flex flex-col gap-4">
          {SCAMS.map((scam) => (
            <button
              key={scam.id}
              onClick={() => handleSelect(scam)}
              className="bg-white p-5 rounded-[2.5rem] safe-shadow flex items-center gap-5 text-left border-2 border-gray-50 active:border-blue-400 transition-all active:scale-95 group"
            >
              <div className={`w-16 h-16 rounded-3xl ${scam.color} flex items-center justify-center text-white text-3xl shrink-0 shadow-lg group-hover:scale-105 transition-transform`}>
                <i className={`fa-solid ${scam.icon}`}></i>
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="text-xl font-black text-gray-900 truncate">{scam.title}</h3>
                <p className="text-gray-500 text-sm font-bold line-clamp-1">{scam.description}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                <i className="fa-solid fa-chevron-right text-sm"></i>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl animate-slideUp overflow-hidden flex flex-col border-[8px] border-blue-500 max-h-[90vh]">
            
            <div className={`${selected.color} p-6 text-white text-center relative shrink-0`}>
              <button 
                onClick={handleClose}
                className="absolute top-4 right-4 w-12 h-12 bg-black/20 rounded-full flex items-center justify-center hover:bg-black/30 active:scale-90 transition-all z-20"
                aria-label="Isara"
              >
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-5xl mx-auto mb-3 border-4 border-white/30">
                <i className={`fa-solid ${selected.icon}`}></i>
              </div>
              <h3 className="text-3xl font-black tracking-tight">{selected.title}</h3>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
              <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-gray-100 shadow-inner relative group">
                <p className="text-gray-900 text-2xl font-black leading-relaxed text-center">
                  {selected.details}
                </p>
                <button 
                  onClick={handleListenDetails}
                  className="mt-6 w-full py-4 rounded-2xl bg-white border-2 border-blue-200 flex items-center justify-center gap-3 text-xl font-black text-blue-600 shadow-sm active:scale-95 transition-all"
                >
                  <i className={`fa-solid ${isSpeaking ? 'fa-spinner animate-spin' : 'fa-circle-play'}`}></i>
                  Pakinggan ang Detalye
                </button>
              </div>

              <div className="space-y-4 pt-2">
                <button
                  onClick={handleClose}
                  className="w-full py-7 bg-blue-600 text-white rounded-[2rem] font-black text-2xl shadow-xl active:bg-blue-700"
                >
                  Salamat, Naintindihan ko
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center py-6 opacity-40">
        <i className="fa-solid fa-heart text-blue-600 text-2xl mb-1"></i>
        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
          Ligtas ang Pamilya
        </p>
      </div>
    </div>
  );
};

export default Awareness;
