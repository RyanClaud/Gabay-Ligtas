// PWA Service Worker Registration and Update Management

export interface PWAUpdateInfo {
  updateAvailable: boolean;
  registration?: ServiceWorkerRegistration;
}

class PWAService {
  private updateCallback?: (info: PWAUpdateInfo) => void;
  private isDevelopment = import.meta.env.DEV;

  // Register service worker and handle updates
  async register(onUpdate?: (info: PWAUpdateInfo) => void): Promise<void> {
    // Skip service worker registration in development mode
    if (this.isDevelopment) {
      console.log('🛠️ PWA: Development mode - Service Worker disabled');
      
      // Clear any existing service workers in development
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
          console.log('🧹 PWA: Unregistered existing service worker');
        }
      }
      
      return;
    }

    if ('serviceWorker' in navigator) {
      this.updateCallback = onUpdate;
      
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('🛡️ PWA: Service Worker registered successfully');

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                this.updateCallback?.({
                  updateAvailable: true,
                  registration
                });
              }
            });
          }
        });

        // Handle controller change (when new SW takes over)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });

      } catch (error) {
        console.error('❌ PWA: Service Worker registration failed:', error);
      }
    }
  }

  // Skip waiting and activate new service worker
  async skipWaiting(registration?: ServiceWorkerRegistration): Promise<void> {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // Check if app is running in standalone mode
  isStandalone(): boolean {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    return isStandalone || isInWebAppiOS;
  }

  // Check if app can be installed (for informational purposes only)
  canInstall(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && !this.isDevelopment;
  }

  // Get app installation status (for informational purposes only)
  getInstallationStatus(): {
    canInstall: boolean;
    isInstalled: boolean;
    isSupported: boolean;
  } {
    const isSupported = 'serviceWorker' in navigator;
    const isInstalled = this.isStandalone();
    const canInstall = isSupported && !isInstalled && !this.isDevelopment;

    return {
      canInstall,
      isInstalled,
      isSupported
    };
  }

  // Clear all PWA data (development utility)
  async clearAll(): Promise<void> {
    if (this.isDevelopment) {
      try {
        // Unregister service workers
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (let registration of registrations) {
            await registration.unregister();
          }
        }
        
        // Clear caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        
        // Clear localStorage
        localStorage.clear();
        sessionStorage.clear();
        
        console.log('🧹 PWA: All data cleared');
      } catch (error) {
        console.error('❌ PWA: Error clearing data:', error);
      }
    }
  }
}

export const pwaService = new PWAService();

// Auto-register service worker when module is imported (only in production)
if (typeof window !== 'undefined') {
  pwaService.register();
  
  // In development, expose clear function globally
  if (import.meta.env.DEV) {
    (window as any).clearPWA = () => pwaService.clearAll();
    console.log('🛠️ PWA: Development mode - Use clearPWA() to clear all data');
  }
}