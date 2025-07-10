import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { json, urlencoded } from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';
import { authRouter } from './routes/authRoutes';
import { userRouter } from './routes/userRoutes';
import { sessionRouter } from './routes/sessionRoutes';
import { visionRouter } from './routes/visionRoutes';
import { llamaRouter } from './routes/llamaRoutes';
import PrismaService from './database/prisma-service';
import { ObjectDetectionService } from './services/object-detection.service';

// Load environment variables
dotenv.config();

// Initialize Prisma
const prismaService = PrismaService.getInstance();

// Create Express app
const app = express();

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// Configure CORS for development
app.use(cors({
    origin: '*', // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(json({ limit: '50mb' })); // Increased limit for image data
app.use(urlencoded({ extended: true, limit: '50mb' }));

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SmallBlind API',
            version: '1.0.0',
            description: 'API for SmallBlind AI vision application',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/schemas/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/vision', visionRouter);
app.use('/api/llama', llamaRouter);

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Connect to database
        await prismaService.connect();
        console.log('Connected to database');

        // Preload default object detection model in the background
        const objectDetectionService = ObjectDetectionService.getInstance();
        objectDetectionService.preloadDefaultModel().catch(error => {
            console.error('Error preloading detection model:', error);
        });

        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    await prismaService.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down server...');
    await prismaService.disconnect();
    process.exit(0);
});

// Start the server
startServer();

export default app; 