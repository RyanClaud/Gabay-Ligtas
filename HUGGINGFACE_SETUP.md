# 🤗 Hugging Face TTS Setup Guide

## ⚠️ Important Note: CORS Limitation

Hugging Face's Inference API has CORS restrictions that prevent direct browser access. This means:
- **Hugging Face TTS currently works as a fallback** in production environments with a proxy
- **ElevenLabs is the primary TTS** for browser-based applications
- To use Hugging Face TTS, you would need to set up a backend proxy server

## Overview
Hugging Face provides free, open-source TTS models that support Tagalog/Filipino. The best part? **No API key required for public models!**

## ✅ Advantages of Hugging Face TTS

1. **Free**: No API key required for public models
2. **Tagalog Support**: Facebook's MMS TTS model supports Tagalog natively
3. **No Quota Limits**: Unlike other services, no strict rate limits
4. **Open Source**: Transparent and community-driven
5. **Privacy**: Can be self-hosted if needed

## 🎤 Supported Models

### Primary Model (Default)
- **facebook/mms-tts-tgl**: Meta's Massively Multilingual Speech (MMS) TTS for Tagalog
  - Native Tagalog support
  - High quality
  - Fast inference

### Alternative Models
- **microsoft/speecht5_tts**: Multilingual TTS
- **suno/bark**: Natural-sounding multilingual TTS
- **facebook/mms-tts-tgl-script_latin**: Tagalog with Latin script

## 🚀 Quick Start

### Option 1: No API Key (Recommended)
The app works out of the box with Hugging Face's public inference API. No setup required!

### Option 2: With API Key (Optional - for faster inference)
If you want faster inference and higher rate limits:

1. **Create a Hugging Face Account**
   - Go to [huggingface.co](https://huggingface.co)
   - Sign up for a free account

2. **Generate an API Token**
   - Go to [Settings > Access Tokens](https://huggingface.co/settings/tokens)
   - Click "New token"
   - Give it a name (e.g., "Gabay Ligtas TTS")
   - Select "Read" permission
   - Click "Generate"
   - Copy the token

3. **Add to Environment Variables**
   - Add to `.env.local`:
     ```
     VITE_HUGGINGFACE_API_KEY=your_token_here
     ```
   - Or add to Vercel environment variables

## 🔧 How It Works

The app now uses this TTS priority:

1. **ElevenLabs TTS** (Primary) - High quality, works in browser, requires API key
2. **Hugging Face TTS** (Fallback - Production only) - Free, Tagalog support, needs proxy
3. **Gemini TTS** (Fallback) - Google's TTS, requires API key
4. **Browser Speech Synthesis** (Final fallback) - Built-in browser TTS

**Note**: Due to CORS restrictions, Hugging Face TTS is currently disabled in development and only attempts in production environments where a proxy might be configured.

## 📊 Comparison

| Service | Cost | Tagalog Support | API Key Required | Quality |
|---------|------|-----------------|------------------|---------|
| Hugging Face | Free | ✅ Native | ❌ No | Good |
| ElevenLabs | Paid | ⚠️ Multilingual | ✅ Yes | Excellent |
| Gemini TTS | Paid | ⚠️ Multilingual | ✅ Yes | Good |
| Browser | Free | ⚠️ Limited | ❌ No | Variable |

## 🎯 Best Practices

1. **No API Key Needed**: For most users, Hugging Face works great without an API key
2. **Model Loading**: First request may take 10-20 seconds as the model loads
3. **Caching**: Audio is cached locally, so subsequent plays are instant
4. **Fallback**: If Hugging Face is slow, it automatically falls back to other services

## 🐛 Troubleshooting

### Model Loading Slowly
- **Issue**: First request takes 10-20 seconds
- **Solution**: This is normal. The model needs to load. Subsequent requests are fast.

### 503 Service Unavailable
- **Issue**: Model is loading or temporarily unavailable
- **Solution**: The app automatically retries or falls back to ElevenLabs/Gemini

### Audio Quality Issues
- **Issue**: Audio sounds robotic or unclear
- **Solution**: Try adding an API key for priority access to better inference

## 🔐 Privacy & Security

- **No Data Collection**: Hugging Face doesn't store your TTS requests
- **Open Source**: All models are open source and auditable
- **Self-Hostable**: Can run models locally if needed

## 📚 Resources

- [Hugging Face TTS Documentation](https://huggingface.co/docs/api-inference/detailed_parameters#text-to-speech-task)
- [MMS TTS Model Card](https://huggingface.co/facebook/mms-tts-tgl)
- [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index)

## 💡 Tips

1. **Shorter Text**: Shorter text generates faster
2. **Caching**: Audio is cached, so repeated phrases are instant
3. **Offline Mode**: Falls back to browser TTS when offline
4. **No Quota Worries**: Unlike paid services, no need to worry about running out of credits
