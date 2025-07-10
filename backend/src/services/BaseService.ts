import { IService, HealthStatus } from '../interfaces/IService';
import { ILogger } from '../interfaces/ILogger';

export interface ServiceConfig {
    name: string;
    version: string;
    [key: string]: any;
}

/**
 * Abstract base class for all services
 */
export abstract class BaseService implements IService {
    protected logger: ILogger;
    protected config: ServiceConfig;

    constructor(config: ServiceConfig, logger: ILogger) {
        this.config = config;
        this.logger = logger;

        this.logger.info(`Initializing ${this.config.name} service`, {
            version: this.config.version
        });
    }

    /**
     * Initialize the service
     */
    public async initialize(): Promise<void> {
        this.logger.info(`${this.config.name} service initialized`);
    }

    /**
     * Check the health status of the service
     */
    public async healthCheck(): Promise<HealthStatus> {
        return {
            status: 'healthy',
            timestamp: Date.now()
        };
    }

    /**
     * Shut down the service
     */
    public async shutdown(): Promise<void> {
        this.logger.info(`${this.config.name} service shutting down`);
    }

    /**
     * Log service activity
     */
    protected logActivity(activity: string, metadata?: any): void {
        this.logger.info(`${this.config.name}: ${activity}`, metadata);
    }
} 