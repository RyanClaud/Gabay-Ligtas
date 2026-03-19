import { GoogleGenAI, Type } from "@google/genai";
import { ScamAnalysis } from "../types";
import { cacheService } from "./cacheService";
import { getElevenLabsService } from "./elevenLabsService";

const DB_NAME = 'GabayLigtasAudioDBV13';
const STORE_NAME = 'audio_cache';
const QUOTA_LOCK_KEY = 'gabay_ligtas_quota_lock_v13';
const CACHE_VERSION_KEY = 'gabay_ligtas_cache_version';
const CURRENT_CACHE_VERSION = '13';

const audioCache = new Map<string, AudioBuffer>();
let audioCtx: AudioContext | null = null;
const activeSources = new Set<AudioBufferSourceNode>();
let currentSpeechId = 0;

const clearOldDatabases = async () => {
  try {
    const currentVersion = localStorage.getItem(CACHE_VERSION_KEY);
    if (currentVersion !== CURRENT_CACHE_VERSION) {
      const oldVersions = ['GabayLigtasAudioDBV12', 'GabayLigtasAudioDBV11', 'GabayLigtasAudioDBV10'];
      for (const oldDB of oldVersions) {
        try {
          await new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase(oldDB);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            req.onblocked = () => resolve();
          });
        } catch { /* continue */ }
      }
      audioCache.clear();
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);
    }
  } catch (error) {
    console.error('Error clearing old databases:', error);
  }
};

clearOldDatabases();

const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const getAudioFromDB = async (key: string): Promise<Uint8Array | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const request = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch { return null; }
};

const normalizePhonetic = (text: string): string => {
  const replacements: Record<string, string> = {
    'scam': 'is-kam', 'Scam': 'Iskam', 'link': 'lingk', 'OTP': 'O-T-P',
    'password': 'pas-word', 'MPIN': 'M-pin', 'online': 'on-layn',
    'checker': 'che-ker', 'raffle': 'ra-pol', 'click': 'pindutin',
    'message': 'men-sa-he', 'bank': 'bang-ko', 'suspended': 'na-sus-pend',
    'verification': 'ber-i-pi-kay-shon', 'GCash': 'Dyi-Kash', 'virus': 'bay-rus',
    'Facebook': 'Peys-buk', 'emergency': 'e-mer-dyen-si', 'code': 'kod',
    'download': 'dawn-lowd', 'update': 'ap-deyt', 'account': 'a-ka-unt',
    'security': 'se-kyu-ri-ti', 'number': 'num-be-ro',
  };
  let normalized = text;
  Object.entries(replacements).forEach(([key, val]) => {
    normalized = normalized.replace(new RegExp(`\\b${key}\\b`, 'gi'), val);
  });
  return normalized;
};

export const checkQuotaStatus = (): boolean => {
  const lock = localStorage.getItem(QUOTA_LOCK_KEY);
  if (!lock) return false;
  const expiry = parseInt(lock, 10);
  if (Date.now() > expiry) { localStorage.removeItem(QUOTA_LOCK_KEY); return false; }
  return true;
};

export function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioCtx;
}

export const stopVoice = () => {
  currentSpeechId++;
  activeSources.forEach((s) => { try { s.stop(); } catch { /* ignore */ } });
  activeSources.clear();
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
};

export const clearAudioCache = async (): Promise<void> => {
  try {
    audioCache.clear();
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  } catch (error) {
    console.error('Failed to clear audio cache:', error);
  }
};

if (typeof window !== 'undefined') {
  (window as any).clearAudioCache = clearAudioCache;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return buffer;
}

export const playNotificationSound = (isScam: boolean) => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  const now = ctx.currentTime;
  if (isScam) {
    const playBeep = (time: number) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, time);
      osc.frequency.exponentialRampToValueAtTime(100, time + 0.15);
      gain.gain.setValueAtTime(0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
      osc.start(time); osc.stop(time + 0.15);
    };
    playBeep(now); playBeep(now + 0.2);
  } else {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.3);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.start(now); osc.stop(now + 0.4);
  }
};

