# Gabay Ligtas: Senior Cyber Guardian

A Progressive Web App (PWA) designed to help Filipino seniors stay safe online through cybersecurity awareness, scam detection, and emergency assistance.

## 🚀 Features

- **Scam Scanner**: AI-powered detection of suspicious messages, emails, and links
- **Cybersecurity Education**: Interactive learning modules tailored for seniors
- **Emergency Help**: Quick access to support and reporting mechanisms
- **PWA Support**: Install as a native app on any device
- **Offline Functionality**: Core features work without internet connection
- **Senior-Friendly Design**: Large text, simple navigation, and clear visual cues

## 📱 PWA Features

This app is a fully-featured Progressive Web App that provides:

- **Installable**: Can be installed on mobile devices and desktops
- **Offline Support**: Works without internet connection for core features
- **Auto-Updates**: Automatically updates when new versions are available
- **Native Feel**: Behaves like a native mobile app when installed
- **Push Notifications**: (Future feature) Security alerts and reminders

### Installing the App

#### Manual Installation (Recommended):

**On Mobile (Android/iOS):**
1. Open the app in your browser
2. Use browser menu → "Add to Home Screen" or "Install App"
3. Follow the browser's installation prompts

**On Desktop:**
1. Open the app in Chrome, Edge, or Firefox
2. Look for the install icon in the address bar (⊕ or download icon)
3. Click it and select "Install"
4. The app will be added to your applications

**Alternative Methods:**
- Chrome: Menu → "Install Gabay Ligtas..."
- Edge: Menu → "Apps" → "Install this site as an app"
- Firefox: Menu → "Install" (if available)

## 🛠️ Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🔧 PWA Configuration

The PWA is configured with:
- **Service Worker**: Handles caching and offline functionality
- **Web App Manifest**: Defines app metadata and installation behavior
- **Workbox**: Manages caching strategies and service worker lifecycle
- **Auto-Update**: Prompts users when new versions are available

### Key PWA Files:
- `public/manifest.json` - Web app manifest
- `vite.config.ts` - PWA plugin configuration
- `components/PWAUpdateNotification.tsx` - Update notification component
- `components/PWAStatus.tsx` - Status indicator component
- `services/pwaService.ts` - PWA service management

## 🎨 Design Principles

- **Accessibility First**: Large fonts, high contrast, simple navigation
- **Senior-Friendly**: Intuitive interface designed for older adults
- **Mobile-First**: Optimized for smartphone usage
- **Offline-Ready**: Core functionality available without internet

## 🔒 Security Features

- **AI-Powered Scam Detection**: Uses Google's Gemini AI for content analysis
- **Privacy-Focused**: No personal data stored or transmitted unnecessarily
- **Secure Communication**: All API calls use HTTPS
- **Local Processing**: Sensitive analysis done client-side when possible

## 📦 Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **PWA**: vite-plugin-pwa with Workbox
- **Styling**: Tailwind CSS
- **AI Integration**: Google Gemini API
- **Icons**: Font Awesome

## 🌐 Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   - Copy `.env.local.example` to `.env.local`
   - Add your Gemini API key to `GEMINI_API_KEY`

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support or questions, please contact the development team.