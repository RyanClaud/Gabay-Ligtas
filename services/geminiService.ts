
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ScamAnalysis } from "../types";
import { cacheService } from "./cacheService";

const DB_NAME = 'GabayLigtasAudioDBV12'; // Incremented version for new voice speed
const STORE_NAME = 'audio_cache';
const QUOTA_LOCK_KEY = 'gabay_ligtas_quota_lock_v12';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveAudioToDB = async (key: string, data: Uint8Array) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(data, key);
  } catch (e) {
    console.warn("Storage Error:", e);
  }
};

const getAudioFromDB = async (key: string): Promise<Uint8Array | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
};

const audioCache = new Map<string, AudioBuffer>();
let audioCtx: AudioContext | null = null;
const activeSources = new Set<AudioBufferSourceNode>();
let currentSpeechId = 0;

const normalizePhonetic = (text: string): string => {
  const replacements: Record<string, string> = {
    'scam': 'is-kam',
    'Scam': 'Iskam',
    'link': 'lingk',
    'OTP': 'O-T-P',
    'password': 'pas-word',
    'MPIN': 'M-pin',
    'online': 'on-layn',
    'checker': 'che-ker',
    'raffle': 'ra-pol',
    'click': 'pindutin',
    'message': 'men-sa-he',
    'bank': 'bang-ko',
    'suspended': 'na-sus-pend',
    'verification': 'ber-i-pi-kay-shon',
    'GCash': 'Dyi-Kash',
    'virus': 'bay-rus',
    'Facebook': 'Peys-buk',
    'emergency': 'e-mer-dyen-si',
    'code': 'kod',
    'download': 'dawn-lowd',
    'update': 'ap-deyt',
    'account': 'a-ka-unt',
    'security': 'se-kyu-ri-ti',
    'number': 'num-be-ro'
  };

  let normalized = text;
  Object.entries(replacements).forEach(([key, val]) => {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    normalized = normalized.replace(regex, val);
  });
  return normalized;
};

export const checkQuotaStatus = (): boolean => {
  const lock = localStorage.getItem(QUOTA_LOCK_KEY);
  if (!lock) return false;
  const expiry = parseInt(lock, 10);
  if (Date.now() > expiry) {
    localStorage.removeItem(QUOTA_LOCK_KEY);
    return false;
  }
  return true;
};

const setQuotaLock = () => {
  localStorage.setItem(QUOTA_LOCK_KEY, (Date.now() + 15 * 60 * 1000).toString());
};

export function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioCtx;
}

export const stopVoice = () => {
  currentSpeechId++;
  activeSources.forEach((source) => {
    try { source.stop(); } catch (e) {}
  });
  activeSources.clear();
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
};

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return buffer;
}

/**
 * Plays a notification sound for scam/safe results
 */
export const playNotificationSound = (isScam: boolean) => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  
  if (isScam) {
    // Alert Sound (Square Wave for grit, descending frequency)
    const playBeep = (time: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, time);
      osc.frequency.exponentialRampToValueAtTime(100, time + 0.15);
      
      gain.gain.setValueAtTime(0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
      
      osc.start(time);
      osc.stop(time + 0.15);
    };
    
    playBeep(now);
    playBeep(now + 0.2); // Double beep for danger
  } else {
    // Success Sound (Sine Wave for softness, ascending)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.3);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    osc.start(now);
    osc.stop(now + 0.4);
  }
};

export const speakSystem = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  stopVoice();
  const processed = normalizePhonetic(text);
  const utterance = new SpeechSynthesisUtterance(processed);
  
  const voices = window.speechSynthesis.getVoices();
  const tlVoice = voices.find(v => v.lang.includes('tl') || v.lang.includes('PH')) || 
                  voices.find(v => v.name.toLowerCase().includes('google') && v.lang.includes('en'));
  
  if (tlVoice) utterance.voice = tlVoice;
  
  utterance.lang = 'tl-PH';
  utterance.pitch = 1.0; 
  utterance.rate = 0.75; // Slower speed for better elder understanding
  window.speechSynthesis.speak(utterance);
};

