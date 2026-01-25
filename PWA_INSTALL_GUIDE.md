# 📱 How to Install Gabay Ligtas as a PWA

## Manual Installation Guide

Since the automatic install prompt has been removed to avoid issues, you can manually install Gabay Ligtas as a Progressive Web App using your browser's built-in installation feature.

### 🤖 Android Devices

#### Chrome:
1. Open Gabay Ligtas in Chrome
2. Tap the **menu (⋮)** in the top-right corner
3. Select **"Add to Home screen"** or **"Install app"**
4. Confirm the installation
5. The app will appear on your home screen

#### Samsung Internet:
1. Open the app in Samsung Internet
2. Tap the **menu** button
3. Select **"Add page to"** → **"Home screen"**
4. Confirm the installation

### 🍎 iOS Devices (Safari)

1. Open Gabay Ligtas in Safari
2. Tap the **Share button** (□ with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Edit the name if desired
5. Tap **"Add"**

**Note:** iOS has limited PWA support, but the app will still work offline and provide a native-like experience.

### 💻 Desktop Browsers

#### Chrome:
1. Open Gabay Ligtas in Chrome
2. Look for the **install icon (⊕)** in the address bar
3. Click it and select **"Install"**
4. Or go to Menu → **"Install Gabay Ligtas..."**

#### Microsoft Edge:
1. Open the app in Edge
2. Click the **install icon** in the address bar
3. Or go to Menu → **"Apps"** → **"Install this site as an app"**
4. Follow the installation prompts

#### Firefox:
1. Open the app in Firefox
2. Look for the **install prompt** (if available)
3. Or use the address bar install icon

### ✅ Verification

After installation, you should see:
- **Mobile**: App icon on your home screen
- **Desktop**: App in your applications/programs list
- **Behavior**: App opens in full-screen without browser UI
- **Offline**: App works without internet connection

### 🔧 Troubleshooting

**Install option not showing?**
- Make sure you're using HTTPS (https://)
- Try refreshing the page
- Check if your browser supports PWA installation
- Clear browser cache and try again

**App not working offline?**
- Make sure the service worker is registered (check browser console)
- Try visiting the app online first to cache resources
- Check your browser's PWA/service worker settings

### 🎯 Benefits of Installing

- **Faster Access**: Launch directly from home screen/desktop
- **Offline Mode**: Core features work without internet
- **Native Feel**: Full-screen experience
- **Auto Updates**: App updates automatically
- **Better Performance**: Cached resources load faster

### 🛠️ For Developers

If you need to test PWA features during development:

1. **Clear PWA Data**: Open browser console and run `clearPWA()`
2. **Check Service Worker**: DevTools → Application → Service Workers
3. **Test Offline**: DevTools → Network → Offline checkbox
4. **Audit PWA**: DevTools → Lighthouse → PWA audit

### 📞 Need Help?

If you encounter issues with installation:
1. Try a different browser (Chrome recommended)
2. Make sure you're on a secure connection (HTTPS)
3. Clear browser cache and cookies
4. Check browser console for error messages