# ElevenLabs TTS Setup Guide

## 🎤 Setting up ElevenLabs for Filipino/Tagalog TTS

### Step 1: Get Your API Key
1. Go to [ElevenLabs.io](https://elevenlabs.io)
2. Sign in to your account
3. Navigate to **Settings** → **API Keys**
4. Copy your API key

### Step 2: Add API Key to Environment
1. Open your `.env.local` file
2. Add your ElevenLabs API key:
```env
ELEVENLABS_API_KEY=your_actual_api_key_here
```

### Step 3: Choose Filipino Voices
The app is pre-configured with these voices that work well for Filipino:

**Recommended Voices:**
- **Bella** (Default) - Warm female voice, excellent for Filipino
- **Adam** - Clear male voice, good pronunciation
- **Rachel** - Professional female voice

**To use different voices:**
1. Go to [ElevenLabs Voice Library](https://elevenlabs.io/voice-library)
2. Find voices that support Filipino/Tagalog
3. Copy the Voice ID
4. Update `FILIPINO_VOICES` in `services/elevenLabsService.ts`

### Step 4: Test the Integration
1. Start your development server: `npm run dev`
2. Open browser console
3. Click the **"TEST VOICE"** button in the app
4. Or run `testVoices()` in the console

### Step 5: Monitor Usage (Free Tier)
ElevenLabs free tier includes:
- **10,000 characters per month**
- **3 custom voices**
- **High-quality TTS**

**To check usage:**
```javascript
// In browser console
const elevenLabs = getElevenLabsService();
elevenLabs.getUsage().then(usage => console.log(usage));
```

## 🔧 Configuration Options

### Voice Settings
You can customize voice parameters in `services/geminiService.ts`:

```typescript
const audioBuffer = await elevenLabs.generateSpeech(
  filipinoText,
  FILIPINO_VOICES[1].voice_id, // Voice selection
  {
    stability: 0.6,        // 0-1: Higher = more stable
    similarity_boost: 0.8, // 0-1: Higher = more similar to original
    style: 0.1,           // 0-1: Higher = more expressive
    use_speaker_boost: true // Enhance clarity
  }
);
```

### Model Selection
The app uses `eleven_multilingual_v2` which supports:
- ✅ Filipino/Tagalog
- ✅ English
- ✅ Multiple other languages

## 🎯 TTS Priority Order

1. **ElevenLabs TTS** (Primary) - High-quality Filipino voices
2. **Gemini TTS** (Fallback) - If ElevenLabs fails
3. **Browser Speech** (Last resort) - If both APIs fail

## 🐛 Troubleshooting

### Common Issues:

**"ElevenLabs service not available"**
- Check if `ELEVENLABS_API_KEY` is set in `.env.local`
- Verify the API key is correct

**"API error: 401"**
- Invalid API key
- Check your ElevenLabs account status

**"API error: 429"**
- Rate limit exceeded
- Wait a few minutes or upgrade your plan

**"API error: 400"**
- Text too long (max ~5000 characters)
- Invalid voice ID

### Debug Commands:
```javascript
// Test ElevenLabs service
testVoices()

// Check if service is available
getElevenLabsService()

// Manual TTS test
const service = getElevenLabsService();
service.generateSpeech("Kumusta po kayo").then(audio => console.log("Success!"));
```

## 📊 Free Tier Optimization

To maximize your free tier usage:

1. **Cache audio** - The app automatically caches TTS results
2. **Short messages** - Keep TTS text concise
3. **Fallback system** - Uses browser speech when quota exceeded
4. **Monitor usage** - Check remaining characters regularly

## 🎵 Voice Quality Tips

For best Filipino TTS quality:
1. Use **Bella** voice (pre-configured default)
2. Set **stability: 0.6-0.8** for clear speech
3. Set **similarity_boost: 0.8** for natural sound
4. Add Filipino context: "Mga Lolo at Lola, [your message]"
5. Use proper Filipino punctuation and phrasing

## 🚀 Production Deployment

For production (Vercel, Netlify, etc.):
1. Add `ELEVENLABS_API_KEY` to your deployment environment variables
2. The app will automatically use ElevenLabs when available
3. Falls back gracefully if API key is missing

---

**Need help?** Check the browser console for detailed TTS logs and error messages.