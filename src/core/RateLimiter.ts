import { ICacheProvider } from '../interfaces/ICacheProvider';

export interface RateLimitRule {
  name: string;
  maxRequests: number;
  timeWindow: number; // in seconds
  blockDuration?: number; // in seconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  blocked?: boolean;
  blockExpires?: number;
}

/**
 * Rate limiter for API request throttling
 */
export class RateLimiter {
  private rules: RateLimitRule[];
  private store: ICacheProvider;
  
  constructor(store: ICacheProvider, rules: RateLimitRule[]) {
    this.store = store;
    this.rules = rules;
  }
  
  /**
   * Check if a request is allowed by a rate limit rule
   * @param key Identifier for the rate limit (e.g., IP address, API key)
   * @param rule Name of the rule to check
   */
  public async check(key: string, rule: string): Promise<RateLimitResult> {
    // Implementation would check if the key has exceeded the rate limit
    return {
      allowed: true,
      remaining: 100,
      resetTime: Date.now() + 3600000
    };
  }
  
  /**
   * Increment the request count for a key and rule
   * @param key Identifier for the rate limit
   * @param rule Name of the rule
   */
  public async increment(key: string, rule: string): Promise<void> {
    // Implementation would increment the request count in the cache
  }
  
  /**
   * Reset the request count for a key and rule
   * @param key Identifier for the rate limit
   * @param rule Name of the rule
   */
  public async reset(key: string, rule: string): Promise<void> {
    // Implementation would reset the request count in the cache
  }
} 