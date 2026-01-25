# 🚀 Vercel Environment Variables Setup

## Current Status
Based on your logs, you're deploying to Vercel but the API keys are missing or empty.

## Steps to Fix:

### 1. Go to Vercel Dashboard
1. Visit [vercel.com](https://vercel.com)
2. Go to your project dashboard
3. Click on your "Gabay Ligtas" project

### 2. Add Environment Variables
1. Go to **Settings** tab
2. Click **Environment Variables** in the sidebar
3. Add these variables:

**Variable 1:**
- Name: `GEMINI_API_KEY`
- Value: `your_actual_gemini_api_key_here`
- Environment: Production, Preview, Development (check all)

**Variable 2:**
- Name: `VITE_ELEVENLABS_API_KEY`  
- Value: `your_actual_elevenlabs_api_key_here`
- Environment: Production, Preview, Development (check all)

### 3. Redeploy
After adding the environment variables:
1. Go to **Deployments** tab
2. Click the **...** menu on your latest deployment
3. Click **Redeploy**

OR just push a new commit to trigger automatic deployment.

## ⚠️ Important Notes:

- **VITE_ELEVENLABS_API_KEY** must have the `VITE_` prefix
- **GEMINI_API_KEY** does NOT need the `VITE_` prefix
- Make sure there are no extra spaces in the values
- The values should be the actual API keys, not placeholder text

## 🔍 How to Get Your API Keys:

### Gemini API Key:
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in and create a new API key
3. Copy the key (starts with `AIza...`)

### ElevenLabs API Key:
1. Go to [ElevenLabs Settings](https://elevenlabs.io/app/settings/api-keys)
2. Sign in and copy your API key
3. Copy the key (long alphanumeric string)

## ✅ Verification:
After redeployment, check the browser console. You should see:
- `✅ ElevenLabs API key found, initializing service`
- No more "API key not found" warnings