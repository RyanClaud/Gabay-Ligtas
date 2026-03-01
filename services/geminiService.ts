
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ScamAnalysis } from "../types";
import { cacheService } from "./cacheService";
import { getElevenLabsService, FILIPINO_VOICES } from "./elevenLabsService";
import { getHuggingFaceService, TTS_MODELS } from "./huggingFaceService";

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
  console.log('🔊 Using browser speech synthesis fallback');
  if (!('speechSynthesis' in window)) {
    console.warn('❌ Speech synthesis not supported in this browser');
    return;
  }
  
  stopVoice();
  const processed = normalizePhonetic(text);
  const utterance = new SpeechSynthesisUtterance(processed);
  
  // Wait for voices to load
  const setVoiceAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    console.log('🎤 Available voices:', voices.map(v => `${v.name} (${v.lang})`));
    
    // Try to find Filipino/Tagalog voices in order of preference
    const tlVoice = voices.find(v => v.lang.includes('tl-PH')) ||
                    voices.find(v => v.lang.includes('tl')) ||
                    voices.find(v => v.lang.includes('fil')) ||
                    voices.find(v => v.name.toLowerCase().includes('filipino')) ||
                    voices.find(v => v.name.toLowerCase().includes('tagalog')) ||
                    voices.find(v => v.name.toLowerCase().includes('google') && v.lang.includes('en-US')) ||
                    voices.find(v => v.lang.includes('en-US'));
    
    if (tlVoice) {
      console.log('🎤 Selected voice:', tlVoice.name, tlVoice.lang);
      utterance.voice = tlVoice;
    } else {
      console.warn('⚠️ No Filipino voice found, using default');
    }
    
    utterance.lang = 'tl-PH';
    utterance.pitch = 1.0; 
    utterance.rate = 0.75; // Slower speed for better elder understanding
    utterance.volume = 0.9;
    
    utterance.onstart = () => console.log('🔊 Speech started');
    utterance.onend = () => console.log('🔊 Speech ended');
    utterance.onerror = (e) => console.error('❌ Speech error:', e);
    
    window.speechSynthesis.speak(utterance);
  };
  
  // Check if voices are already loaded
  if (window.speechSynthesis.getVoices().length > 0) {
    setVoiceAndSpeak();
  } else {
    // Wait for voices to load
    window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
  }
};