export const playVoiceWarning = async (text: string): Promise<void> => {
  const myId = ++currentSpeechId;
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') await ctx.resume().catch(() => {});

  const cleanText = text.trim();

  if (audioCache.has(cleanText)) {
    const source = ctx.createBufferSource();
    source.buffer = audioCache.get(cleanText)!;
    source.connect(ctx.destination);
    activeSources.add(source);
    source.start(0);
    return;
  }

  const storedBytes = await getAudioFromDB(cleanText);
  if (storedBytes) {
    const audioBuffer = await decodeAudioData(storedBytes, ctx);
    audioCache.set(cleanText, audioBuffer);
    if (myId !== currentSpeechId) return;
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    activeSources.add(source);
    source.start(0);
    return;
  }

  if (checkQuotaStatus() || !navigator.onLine) {
    speakSystem(cleanText);
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ 
        parts: [{ 
          text: `Persona: Isang mapagmahal na Filipinang apo na nakikipag-usap nang mahinahon, malinaw, at MABAGAL sa kanyang Lolo at Lola. Gamit ang natural na punto at dahan-dahang cadence ng Tagalog, bigkasin ito: "${cleanText}"` 
        }] 
      }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });

    if (myId !== currentSpeechId) return;

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const rawBytes = decode(base64Audio);
      await saveAudioToDB(cleanText, rawBytes);
      const audioBuffer = await decodeAudioData(rawBytes, ctx);
      audioCache.set(cleanText, audioBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      activeSources.add(source);
      source.start(0);
    } else {
      speakSystem(cleanText);
    }
  } catch (error: any) {
    if (error.message?.includes('429')) setQuotaLock();
    speakSystem(cleanText);
  }
};

export const analyzeMessage = async (text: string): Promise<ScamAnalysis> => {
  // Check cache first
  const cached = cacheService.getScanResult(text);
  if (cached) {
    console.log('📱 Using cached analysis result');
    return cached;
  }

  const systemInstruction = `You are "Apo", a caring, respectful, and expert Cyber-Guardian for Filipino Senior Citizens. 
Your goal is to explain risks in a natural, conversational Tagalog that sounds like a helpful grandchild.

CRITICAL SCAM INDICATORS:
1. ANY LINK (unsolicited).
2. Requests for OTP, PIN, MPIN, or Password.
3. False Urgency or Huge Prizes.

TONE & STYLE RULES:
- Always use "po" and "opo" to show respect to Lolo and Lola.
- Phrase ReasonTagalog like a conversation: "Lola, mag-ingat po tayo dahil may link itong mensahe na pwedeng manakaw ang inyong detalye."
- Phrase ActionTagalog clearly but kindly: "Huwag niyo po itong pipindutin. Burahin na po natin ang message para tayo ay ligtas."

RESPONSE FORMAT: JSON ONLY.`;

  try {
    const result = await cacheService.cacheApiCall(
      `gemini_analysis_${text.slice(0, 50)}`,
      async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Mensahe na dapat suriin: "${text}"`,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isScam: { type: Type.BOOLEAN },
                confidence: { type: Type.NUMBER },
                reasonTagalog: { type: Type.STRING },
                actionTagalog: { type: Type.STRING },
              },
              required: ["isScam", "confidence", "reasonTagalog", "actionTagalog"],
            },
          },
        });
        
        return JSON.parse(response.text || '{}');
      },
      60 * 60 * 1000 // Cache for 1 hour
    );

    // Also store in scan results cache
    cacheService.storeScanResult(text, result);
    
    return result;
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    
    // Return cached result if available, even if expired
    const fallbackCache = cacheService.get(`gemini_analysis_${text.slice(0, 50)}`);
    if (fallbackCache) {
      console.log('📱 Using fallback cached result');
      return fallbackCache;
    }

    // Default safe response
    return {
      isScam: true,
      confidence: 0.98,
      reasonTagalog: "Lolo at Lola, naglalaman po ito ng kahina-hinalang link o humihingi ng inyong pribadong detalye. Mag-ingat po tayo.",
      actionTagalog: "Burahin na po agad ang mensaheng ito at huwag magbibigay ng anumang impormasyon sa kanila."
    };
  }
};
