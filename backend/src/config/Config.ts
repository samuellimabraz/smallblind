import path from 'path';
import fs from 'fs';

/**
 * MongoDB database connection configuration
 */
export interface DatabaseConfig {
    uri: string;
    options: {
        useNewUrlParser: boolean;
        useUnifiedTopology: boolean;
        connectTimeoutMS: number;
        socketTimeoutMS: number;
    };
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
    jwtSecret: string;
    tokenExpiration: string;
    refreshTokenExpiration: string;
    maxLoginAttempts: number;
    passwordMinLength: number;
}

/**
 * API configuration
 */
export interface ApiConfig {
    port: number;
    baseUrl: string;
    rateLimit: {
        windowMs: number;
        max: number;
    };
    timeout: number;
}

/**
 * Model manager configuration
 */
export interface ModelManagerConfig {
    maxLoaded: number;
    preloadModels: string[];
    cacheTTL: number;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
    level: string;
    format: string;
    enableConsole: boolean;
    enableFile: boolean;
    filePath: string;
}

/**
 * Main configuration class - Singleton
 */
export class Config {
    private static instance: Config;

    // Environment
    public readonly environment: string;

    // Base paths
    public readonly rootPath: string;
    public readonly modelBasePath: string;
    public readonly storagePath: string;

    // Configuration sections
    public readonly database: DatabaseConfig;
    public readonly auth: AuthConfig;
    public readonly api: ApiConfig;
    public readonly modelManager: ModelManagerConfig;
    public readonly logging: LoggingConfig;

    /**
     * Get singleton instance
     */
    public static getInstance(): Config {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }

    /**
     * Private constructor
     */
    private constructor() {
        // Set environment
        this.environment = process.env.NODE_ENV || 'development';

        // Set base paths
        this.rootPath = path.resolve(__dirname, '../../');
        this.modelBasePath = process.env.MODEL_BASE_PATH || path.join(this.rootPath, 'models');
        this.storagePath = process.env.STORAGE_PATH || path.join(this.rootPath, 'storage');

        // Ensure storage directory exists
        if (!fs.existsSync(this.storagePath)) {
            fs.mkdirSync(this.storagePath, { recursive: true });
        }

        // Set database configuration
        this.database = {
            uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/smallblind',
            options: {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                connectTimeoutMS: 10000,
                socketTimeoutMS: 45000
            }
        };

        // Set authentication configuration
        this.auth = {
            jwtSecret: process.env.JWT_SECRET || 'smallblind-secret-key-change-in-production',
            tokenExpiration: process.env.TOKEN_EXPIRATION || '1h',
            refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
            maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
            passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10)
        };

        // Set API configuration
        this.api = {
            port: parseInt(process.env.PORT || '3000', 10),
            baseUrl: process.env.BASE_URL || '/api/v1',
            rateLimit: {
                windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
                max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10) // 100 requests per windowMs
            },
            timeout: parseInt(process.env.API_TIMEOUT || '30000', 10) // 30 seconds
        };

        // Set model manager configuration
        this.modelManager = {
            maxLoaded: parseInt(process.env.MAX_LOADED_MODELS || '10', 10),
            preloadModels: (process.env.PRELOAD_MODELS || 'text-to-speech,speech-to-text,object-detection').split(','),
            cacheTTL: parseInt(process.env.MODEL_CACHE_TTL || '3600000', 10) // 1 hour
        };

        // Set logging configuration
        this.logging = {
            level: process.env.LOG_LEVEL || (this.environment === 'production' ? 'info' : 'debug'),
            format: process.env.LOG_FORMAT || 'json',
            enableConsole: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
            enableFile: process.env.ENABLE_FILE_LOGGING === 'true',
            filePath: process.env.LOG_FILE_PATH || path.join(this.rootPath, 'logs/smallblind.log')
        };
    }

    /**
     * Get a configuration value by key path
     * @param keyPath Key path (e.g., 'database.uri')
     * @param defaultValue Default value if not found
     */
    public get<T>(keyPath: string, defaultValue?: T): T {
        const keys = keyPath.split('.');
        let value: any = this;

        for (const key of keys) {
            if (value === undefined || value === null) {
                return defaultValue as T;
            }
            value = value[key];
        }

        return (value === undefined) ? defaultValue as T : value as T;
    }

    /**
     * Check if we're running in production
     */
    public isProduction(): boolean {
        return this.environment === 'production';
    }

    /**
     * Check if we're running in development
     */
    public isDevelopment(): boolean {
        return this.environment === 'development';
    }

    /**
     * Check if we're running in test mode
     */
    public isTest(): boolean {
        return this.environment === 'test';
    }
} 