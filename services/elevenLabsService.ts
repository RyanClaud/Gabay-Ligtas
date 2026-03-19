// ElevenLabs TTS Service for Filipino/Tagalog Voice
export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
}

// Popular Filipino/Tagalog voices on ElevenLabs (you can customize these)
export const FILIPINO_VOICES: ElevenLabsVoice[] = [
  {
    voice_id: "pNInz6obpgDQGcFmaJgB", // Adam - clear male voice
    name: "Adam",
    category: "premade",
    description: "Clear male voice, good for Filipino"
  },
  {
    voice_id: "EXAVITQu4vr4xnSDxMaL", // Bella - warm female voice
    name: "Bella", 
    category: "premade",
    description: "Warm female voice, good for Filipino"
  },
  {
    voice_id: "21m00Tcm4TlvDq8ikWAM", // Rachel - professional female
    name: "Rachel",
    category: "premade", 
    description: "Professional female voice"
  }
];

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get available voices from ElevenLabs
   */
  async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: { 'xi-api-key': this.apiKey },
      });
      if (!response.ok) throw new Error(`ElevenLabs API error: ${response.status}`);
      const data = await response.json();
      return data.voices || [];
    } catch {
      return FILIPINO_VOICES;
    }
  }

  /**
   * Generate speech using ElevenLabs TTS
   */
  async generateSpeech(
    text: string, 
    voiceId: string = FILIPINO_VOICES[1].voice_id,
    options: {
      stability?: number;
      similarity_boost?: number;
      style?: number;
      use_speaker_boost?: boolean;
    } = {}
  ): Promise<ArrayBuffer> {
    const {
      stability = 0.5,
      similarity_boost = 0.75,
      style = 0.0,
      use_speaker_boost = true
    } = options;

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability, similarity_boost, style, use_speaker_boost }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs TTS error: ${response.status} - ${errorText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check API quota/usage
   */
  async getUsage(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: { 'xi-api-key': this.apiKey },
      });
      if (!response.ok) throw new Error(`ElevenLabs API error: ${response.status}`);
      return await response.json();
    } catch {
      return null;
    }
  }
}

// Create singleton instance
let elevenLabsService: ElevenLabsService | null = null;

export const getElevenLabsService = (): ElevenLabsService | null => {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY ||
                 (process.env as any).VITE_ELEVENLABS_API_KEY ||
                 (process.env as any).ELEVENLABS_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'undefined' || apiKey === 'your_elevenlabs_api_key_here') {
    return null;
  }

  if (!elevenLabsService) {
    elevenLabsService = new ElevenLabsService(apiKey);
  }

  return elevenLabsService;
};