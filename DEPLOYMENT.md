# Gabay Ligtas PWA Deployment Guide

## 🚀 Quick Deployment

### Prerequisites
- Node.js 18+
- A web server that supports HTTPS (required for PWA)
- Your Gemini API key

### Build for Production

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.local.example` to `.env.local`
   - Add your Gemini API key: `GEMINI_API_KEY=your_api_key_here`

3. **Build the app:**
   ```bash
   npm run build
   ```

4. **Test the build locally:**
   ```bash
   npm run preview
   ```

## 📦 Deployment Options

### Option 1: Static Hosting (Recommended)

Deploy the `dist/` folder to any static hosting service:

- **Netlify**: Drag and drop the `dist` folder
- **Vercel**: Connect your GitHub repo and deploy
- **GitHub Pages**: Upload `dist` contents to your repo
- **Firebase Hosting**: Use `firebase deploy`

### Option 2: Traditional Web Server

Upload the `dist/` folder contents to your web server root directory.

**Important**: Ensure your server:
- Serves files over HTTPS (required for PWA features)
- Has proper MIME types configured
- Serves `manifest.json` with `application/manifest+json` MIME type

## 🔧 Server Configuration

### Apache (.htaccess)
```apache
# Enable HTTPS redirect
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Set proper MIME types
AddType application/manifest+json .json
AddType application/javascript .js

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
```

### Nginx
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    # SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    root /path/to/dist;
    index index.html;
    
    # Proper MIME types
    location ~* \.json$ {
        add_header Content-Type application/manifest+json;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Fallback to index.html for SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 🔍 Testing PWA Features

After deployment, test these features:

1. **Installation**: Visit your site and look for install prompts
2. **Offline Mode**: Disconnect internet and verify core features work
3. **Updates**: Deploy a new version and check update notifications
4. **Manifest**: Use Chrome DevTools > Application > Manifest
5. **Service Worker**: Check Application > Service Workers in DevTools

## 📱 Mobile Testing

Test on actual devices:
- **Android**: Chrome, Samsung Internet, Firefox
- **iOS**: Safari (limited PWA support)
- **Desktop**: Chrome, Edge, Firefox

## 🛠️ Troubleshooting

### Common Issues:

1. **Install prompt not showing**:
   - Ensure HTTPS is enabled
   - Check manifest.json is accessible
   - Verify service worker is registered

2. **Service worker not updating**:
   - Clear browser cache
   - Check for console errors
   - Verify service worker scope

3. **Offline mode not working**:
   - Check service worker registration
   - Verify cache strategies in DevTools
   - Test network throttling

### Debug Tools:
- Chrome DevTools > Application tab
- Lighthouse PWA audit
- PWA Builder validation

## 🔐 Security Considerations

- Always use HTTPS in production
- Keep API keys secure (use environment variables)
- Regularly update dependencies
- Monitor for security vulnerabilities

## 📊 Performance Optimization

- Enable gzip compression on server
- Use CDN for static assets
- Monitor Core Web Vitals
- Optimize images and icons

## 🚀 Continuous Deployment

Set up automatic deployment with GitHub Actions:

```yaml
name: Deploy PWA
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - name: Deploy to hosting
        # Add your deployment step here
```

## 📞 Support

For deployment issues or questions, check:
- Browser console for errors
- Network tab for failed requests
- Service worker logs
- Manifest validation tools