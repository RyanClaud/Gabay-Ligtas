// Vercel Serverless Function to proxy Hugging Face TTS requests
// This bypasses CORS restrictions

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, model = 'facebook/mms-tts-tgl' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log('🎤 Proxying TTS request to Hugging Face:', text.substring(0, 50));

    // Get API key from environment (optional)
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Make request to Hugging Face
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputs: text,
          options: {
            wait_for_model: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Hugging Face API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Hugging Face API error: ${response.status}`,
        details: errorText 
      });
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    
    console.log('✅ TTS generated successfully, size:', audioBuffer.byteLength);

    // Set appropriate headers
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength.toString());
    
    // Send the audio data
    return res.send(Buffer.from(audioBuffer));

  } catch (error: any) {
    console.error('❌ TTS proxy error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
