// Clear Service Worker Cache - Development Utility
(async function clearServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // Unregister all service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
        console.log('🧹 Service Worker unregistered:', registration.scope);
      }
      
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log('🧹 Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }
      
      console.log('✅ All service workers and caches cleared!');
      console.log('🔄 Please refresh the page to start fresh.');
      
    } catch (error) {
      console.error('❌ Error clearing service worker:', error);
    }
  }
})();