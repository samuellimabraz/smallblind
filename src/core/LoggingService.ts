import { ILogger } from '../interfaces/ILogger';
import { Request, Response } from '../interfaces/IController';

export interface LoggingConfig {
    level: 'debug' | 'info' | 'warn' | 'error';
    outputs: ('console' | 'file' | 'remote')[];
    filePath?: string;
    remoteUrl?: string;
    formatters?: {
        request?: (req: Request) => any;
        response?: (res: Response) => any;
        error?: (error: Error) => any;
    };
}

/**
 * Logging service for centralized logging
 */
export class LoggingService implements ILogger {
    private logger: ILogger;
    private config: LoggingConfig;

    constructor(config: LoggingConfig) {
        this.config = config;

        // Implementation would create actual logger instance based on config
        this.logger = {
            info: (message: string, metadata?: any) => console.log(message, metadata),
            error: (message: string, error?: Error, metadata?: any) => console.error(message, error, metadata),
            warn: (message: string, metadata?: any) => console.warn(message, metadata),
            debug: (message: string, metadata?: any) => console.debug(message, metadata)
        };
    }

    /**
     * Log an informational message
     * @param message Message to log
     * @param metadata Additional context metadata
     */
    public info(message: string, metadata?: any): void {
        this.logger.info(message, metadata);
    }

    /**
     * Log an error message
     * @param message Error message
     * @param error Error object
     * @param metadata Additional context metadata
     */
    public error(message: string, error?: Error, metadata?: any): void {
        this.logger.error(message, error, metadata);
    }

    /**
     * Log a warning message
     * @param message Warning message
     * @param metadata Additional context metadata
     */
    public warn(message: string, metadata?: any): void {
        this.logger.warn(message, metadata);
    }

    /**
     * Log a debug message
     * @param message Debug message
     * @param metadata Additional context metadata
     */
    public debug(message: string, metadata?: any): void {
        this.logger.debug(message, metadata);
    }

    /**
     * Log an HTTP request
     * @param req Request object
     * @param res Response object
     */
    public logRequest(req: Request, res: Response): void {
        const requestData = this.config.formatters?.request?.(req) || {
            method: req.headers['x-http-method'] || 'GET',
            path: req.headers['x-original-url'] || '/',
            query: req.query,
            user: req.user?.id || 'anonymous'
        };

        this.info('HTTP Request', requestData);
    }

    /**
     * Log an error with metadata
     * @param error Error object
     * @param metadata Additional context metadata
     */
    public logError(error: Error, metadata?: any): void {
        const errorData = this.config.formatters?.error?.(error) || {
            name: error.name,
            message: error.message,
            stack: error.stack
        };

        this.error('Error', error, { ...metadata, error: errorData });
    }

    /**
     * Log an activity with metadata
     * @param activity Activity description
     * @param metadata Additional context metadata
     */
    public logActivity(activity: string, metadata?: any): void {
        this.info(activity, metadata);
    }
} 