export const speakSystem = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  stopVoice();
  const utterance = new SpeechSynthesisUtterance(normalizePhonetic(text));
  const setVoiceAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    const tlVoice =
      voices.find(v => v.lang.includes('tl-PH')) ||
      voices.find(v => v.lang.includes('tl')) ||
      voices.find(v => v.lang.includes('fil')) ||
      voices.find(v => v.name.toLowerCase().includes('filipino')) ||
      voices.find(v => v.name.toLowerCase().includes('tagalog')) ||
      voices.find(v => v.name.toLowerCase().includes('google') && v.lang.includes('en-US')) ||
      voices.find(v => v.lang.includes('en-US'));
    if (tlVoice) utterance.voice = tlVoice;
    utterance.lang = 'tl-PH';
    utterance.rate = 0.75;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.onerror = (e) => console.error('Speech synthesis error:', e);
    window.speechSynthesis.speak(utterance);
  };
  if (window.speechSynthesis.getVoices().length > 0) {
    setVoiceAndSpeak();
  } else {
    window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
  }
};

const ELEVENLABS_QUOTA_KEY = 'elevenlabs_quota_exceeded_until';
const ELEVENLABS_KEY_HASH = 'elevenlabs_key_hash';

const isElevenLabsQuotaExceeded = (): boolean => {
  // If the API key changed, clear the quota lock
  const currentKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
  const storedHash = localStorage.getItem(ELEVENLABS_KEY_HASH);
  const currentHash = currentKey.slice(-8); // last 8 chars as simple hash
  if (storedHash !== currentHash) {
    localStorage.removeItem(ELEVENLABS_QUOTA_KEY);
    localStorage.setItem(ELEVENLABS_KEY_HASH, currentHash);
    return false;
  }
  const until = localStorage.getItem(ELEVENLABS_QUOTA_KEY);
  if (!until) return false;
  if (Date.now() > parseInt(until, 10)) {
    localStorage.removeItem(ELEVENLABS_QUOTA_KEY);
    return false;
  }
  return true;
};

const markElevenLabsQuotaExceeded = (): void => {
  // Cache quota exceeded state for 24 hours — stops hammering the API
  localStorage.setItem(ELEVENLABS_QUOTA_KEY, (Date.now() + 24 * 60 * 60 * 1000).toString());
};

const isAudioBufferCorrupted = (buf: AudioBuffer): boolean => {
  const ch = buf.getChannelData(0);
  const avg = ch.reduce((s, v) => s + Math.abs(v), 0) / ch.length;
  const max = Math.max(...Array.from(ch).map(Math.abs));
  return buf.duration < 0.5 || avg < 0.001 || max < 0.01 || ch.every(s => Math.abs(s) < 0.001);
};

const playAudioBuffer = (buf: AudioBuffer, ctx: AudioContext): void => {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  activeSources.add(src);
  src.start(0);
};

export const playVoiceWarning = async (text: string): Promise<void> => {
  const myId = ++currentSpeechId;
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
  const cleanText = text.trim();

  // --- Check memory cache ---
  if (audioCache.has(cleanText)) {
    try {
      const buf = audioCache.get(cleanText)!;
      if (isAudioBufferCorrupted(buf)) {
        audioCache.delete(cleanText);
      } else {
        playAudioBuffer(buf, ctx);
        return;
      }
    } catch (error) {
      console.error('Failed to play cached audio:', error);
      audioCache.delete(cleanText);
    }
  }

  // --- Check IndexedDB cache ---
  const storedBytes = await getAudioFromDB(cleanText);
  if (storedBytes) {
    try {
      const buf = await decodeAudioData(storedBytes, ctx);
      if (isAudioBufferCorrupted(buf)) {
        await clearAudioCache();
      } else {
        audioCache.set(cleanText, buf);
        if (myId !== currentSpeechId) return;
        playAudioBuffer(buf, ctx);
        return;
      }
    } catch (error) {
      console.error('Failed to decode stored audio:', error);
      await clearAudioCache();
    }
  }

  // --- Primary: ElevenLabs TTS ---
  const elevenLabs = getElevenLabsService();
  if (elevenLabs && !isElevenLabsQuotaExceeded()) {
    try {
      const arrayBuffer = await elevenLabs.generateSpeech(cleanText);
      // Copy buffer before decoding to avoid detached ArrayBuffer errors
      const copy = arrayBuffer.slice(0);
      const audioBuffer = await ctx.decodeAudioData(copy);
      if (!isAudioBufferCorrupted(audioBuffer)) {
        audioCache.set(cleanText, audioBuffer);
        if (myId !== currentSpeechId) return;
        playAudioBuffer(audioBuffer, ctx);
        return;
      }
    } catch (error: any) {
      // If quota exceeded, cache that state so we stop retrying for 24 hours
      if (error?.message?.includes('quota_exceeded') || error?.message?.includes('401')) {
        markElevenLabsQuotaExceeded();
      }
      console.error('ElevenLabs TTS failed, falling back to browser speech:', error);
    }
  }

  // --- Fallback: Browser speech synthesis ---
  speakSystem(cleanText);
};