export const playVoiceWarning = async (text: string): Promise<void> => {
  const myId = ++currentSpeechId;
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') await ctx.resume().catch(() => {});

  const cleanText = text.trim();

  // Check cache first
  if (audioCache.has(cleanText)) {
    console.log('🔊 Playing cached audio');
    const source = ctx.createBufferSource();
    source.buffer = audioCache.get(cleanText)!;
    source.connect(ctx.destination);
    activeSources.add(source);
    source.start(0);
    return;
  }

  // Check IndexedDB cache
  const storedBytes = await getAudioFromDB(cleanText);
  if (storedBytes) {
    console.log('🔊 Playing stored audio from IndexedDB');
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

  // Try Hugging Face TTS first (free, Tagalog support, via proxy)
  const huggingFace = getHuggingFaceService();
  if (navigator.onLine) {
    try {
      console.log('🎤 Attempting Hugging Face TTS...');
      
      // Use Filipino-optimized text
      const filipinoText = `Mga Lolo at Lola, ${cleanText}`;
      const audioBuffer = await huggingFace.generateSpeech(
        filipinoText,
        TTS_MODELS.MMS_TTS // Facebook's MMS TTS for Tagalog
      );

      if (myId !== currentSpeechId) return;

      // Create a copy of the ArrayBuffer before using it
      const audioBufferCopy = audioBuffer.slice(0);
      
      // Convert ArrayBuffer to AudioBuffer with error handling
      let audioData: AudioBuffer;
      try {
        audioData = await ctx.decodeAudioData(audioBufferCopy);
      } catch (decodeError) {
        console.error('❌ Failed to decode Hugging Face audio data:', decodeError);
        throw new Error('Audio decoding failed');
      }
      
      // Cache the audio using original buffer
      const uint8Array = new Uint8Array(audioBuffer);
      await saveAudioToDB(cleanText, uint8Array);
      audioCache.set(cleanText, audioData);

      // Play the audio
      console.log('✅ Hugging Face TTS successful, playing audio');
      const source = ctx.createBufferSource();
      source.buffer = audioData;
      source.connect(ctx.destination);
      activeSources.add(source);
      source.start(0);
      return;

    } catch (error: any) {
      console.error('❌ Hugging Face TTS failed:', error.message);
      // Continue to ElevenLabs fallback
    }
  }

  // Try ElevenLabs TTS as fallback
  const elevenLabs = getElevenLabsService();
  if (elevenLabs && navigator.onLine) {
    try {
      console.log('🎤 Attempting ElevenLabs TTS...');
      
      // Use a Filipino-optimized voice and add Filipino context
      const filipinoText = `Mga Lolo at Lola, ${cleanText}`;
      const audioBuffer = await elevenLabs.generateSpeech(
        filipinoText,
        FILIPINO_VOICES[1].voice_id, // Bella - warm female voice
        {
          stability: 0.6,        // Slightly more stable for seniors
          similarity_boost: 0.8, // Higher similarity for clearer speech
          style: 0.1,           // Slight style for more natural speech
          use_speaker_boost: true
        }
      );

      if (myId !== currentSpeechId) return;

      // Create a copy of the ArrayBuffer before using it
      const audioBufferCopy = audioBuffer.slice(0);
      
      // Convert ArrayBuffer to AudioBuffer with error handling
      let audioData: AudioBuffer;
      try {
        audioData = await ctx.decodeAudioData(audioBufferCopy);
      } catch (decodeError) {
        console.error('❌ Failed to decode ElevenLabs audio data:', decodeError);
        throw new Error('Audio decoding failed');
      }
      
      // Cache the audio using original buffer
      const uint8Array = new Uint8Array(audioBuffer);
      await saveAudioToDB(cleanText, uint8Array);
      audioCache.set(cleanText, audioData);

      // Play the audio
      console.log('✅ ElevenLabs TTS successful, playing audio');
      const source = ctx.createBufferSource();
      source.buffer = audioData;
      source.connect(ctx.destination);
      activeSources.add(source);
      source.start(0);
      return;

    } catch (error: any) {
      console.error('❌ ElevenLabs TTS failed:', error.message);
      // Continue to Hugging Face fallback
    }
  }

  // Try Hugging Face TTS as fallback (has CORS issues in browser, works in production with proxy)
  const huggingFace = getHuggingFaceService();
  if (navigator.onLine && import.meta.env.PROD) { // Only try in production where we might have a proxy
    try {
      console.log('🎤 Attempting Hugging Face TTS...');
      
      // Use Filipino-optimized text
      const filipinoText = `Mga Lolo at Lola, ${cleanText}`;
      const audioBuffer = await huggingFace.generateSpeech(
        filipinoText,
        TTS_MODELS.MMS_TTS // Facebook's MMS TTS for Tagalog
      );

      if (myId !== currentSpeechId) return;

      // Create a copy of the ArrayBuffer before using it
      const audioBufferCopy = audioBuffer.slice(0);
      
      // Convert ArrayBuffer to AudioBuffer with error handling
      let audioData: AudioBuffer;
      try {
        audioData = await ctx.decodeAudioData(audioBufferCopy);
      } catch (decodeError) {
        console.error('❌ Failed to decode Hugging Face audio data:', decodeError);
        throw new Error('Audio decoding failed');
      }
      
      // Cache the audio using original buffer
      const uint8Array = new Uint8Array(audioBuffer);
      await saveAudioToDB(cleanText, uint8Array);
      audioCache.set(cleanText, audioData);

      // Play the audio
      console.log('✅ Hugging Face TTS successful, playing audio');
      const source = ctx.createBufferSource();
      source.buffer = audioData;
      source.connect(ctx.destination);
      activeSources.add(source);
      source.start(0);
      return;

    } catch (error: any) {
      console.error('❌ Hugging Face TTS failed:', error.message);
      // Continue to Gemini TTS fallback
    }
  }

  // Fallback to Gemini TTS if both ElevenLabs and Hugging Face fail
  if (checkQuotaStatus()) {
    console.log('⚠️ TTS quota locked, using browser speech synthesis');
    speakSystem(cleanText);
    return;
  }
  
  if (!navigator.onLine) {
    console.log('⚠️ Offline, using browser speech synthesis');
    speakSystem(cleanText);
    return;
  }

  try {
    console.log('🤖 Attempting Gemini TTS as fallback...');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
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
      console.log('✅ Gemini TTS successful, playing audio');
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
      console.warn('⚠️ Gemini TTS returned no audio data, falling back to browser speech');
      speakSystem(cleanText);
    }
  } catch (error: any) {
    console.error('❌ Gemini TTS failed:', error.message);
    if (error.message?.includes('429')) {
      console.warn('⚠️ TTS quota exceeded, setting lock');
      setQuotaLock();
    }
    console.log('🔄 Falling back to browser speech synthesis');
    speakSystem(cleanText);
  }
};

