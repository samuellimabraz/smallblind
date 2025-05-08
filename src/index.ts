import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ApiGateway } from './api/ApiGateway';
import { MongoDBConnector } from './core/MongoDBConnector';
import { ModelManager } from './core/ModelManager';
import { ConsoleLogger } from './utils/ConsoleLogger';
import { VisionService } from './services/VisionService';
import { SpeechService } from './services/SpeechService';
import { NLPService } from './services/NLPService';
import { OCRService } from './services/OCRService';
import { FaceRecognitionService } from './services/FaceRecognitionService';
import { AuthManager } from './auth/AuthManager';
import { WebSocketManager } from './api/WebSocketManager';
import { Config } from './config/Config';
import { ServiceConfig } from './services/BaseService';

async function bootstrap() {
    // Initialize logger
    const logger = new ConsoleLogger();
    logger.info('Initializing SmallBlind backend...');

    try {
        // Load configuration
        const config = Config.getInstance();
        logger.info('Configuration loaded', {
            environment: config.environment,
            modelPath: config.modelBasePath
        });

        // Initialize database connection
        const dbConnector = new MongoDBConnector({
            uri: config.database.uri,
            options: config.database.options
        }, logger);

        await dbConnector.connect();
        logger.info('Database connection established');

        // Initialize model manager
        const modelManager = new ModelManager({
            basePath: config.modelBasePath,
            maxModels: config.modelManager.maxLoaded
        }, logger);

        await modelManager.initialize();
        logger.info('Model manager initialized');

        // Initialize authentication manager
        const authManager = new AuthManager({
            jwtSecret: config.auth.jwtSecret,
            tokenExpiration: config.auth.tokenExpiration
        }, logger, dbConnector);

        await authManager.initialize();
        logger.info('Authentication manager initialized');

        // Create service configuration
        const serviceConfig: ServiceConfig = {
            id: 'default',
            enabled: true,
            maxQueueSize: 100
        };

        // Initialize services
        const visionService = new VisionService(serviceConfig, logger, modelManager);
        await visionService.initialize();
        logger.info('Vision service initialized');

        const speechService = new SpeechService(serviceConfig, logger, modelManager);
        await speechService.initialize();
        logger.info('Speech service initialized');

        const nlpService = new NLPService(serviceConfig, logger, modelManager);
        await nlpService.initialize();
        logger.info('NLP service initialized');

        const ocrService = new OCRService(serviceConfig, logger, modelManager);
        await ocrService.initialize();
        logger.info('OCR service initialized');

        const faceRecognitionService = new FaceRecognitionService(
            serviceConfig,
            logger,
            modelManager,
            dbConnector
        );
        await faceRecognitionService.initialize();
        logger.info('Face recognition service initialized');

        // Create Express app
        const app = express();
        app.use(helmet());
        app.use(cors());
        app.use(express.json());

        // Initialize WebSocket manager
        const webSocketManager = new WebSocketManager(logger);

        // Initialize API gateway
        const apiGateway = new ApiGateway(
            {
                port: config.api.port,
                baseUrl: config.api.baseUrl,
                rateLimit: config.api.rateLimit
            },
            logger,
            app,
            webSocketManager
        );

        // Register services with the API gateway
        apiGateway.registerService('vision', visionService);
        apiGateway.registerService('speech', speechService);
        apiGateway.registerService('nlp', nlpService);
        apiGateway.registerService('ocr', ocrService);
        apiGateway.registerService('face', faceRecognitionService);
        apiGateway.registerService('auth', authManager);

        // Initialize API routes
        apiGateway.initializeRoutes();
        logger.info('API routes initialized');

        // Start the server
        const server = await apiGateway.start();

        // Attach WebSocket to the server
        webSocketManager.attach(server);
        logger.info('WebSocket server attached');

        logger.info(`SmallBlind backend is running on port ${config.api.port}`);

        // Handle shutdown
        const shutdown = async () => {
            logger.info('Shutting down...');
            await apiGateway.stop();
            await dbConnector.disconnect();
            process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (error) {
        logger.error('Failed to initialize application', error);
        process.exit(1);
    }
}

// Start the application
bootstrap().catch(err => {
    console.error('Fatal error during bootstrap:', err);
    process.exit(1);
}); 