// ---------------------------------------------------------------------------
// Pre-screening layer — runs BEFORE Gemini to maximise Recall.
// Tier 1: single high-precision signals → immediate scam verdict.
// Tier 2: two-signal combinations → high-confidence scam verdict.
// ---------------------------------------------------------------------------
interface PreScreenResult {
  isDefiniteScam: boolean;
  confidence: number;
}

const preScreenScam = (text: string): PreScreenResult => {
  const t = text.toLowerCase();

  // Tier 1 — single absolute signals
  if (/^https?:\/\/(bit\.ly|cutt\.ly|tinyurl\.com|rb\.gy|is\.gd|v\.gd|t\.co|short\.link|ow\.ly|goo\.gl|tiny\.cc|lnkd\.in)\/\S+$/i.test(text.trim()))
    return { isDefiniteScam: true, confidence: 0.97 };

  if (/\b(otp|one.time.pin|one.time.password|mpin|passcode)\b/i.test(t) &&
      /\b(send|ibigay|ibahagi|share|enter|ilagay|i-type|type)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.97 };

  if (/natanggap|nakatanggap|received|na-credit/i.test(t) &&
      /₱|php|piso|pesos/i.test(t) &&
      /https?:\/\/|bit\.ly|cutt\.ly|click|i-click|claim/i.test(t))
    return { isDefiniteScam: true, confidence: 0.97 };

  if (/\b(guaranteed|garantisado|siguradong)\b/i.test(t) &&
      /\b(kita|profit|return|tubo|pera|income|earnings)\b/i.test(t) &&
      /\b(araw-araw|daily|weekly|lingguhan|bawat araw|per day|bawat linggo)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.96 };

  if (/\b(bayad|bayaran|magbayad|pay|payment|fee|deposit)\b/i.test(t) &&
      /\b(activation|training|registration|slot|membership)\b/i.test(t) &&
      /\b(trabaho|job|work|kita|earn|kumita)\b/i.test(t))
    return { isDefiniteScam: true, confidence: 0.96 };

  // Tier 2 — two-signal combinations
  const hasShortUrl    = /bit\.ly|cutt\.ly|tinyurl|rb\.gy|is\.gd|v\.gd|ow\.ly|goo\.gl|tiny\.cc/i.test(t);
  const hasMoneyOffer  = /₱|php|piso|pesos|\$|libre|free|nanalo|won|prize|premyo|reward|bonus|kita|kumita|earn/i.test(t);
  const hasUrgency     = /urgent|agad|ngayon|now|limited|mabilis|asap|immediately|kaagad|bilisan|hurry|deadline|expire/i.test(t);
  const hasCred        = /otp|mpin|pin|password|passcode|cvv|account number|card number/i.test(t);
  const hasBankBrand   = /gcash|maya|paymaya|bpi|bdo|metrobank|landbank|unionbank|pnb|rcbc|eastwest|security bank/i.test(t);
  const hasGovBrand    = /bsp|bangko sentral|amlc|nbi|pnp|dti|bir|sss|gsis|philhealth|pagibig|pag-ibig/i.test(t);
  const hasLink        = /https?:\/\/|www\./i.test(t);
  const hasPrize       = /nanalo|won|winner|congratulations|premyo|prize|raffle|reward|jackpot/i.test(t);
  const hasJobOffer    = /trabaho|job offer|hiring|work from home|part.?time|full.?time|kumita ng/i.test(t);
  const hasRomance     = /mahal kita|i love you|miss you|foreign|abroad|soldier|doctor.*money|engineer.*money/i.test(t);
  const hasMoneyReq    = /magpadala|send money|padala|transfer|gcash mo|maya mo|bayad|utang|pautang|loan/i.test(t);
  const hasCrypto      = /crypto|bitcoin|btc|ethereum|eth|usdt|binance|trading|invest/i.test(t);
  const hasBadAccount  = /selling.*account|selling.*sim|verified.*account|registered.*sim|buy.*account/i.test(t);

  if (hasShortUrl && hasMoneyOffer)          return { isDefiniteScam: true, confidence: 0.95 };
  if (hasShortUrl && hasUrgency)             return { isDefiniteScam: true, confidence: 0.94 };
  if (hasBankBrand && hasCred)               return { isDefiniteScam: true, confidence: 0.96 };
  if (hasGovBrand && (hasCred || (hasLink && hasUrgency))) return { isDefiniteScam: true, confidence: 0.95 };
  if (hasPrize && hasLink)                   return { isDefiniteScam: true, confidence: 0.93 };
  if (hasPrize && hasMoneyReq)               return { isDefiniteScam: true, confidence: 0.95 };
  if (hasJobOffer && hasMoneyReq)            return { isDefiniteScam: true, confidence: 0.94 };
  if (hasRomance && hasMoneyReq)             return { isDefiniteScam: true, confidence: 0.94 };
  if (hasCrypto && hasMoneyOffer && hasUrgency) return { isDefiniteScam: true, confidence: 0.93 };
  if (hasBadAccount)                         return { isDefiniteScam: true, confidence: 0.93 };
  if (hasBankBrand && hasLink && hasUrgency) return { isDefiniteScam: true, confidence: 0.94 };

  return { isDefiniteScam: false, confidence: 0 };
};

