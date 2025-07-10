/**
 * Interface for cache providers in the SmallBlind system
 */
export interface ICacheProvider {
  /**
   * Get a value from the cache
   * @param key Cache key
   */
  get(key: string): Promise<any>;
  
  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param expiration Expiration time in seconds
   */
  set(key: string, value: any, expiration?: number): Promise<boolean>;
  
  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  delete(key: string): Promise<boolean>;
  
  /**
   * Check if a key exists in the cache
   * @param key Cache key
   */
  exists(key: string): Promise<boolean>;
} 