export const analyzeMessage = async (text: string): Promise<ScamAnalysis> => {
  console.log('🔍 Starting analysis for text:', text.substring(0, 50) + '...');
  
  // Create a unique hash for the full text content
  const textHash = text.split('').reduce((hash, char) => {
    return ((hash << 5) - hash) + char.charCodeAt(0);
  }, 0).toString(36);
  
  console.log('🔑 Generated hash for text:', textHash);
  
  // CRITICAL: Skip cache for known problematic gaming scam patterns
  const isKnownGamingScam = /Hi.*9675715673.*claim.*P3097.*play games.*win big prizes.*cutt\.ly/i.test(text);
  const shouldSkipCache = isKnownGamingScam || /play games.*win.*prize.*cutt\.ly|claim.*pesos.*play.*games.*link/i.test(text);
  
  if (shouldSkipCache) {
    console.log('🚨 Skipping cache for known gaming scam pattern');
  } else {
    // Check cache first using the full text
    const cached = cacheService.getScanResult(text);
    if (cached) {
      console.log('📱 Using cached analysis result for hash:', textHash);
      return cached;
    }
  }

  // Enhanced system instruction with Philippine-specific scam knowledge
  const systemInstruction = `You are "Apo", a caring, respectful, and expert Cyber-Guardian for Filipino Senior Citizens. 
Your goal is to analyze messages accurately and explain risks in natural, conversational Tagalog.

PHILIPPINE CYBERCRIME SCAM PATTERNS TO DETECT:

1. PHISHING & SPOOFING:
   - Fake bank/government SMS with suspicious links
   - Requests for OTP, PIN, MPIN, passwords
   - Messages claiming account suspension/verification needed
   - Vishing attempts asking to "update" account details

2. CONSUMER FRAUD:
   - Fake online stores on social media
   - Too-good-to-be-true product offers
   - Requests for GCash/Maya payments upfront
   - Non-delivery scams

3. INVESTMENT SCAMS:
   - Cryptocurrency investment offers
   - High-return investment promises
   - Advance fee scams (pay fees to claim prizes)
   - "Limited time" investment opportunities

4. IDENTITY THEFT:
   - Family/friend impersonation claiming emergencies
   - Requests for urgent money transfers
   - Deepfake or account takeover attempts
   - Illegal SIM/e-wallet account offers

5. ROMANCE SCAMS:
   - Long-term relationship building
   - Requests for money for "travel" or "emergencies"
   - Investment opportunities from romantic interests

6. GAMING/GAMBLING SCAMS:
   - Messages offering money to play games
   - Prize claims for gaming or gambling
   - Links to gaming sites with money offers
   - "Win big prizes" with suspicious links

CRITICAL SCAM INDICATORS:
- Any message with shortened URLs (bit.ly, cutt.ly, t.co, etc.) + money offers = HIGH RISK
- STANDALONE SUSPICIOUS LINKS = HIGH RISK (especially URL shorteners)
- Gaming/gambling offers with links = HIGH RISK  
- Prize claims with external links = HIGH RISK
- Money offers from unknown sources = HIGH RISK
- Isolated shortened URLs without context = VERY HIGH RISK

SPECIAL RULES FOR STANDALONE LINKS:
- If message is ONLY a shortened URL (bit.ly, cutt.ly, etc.) → isScam: true, confidence: 0.9+
- If message is ONLY any suspicious link → isScam: true, confidence: 0.8+
- Standalone links are inherently suspicious and dangerous
- No legitimate business sends only a shortened URL without context

LEGITIMATE MESSAGES (SAFE):
- Official telco messages (TM, Globe, Smart) about SIM registration
- Genuine business communications without suspicious requests
- Normal family/friend conversations
- Educational content without links or money requests
- News or informational messages

ANALYSIS RULES:
- If message contains gaming + money + link → isScam: true, confidence: 0.9+
- If message contains prize + link + money → isScam: true, confidence: 0.9+
- If it matches Philippine scam patterns → isScam: true, high confidence
- If it's clearly legitimate communication → isScam: false, high confidence
- If uncertain → moderate confidence levels
- Consider context: sender, content, requests made

RESPONSE RULES:
- Use "po" and "opo" for respect
- ReasonTagalog: Explain WHY it's safe/dangerous based on Philippine scam patterns
- ActionTagalog: Give specific advice (delete if scam, "okay lang po" if safe)
- Be conversational like a caring grandchild

RESPONSE FORMAT: JSON ONLY with isScam (boolean), confidence (0.0-1.0), reasonTagalog (string), actionTagalog (string)`;

  try {
    console.log('🤖 Calling Gemini API...');
    
    // Use the full text hash for caching instead of just first 50 characters
    const result = await cacheService.cacheApiCall(
      `gemini_analysis_${textHash}`,
      async () => {
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
          throw new Error('API key not found. Please check your environment variables.');
        }
        
        console.log('🔑 API key found, initializing Gemini...');
        
        const ai = new GoogleGenAI({ apiKey });
        
        console.log('📤 Sending request to Gemini...');
        
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash", // Using current stable model name
          contents: [{
            parts: [{
              text: `Please analyze this message for scam indicators: "${text}"`
            }]
          }],
          config: {
            temperature: 0.1, // Low temperature for consistent analysis
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 1000,
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
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            }
          }
        });
        
        console.log('📥 Received response from Gemini');
        
        // Use the correct response structure for the new Google GenAI library
        const responseText = response.text;
        console.log('📄 Raw response:', responseText);
        
        if (!responseText) {
          throw new Error('Empty response from Gemini API');
        }
        
        const parsedResult = JSON.parse(responseText);
        console.log('✅ Parsed result:', parsedResult);
        
        // Validate the response structure
        if (typeof parsedResult.isScam !== 'boolean' || 
            typeof parsedResult.confidence !== 'number' ||
            typeof parsedResult.reasonTagalog !== 'string' ||
            typeof parsedResult.actionTagalog !== 'string') {
          throw new Error('Invalid response structure from Gemini API');
        }
        
        // CRITICAL: Override Gemini if it's clearly wrong about gaming scams or standalone links
        const hasGamingScamPattern = /play games.*win.*prize.*link|claim.*pesos.*play.*games|gaming.*money.*link/i.test(text);
        const hasShortLink = /cutt\.ly|bit\.ly|t\.co|short\.link/i.test(text);
        const isStandaloneShortLink = /^https?:\/\/(bit\.ly|cutt\.ly|t\.co|tinyurl\.com|short\.link|rb\.gy|is\.gd|v\.gd)\/[a-zA-Z0-9]+\??[a-zA-Z0-9]*$/i.test(text.trim());
        
        if ((hasGamingScamPattern && hasShortLink && !parsedResult.isScam) || 
            (isStandaloneShortLink && !parsedResult.isScam)) {
          console.log('🚨 OVERRIDE: Gemini incorrectly marked suspicious link/scam as safe - correcting!');
          return {
            isScam: true,
            confidence: 0.95,
            reasonTagalog: isStandaloneShortLink ? 
              "Lolo at Lola, delikado po ang mga standalone na shortened links tulad nito! Walang legitimate na negosyo ang magpapadala lang ng link na walang explanation." :
              "Lolo at Lola, ito po ay gaming scam! May suspicious link at nag-aalok ng pera para sa games. Delikado po ito.",
            actionTagalog: "Huwag po kayong mag-click sa link at i-delete na po natin ito agad!"
          };
        }
        
        return parsedResult;
      },
      60 * 60 * 1000 // Cache for 1 hour
    );

    // Store in scan results cache using full text
    cacheService.storeScanResult(text, result);
    
    console.log('✅ Analysis completed successfully:', result);
    return result;
    
  } catch (error: any) {
    console.error('❌ Analysis failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      apiKey: process.env.GEMINI_API_KEY ? 'Present' : 'Missing',
      geminiApiKey: process.env.GEMINI_API_KEY ? 'Present' : 'Missing'
    });
    
    // Try to get cached result if available, even if expired (using full text hash)
    const fallbackCache = cacheService.get<ScamAnalysis>(`gemini_analysis_${textHash}`);
    if (fallbackCache) {
      console.log('📱 Using fallback cached result');
      return fallbackCache;
    }

    // Enhanced Philippine-specific scam pattern detection
    console.log('🔍 Performing fallback analysis...');
    
    // Philippine-specific scam indicators
    const hasLink = /https?:\/\/|www\.|\.com|\.org|\.net|bit\.ly|tinyurl|cutt\.ly|t\.co|short\.link|click here|click this|i-click|pindutin|exclusive link/i.test(text);
    const hasOTP = /otp|pin|mpin|password|passcode|verification code|verify|i-verify|mag-verify/i.test(text);
    const hasUrgency = /urgent|asap|now|limited|expire|act fast|immediately|suspended|expire|deadline|mabilis|agad|ngayon|exclusive/i.test(text);
    const hasPrize = /won|winner|prize|free|congratulations|nanalo|million|pesos|dollars|claim|reward|bonus|libreng|premyo|win big|play games|games/i.test(text);
    const hasBankTerms = /bank|account|suspended|verify|confirm|update|security|balance|received.*php|new balance|gcash|maya|paymaya|bpi|bdo|metrobank/i.test(text);
    const hasPhishing = /click|download|install|update|confirm|verify|login|sign in|mag-login|i-download|i-install/i.test(text);
    const hasFakeTransfer = /received.*php.*from.*new balance.*claim|natanggap.*piso.*mula|bagong balance/i.test(text.toLowerCase());
    const hasInvestment = /investment|invest|crypto|bitcoin|trading|high return|guaranteed|profit|kita|tubo|negosyo|pera/i.test(text);
    const hasRomanceScam = /emergency|travel|hospital|accident|help me|tulong|emergency|aksidente|ospital/i.test(text);
    const hasImpersonation = /family|emergency|urgent help|tulong|pamilya|kapatid|anak|nanay|tatay/i.test(text);
    const hasSIMScam = /sim|registration|register|i-register|sim card|prepaid|postpaid/i.test(text);
    const hasIllegalSales = /selling.*sim|selling.*gcash|selling.*account|verified.*account|registered.*sim/i.test(text);
    const hasGambling = /play games|gaming|casino|slots|poker|gambling|lotto|raffle|sweepstakes|have fun playing/i.test(text);
    
    // CRITICAL: Detect standalone suspicious links
    const isSuspiciousLink = /^https?:\/\/(bit\.ly|cutt\.ly|t\.co|tinyurl\.com|short\.link|rb\.gy|is\.gd|v\.gd)\/[a-zA-Z0-9]+\??[a-zA-Z0-9]*$/i.test(text.trim());
    const isKnownScamLink = /bit\.ly\/4jSRL6w|cutt\.ly\/OtxwVxlF/i.test(text);
    const isStandaloneLink = /^https?:\/\/[^\s]+$/.test(text.trim()) && text.trim().length < 100;
    
    // Check for legitimate telco patterns (these reduce scam score)
    const isLegitTelco = /welcome.*ka-tm|globe|smart.*prepaid|sim registration.*free|tm tambayan|official.*telco/i.test(text);
    const isLegitBusiness = /receipt|invoice|order|delivery|shipping|resibo|order number/i.test(text);
    
    console.log('🔍 Fallback analysis indicators:', {
      hasLink, hasOTP, hasUrgency, hasPrize, hasBankTerms, hasPhishing, 
      hasFakeTransfer, hasInvestment, hasRomanceScam, hasImpersonation, 
      hasSIMScam, hasIllegalSales, hasGambling, isSuspiciousLink, isKnownScamLink, 
      isStandaloneLink, isLegitTelco, isLegitBusiness
    });
    
    // More sophisticated Philippine scam scoring
    let riskScore = 0;
    
    // CRITICAL: Standalone suspicious links are HIGH RISK
    if (isSuspiciousLink) riskScore += 0.8; // Very high risk for standalone URL shorteners
    if (isKnownScamLink) riskScore += 1.0; // Maximum risk for known scam links
    if (isStandaloneLink && hasLink) riskScore += 0.6; // High risk for any standalone link
    
    // High-risk indicators
    if (hasFakeTransfer) riskScore += 0.8; // Very high risk for fake transfer messages
    if (hasOTP && hasBankTerms) riskScore += 0.7; // Banking phishing
    if (hasInvestment && hasUrgency) riskScore += 0.6; // Investment scams
    if (hasLink && hasUrgency) riskScore += 0.5; // Urgent phishing
    if (hasPrize && hasLink) riskScore += 0.5; // Prize scams
    
    // Medium-risk indicators
    if (hasLink) riskScore += 0.3;
    if (hasOTP) riskScore += 0.4;
    if (hasUrgency) riskScore += 0.2;
    if (hasPrize) riskScore += 0.3;
    if (hasBankTerms) riskScore += 0.2;
    if (hasPhishing) riskScore += 0.2;
    if (hasRomanceScam) riskScore += 0.3;
    if (hasImpersonation) riskScore += 0.3;
    if (hasIllegalSales) riskScore += 0.6; // High risk for illegal account/SIM sales
    if (hasGambling) riskScore += 0.4; // High risk for gambling/gaming scams
    
    // High-risk combinations (very dangerous)
    if (hasGambling && hasLink && hasPrize) riskScore += 0.6; // Gaming scam with link and prizes
    if (hasLink && hasPrize && hasUrgency) riskScore += 0.4; // Urgent prize claims with links
    
    // Reduce score for legitimate patterns
    if (isLegitTelco) riskScore -= 0.4;
    if (isLegitBusiness) riskScore -= 0.3;
    if (hasSIMScam && isLegitTelco) riskScore -= 0.5; // Legitimate SIM registration
    
    // Ensure score stays within bounds
    riskScore = Math.max(0, Math.min(2.0, riskScore));
    
    const isScam = riskScore >= 0.5;
    const confidence = Math.min(0.95, Math.max(0.15, riskScore / 2.0));
    
    console.log('🔍 Fallback analysis result:', { isScam, confidence, riskScore });
    
    const result = isScam ? {
      isScam: true,
      confidence: confidence,
      reasonTagalog: isSuspiciousLink || isStandaloneLink ? 
        "Lolo at Lola, delikado po ang mga standalone na links lalo na ang mga shortened URLs! Walang legitimate na kumpanya ang magpapadala lang ng link na walang explanation o context." :
        "Lolo at Lola, may mga nakikitang delikadong pattern po itong mensahe. Mukhang isa po ito sa mga kilalang scam sa Pilipinas tulad ng gaming scam, fake money offers, o phishing na may suspicious links.",
      actionTagalog: "Huwag po munang mag-reply, mag-click, o magbigay ng kahit anong personal na impormasyon. I-delete na po natin ito para safe tayo."
    } : {
      isScam: false,
      confidence: Math.max(0.7, 1 - confidence), // Ensure high confidence for safe messages
      reasonTagalog: "Mukhang normal na mensahe po ito, Lolo at Lola. Walang nakikitang mga pattern ng mga kilalang scam sa Pilipinas.",
      actionTagalog: "Safe po ito. Pwede ninyong basahin at mag-reply kung gusto ninyo."
    };
    
    // Cache the fallback result too
    cacheService.storeScanResult(text, result);
    
    return result;
  }
};