// ---------------------------------------------------------------------------
// Fallback scorer — used when Gemini is unavailable.
// Uses β=2 F-score logic: Recall is weighted 2× over Precision.
// Decision threshold = 0.35 (lower than 0.5) to minimise false negatives.
// ---------------------------------------------------------------------------
const fallbackScorer = (text: string): ScamAnalysis => {
  const pre = preScreenScam(text);
  if (pre.isDefiniteScam) {
    return {
      isScam: true,
      confidence: pre.confidence,
      reasonTagalog: 'Lolo at Lola, natuklasan po namin ang isang mapanganib na pattern sa mensaheng ito na karaniwang ginagamit ng mga manloloko sa Pilipinas.',
      actionTagalog: 'Huwag po mag-click, mag-reply, o magbigay ng personal na impormasyon. I-delete na po agad ito.',
    };
  }

  const t = text.toLowerCase();

  const features: Array<{ hit: boolean; weight: number }> = [
    { hit: /https?:\/\/|www\./i.test(t),                                              weight: 0.25 },
    { hit: /bit\.ly|cutt\.ly|tinyurl|rb\.gy|is\.gd|ow\.ly/i.test(t),                 weight: 0.45 },
    { hit: /\botp\b|\bmpin\b|\bpin\b|\bpassword\b|\bcvv\b/i.test(t),                  weight: 0.40 },
    { hit: /gcash|maya|paymaya/i.test(t),                                              weight: 0.20 },
    { hit: /bpi|bdo|metrobank|landbank|unionbank/i.test(t),                            weight: 0.20 },
    { hit: /₱|php|piso|pesos/i.test(t),                                                weight: 0.15 },
    { hit: /urgent|agad|ngayon na|kaagad|bilisan|hurry|asap|deadline|expire/i.test(t), weight: 0.20 },
    { hit: /nanalo|won|winner|premyo|prize|raffle|jackpot|congratulations/i.test(t),   weight: 0.30 },
    { hit: /libre|free|bonus|reward|gift|regalo/i.test(t),                             weight: 0.15 },
    { hit: /invest|crypto|bitcoin|trading|siguradong.*kita|garantisadong.*kita/i.test(t), weight: 0.35 },
    { hit: /trabaho|job offer|hiring|work from home|kumita ng/i.test(t),               weight: 0.15 },
    { hit: /bayad.*activation|bayad.*training|bayad.*registration/i.test(t),           weight: 0.45 },
    { hit: /mahal kita|i love you|foreign.*money|abroad.*padala/i.test(t),             weight: 0.30 },
    { hit: /i-click|pindutin.*link|click.*link|tap.*link/i.test(t),                    weight: 0.25 },
    { hit: /i-download|mag-download|install/i.test(t),                                 weight: 0.20 },
    { hit: /mag-login|i-login|sign in|log in/i.test(t),                                weight: 0.20 },
    { hit: /suspended|na-suspend|i-freeze|frozen|blocked|na-block/i.test(t),           weight: 0.25 },
    { hit: /bsp|bangko sentral|amlc|nbi|pnp|dti|bir/i.test(t),                        weight: 0.20 },
  ];

  const legitDiscounts: Array<{ hit: boolean; discount: number }> = [
    { hit: /welcome.*ka-tm|tm tambayan|globe.*sim|smart.*sim/i.test(t),                discount: 0.35 },
    { hit: /resibo|receipt|order number|tracking number|delivery/i.test(t),            discount: 0.30 },
    { hit: /official.*website|opisyal.*website|pumunta.*app/i.test(t),                 discount: 0.25 },
    { hit: /^(ok|sige|salamat|oo|hindi|huwag|mahal kita|kumain ka na|ingat)\b/i.test(t.trim()), discount: 0.50 },
  ];

  let score = features.reduce((s, f) => s + (f.hit ? f.weight : 0), 0);
  score -= legitDiscounts.reduce((s, d) => s + (d.hit ? d.discount : 0), 0);

  // Combination bonuses
  const hasLink    = /https?:\/\/|www\./i.test(t);
  const hasPrize   = /nanalo|won|winner|premyo|prize|raffle/i.test(t);
  const hasUrgency = /urgent|agad|ngayon na|kaagad|bilisan|hurry|asap/i.test(t);
  const hasCred    = /otp|mpin|pin|password|cvv/i.test(t);
  const hasBank    = /gcash|maya|bpi|bdo|metrobank|landbank/i.test(t);

  if (hasLink && hasPrize)   score += 0.30;
  if (hasLink && hasUrgency) score += 0.25;
  if (hasCred && hasBank)    score += 0.40;
  if (hasPrize && hasUrgency) score += 0.20;

  score = Math.max(0, score);

  // β=2 F-score threshold: favour Recall over Precision
  const THRESHOLD = 0.35;
  const isScam = score >= THRESHOLD;
  const confidence = isScam
    ? Math.min(0.95, 0.55 + (score - THRESHOLD) * 0.5)
    : Math.max(0.60, 0.90 - score * 0.8);

  return {
    isScam,
    confidence,
    reasonTagalog: isScam
      ? 'Lolo at Lola, may mga nakitang palatandaan ng scam sa mensaheng ito. Maingat po tayong mag-ingat sa ganitong uri ng mensahe.'
      : 'Mukhang normal na mensahe po ito, Lolo at Lola. Walang nakitang mapanganib na palatandaan.',
    actionTagalog: isScam
      ? 'Huwag po mag-click, mag-reply, o magbigay ng personal na impormasyon. I-delete na po agad ito.'
      : 'Safe po ito. Pwede ninyong basahin at mag-reply kung gusto ninyo.',
  };
};

