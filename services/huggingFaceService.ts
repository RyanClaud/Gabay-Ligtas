// Hugging Face TTS Service for Filipino/Tagalog Voice
export interface HuggingFaceConfig {
  model: string;
  apiKey?: string;
}

// Popular TTS models on Hugging Face
export const TTS_MODELS = {
  // Facebook's MMS TTS supports 1000+ languages including Tagalog
  MMS_TTS: 'facebook/mms-tts-tgl', // Tagalog
  
  // Alternative multilingual models
  SPEECHT5: 'microsoft/speecht5_tts',
  BARK: 'suno/bark',
  
  // Fast and lightweight
  VITS: 'facebook/mms-tts-tgl-script_latin',
};

export class HuggingFaceService {
  private apiKey: string | null;
  private baseUrl = 'https://api-inference.huggingface.co/models';
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
  }

  /**
   * Generate speech using Hugging Face TTS
   * @param text Text to convert to speech
   * @param model Model to use (default: facebook/mms-tts-tgl for Tagalog)
   */
  async generateSpeech(
    text: string,
    model: string = TTS_MODELS.MMS_TTS
  ): Promise<ArrayBuffer> {
    console.log('🎤 Generating Hugging Face TTS for:', text.substring(0, 50) + '...');
    console.log('🎤 Using model:', model);

    // Use our proxy endpoint to bypass CORS
    const proxyUrl = '/api/tts';
    
    try {
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Hugging Face TTS error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      console.log('✅ Hugging Face TTS successful');
      return await response.arrayBuffer();
    } catch (error) {
      console.error('❌ Hugging Face TTS failed:', error);
      throw error;
    }
  }

  /**
   * Check if a model is available
   */
  async checkModelStatus(model: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${model}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          inputs: 'test',
        }),
      });

      return response.ok || response.status === 503; // 503 means model is loading
    } catch (error) {
      console.error('❌ Failed to check model status:', error);
      return false;
    }
  }
}

// Create singleton instance
let huggingFaceService: HuggingFaceService | null = null;

export const getHuggingFaceService = (): HuggingFaceService => {
  // API key is optional for Hugging Face public models
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY || 
                 process.env.VITE_HUGGINGFACE_API_KEY || 
                 process.env.HUGGINGFACE_API_KEY;
  
  if (import.meta.env.DEV) {
    if (apiKey) {
      console.log('✅ Hugging Face API key found (optional)');
    } else {
      console.log('ℹ️ Hugging Face API key not found (using public access)');
    }
  }
  
  if (!huggingFaceService) {
    huggingFaceService = new HuggingFaceService(apiKey);
  }

  return huggingFaceService;
};
