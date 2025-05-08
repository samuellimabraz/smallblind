/**
 * Interface for logging services in the SmallBlind system
 */
export interface ILogger {
  /**
   * Log informational message
   * @param message Message to log
   * @param metadata Additional context metadata
   */
  info(message: string, metadata?: any): void;
  
  /**
   * Log error message
   * @param message Error message
   * @param error Error object
   * @param metadata Additional context metadata
   */
  error(message: string, error?: Error, metadata?: any): void;
  
  /**
   * Log warning message
   * @param message Warning message
   * @param metadata Additional context metadata
   */
  warn(message: string, metadata?: any): void;
  
  /**
   * Log debug message
   * @param message Debug message
   * @param metadata Additional context metadata
   */
  debug(message: string, metadata?: any): void;
} 