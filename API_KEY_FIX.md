# 🔧 API Key Fix Guide

## ⚠️ URGENT: Your Gemini API Key is Compromised

Your current Gemini API key has been reported as leaked and needs to be replaced immediately.

## Steps to Fix:

### 1. Generate New Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the new API key

### 2. Update Your Environment File
1. Open `.env.local` in your project
2. Replace `YOUR_NEW_GEMINI_API_KEY_HERE` with your new API key:
   ```
   GEMINI_API_KEY=your_actual_new_api_key_here
   ```

### 3. Restart Your Development Server
```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

## ✅ Fixed Issues:

1. **ArrayBuffer Error**: Fixed the "detached ArrayBuffer" issue in ElevenLabs TTS
2. **API Key Configuration**: Standardized to use `GEMINI_API_KEY` consistently
3. **Error Handling**: Added better error handling for audio decoding
4. **Tailwind Warning**: This is just a development warning - your production build will be fine

## 🔒 Security Tips:

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Regularly rotate your API keys
- Monitor your API usage for unusual activity

## 🎯 Next Steps:

After updating your API key, your app should work properly with:
- ✅ ElevenLabs TTS working without ArrayBuffer errors
- ✅ Gemini TTS fallback working properly
- ✅ Better error handling and logging