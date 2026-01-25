// Cache Service for storing user data and API responses
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn?: number; // milliseconds
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes

  // Set item in cache with optional expiry
  set<T>(key: string, data: T, expiresIn?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresIn: expiresIn || this.DEFAULT_EXPIRY
    };
    
    this.cache.set(key, item);
    
    // Also store in localStorage for persistence
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to store in localStorage:', error);
    }
  }

  // Get item from cache
  get<T>(key: string): T | null {
    let item = this.cache.get(key);
    
    // If not in memory, try localStorage
    if (!item) {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          item = JSON.parse(stored);
          if (item) {
            this.cache.set(key, item);
          }
        }
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
      }
    }

    if (!item) return null;

    // Check if expired
    const now = Date.now();
    const age = now - item.timestamp;
    
    if (item.expiresIn && age > item.expiresIn) {
      this.delete(key);
      return null;
    }

    return item.data;
  }

  // Delete item from cache
  delete(key: string): void {
    this.cache.delete(key);
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Cache API responses with automatic retry logic
  async cacheApiCall<T>(
    key: string,
    apiCall: () => Promise<T>,
    expiresIn?: number,
    forceRefresh = false
  ): Promise<T> {
    // Return cached data if available and not forcing refresh
    if (!forceRefresh) {
      const cached = this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    try {
      const data = await apiCall();
      this.set(key, data, expiresIn);
      return data;
    } catch (error) {
      // If API call fails, return cached data if available
      const cached = this.get<T>(key);
      if (cached !== null) {
        console.warn(`API call failed, returning cached data for ${key}:`, error);
        return cached;
      }
      throw error;
    }
  }

  // Store user preferences and settings
  setUserPreference(key: string, value: any): void {
    this.set(`user_pref_${key}`, value, 30 * 24 * 60 * 60 * 1000); // 30 days
  }

  getUserPreference<T>(key: string, defaultValue?: T): T | null {
    const value = this.get<T>(`user_pref_${key}`);
    return value !== null ? value : (defaultValue || null);
  }

  // Store scan results temporarily
  storeScanResult(content: string, result: any): void {
    const hash = this.hashString(content);
    this.set(`scan_${hash}`, result, 60 * 60 * 1000); // 1 hour
  }

  getScanResult(content: string): any | null {
    const hash = this.hashString(content);
    return this.get(`scan_${hash}`);
  }

  // Simple hash function for content
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

export const cacheService = new CacheService();