// ---------------------------------------------------------------------------
// Main analysis function — 3-layer pipeline:
//   1. Pre-screen (instant, high-recall rule engine)
//   2. Gemini LLM (accurate, with post-processing override)
//   3. Fallback scorer (when Gemini unavailable)
// ---------------------------------------------------------------------------
export const analyzeMessage = async (text: string): Promise<ScamAnalysis> => {
  const textHash = text.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0).toString(36);

  // Layer 1: Pre-screen — catches definite scams before any API call
  const pre = preScreenScam(text);
  if (pre.isDefiniteScam) {
    const result: ScamAnalysis = {
      isScam: true,
      confidence: pre.confidence,
      reasonTagalog: 'Lolo at Lola, natuklasan po namin ang isang mapanganib na pattern sa mensaheng ito na karaniwang ginagamit ng mga manloloko sa Pilipinas.',
      actionTagalog: 'Huwag po mag-click, mag-reply, o magbigay ng personal na impormasyon. I-delete na po agad ito.',
    };
    cacheService.storeScanResult(text, result);
    return result;
  }

  // Layer 2: Cache check
  const cached = cacheService.getScanResult(text);
  if (cached) return cached;

  // Layer 3: Gemini LLM
  const systemInstruction = `You are "Apo", a caring and expert Cyber-Guardian for Filipino Senior Citizens.
Analyze messages for scam indicators with HIGH RECALL — missing a scam is far worse than a false alarm.

PHILIPPINE SCAM PATTERNS:
1. Phishing: fake bank/gov SMS, OTP requests, account suspension threats, suspicious links
2. Investment: guaranteed returns, crypto, recruit-to-earn, limited slots
3. Prize/Raffle: advance fee to claim winnings, fake congratulations
4. Job scams: pay activation/training fee, Telegram-only communication
5. Romance: foreign professional, money for emergency/travel/customs
6. Gaming: pay-to-play with prizes, suspicious links
7. Impersonation: BSP, AMLC, NBI, PNP, bank fraud departments

DECISION RULES (optimised for high Recall):
- ANY request for OTP/MPIN/password → isScam: true
- Shortened URL alone (bit.ly, cutt.ly, etc.) → isScam: true
- Prize claim + link or fee → isScam: true
- Bank/gov brand + credential request → isScam: true
- Guaranteed investment returns → isScam: true
- Job offer + upfront payment → isScam: true
- When uncertain, lean toward isScam: true (false negative is more harmful)

SAFE: Normal personal conversations, official telco SIM notices, legitimate delivery receipts.

RESPONSE: JSON only — isScam (bool), confidence (0.0–1.0), reasonTagalog (string), actionTagalog (string).
Use "po/opo" in Tagalog. Be concise for senior citizens.`;

  try {
    const result = await cacheService.cacheApiCall(
      `gemini_v2_${textHash}`,
      async () => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY not set');

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ parts: [{ text: `Analyze this message for scam indicators:\n\n"${text}"` }] }],
          config: {
            temperature: 0.05,
            topK: 1,
            topP: 0.9,
            maxOutputTokens: 512,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isScam:        { type: Type.BOOLEAN },
                confidence:    { type: Type.NUMBER },
                reasonTagalog: { type: Type.STRING },
                actionTagalog: { type: Type.STRING },
              },
              required: ['isScam', 'confidence', 'reasonTagalog', 'actionTagalog'],
            },
            systemInstruction: { parts: [{ text: systemInstruction }] },
          },
        });

        const responseText = response.text;
        if (!responseText) throw new Error('Empty Gemini response');

        const parsed = JSON.parse(responseText);
        if (typeof parsed.isScam !== 'boolean' || typeof parsed.confidence !== 'number')
          throw new Error('Invalid Gemini response structure');

        // Post-processing: override Gemini false negatives using pre-screen
        const reCheck = preScreenScam(text);
        if (reCheck.isDefiniteScam && !parsed.isScam) {
          return {
            isScam: true,
            confidence: reCheck.confidence,
            reasonTagalog: parsed.reasonTagalog || 'Lolo at Lola, natuklasan po namin ang mapanganib na pattern sa mensaheng ito.',
            actionTagalog: 'Huwag po mag-click, mag-reply, o magbigay ng personal na impormasyon. I-delete na po agad ito.',
          };
        }

        return parsed;
      },
      60 * 60 * 1000
    );

    cacheService.storeScanResult(text, result);
    return result;

  } catch (error: any) {
    console.error('Gemini analysis failed:', error.message);

    // Layer 4: Fallback scorer
    const fallbackCache = cacheService.get<ScamAnalysis>(`gemini_v2_${textHash}`);
    if (fallbackCache) return fallbackCache;

    const result = fallbackScorer(text);
    cacheService.storeScanResult(text, result);
    return result;
  }
};
