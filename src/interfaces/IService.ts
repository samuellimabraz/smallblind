/**
 * Interface for service components in the SmallBlind system
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details?: Record<string, any>;
  timestamp: number;
}

export interface IService {
  /**
   * Initialize the service
   */
  initialize(): Promise<void>;
  
  /**
   * Check the health status of the service
   */
  healthCheck(): Promise<HealthStatus>;
  
  /**
   * Gracefully shut down the service
   */
  shutdown(): Promise<void>;
} 