import { PrismaClient } from '../src/generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database seeding...');

    try {
        // Clear existing data
        console.log('Clearing existing data...');
        await clearDatabase();

        // Create a user
        console.log('Creating sample user...');
        const user = await createUser();

        // Create app settings for the user
        console.log('Creating app settings...');
        await createAppSettings(user.id);

        // Create a session for the user
        console.log('Creating session...');
        const session = await createSession(user.id);

        // Create an interaction in the session
        console.log('Creating interaction...');
        await createInteraction(session.id, user.id);

        // Create a face embedding for the user
        console.log('Creating face embedding...');
        await createFaceEmbedding(user.id);

        // Create model metadata
        console.log('Creating model metadata entries...');
        await createModelMetadata();

        // Create OCR result
        console.log('Creating OCR result...');
        const ocrResult = await createOCRResult();

        // Create text blocks for the OCR result
        console.log('Creating text blocks...');
        await createTextBlocks(ocrResult.id);

        // Create recognition result
        console.log('Creating recognition result...');
        await createRecognitionResult();

        // Create system log
        console.log('Creating system log...');
        await createSystemLog();

        // Create rate limit rule
        console.log('Creating rate limit rule...');
        await createRateLimitRule();

        // Create API key
        console.log('Creating API key...');
        await createApiKey(user.id);

        console.log('Database seeding completed successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

async function clearDatabase() {
    // Delete data in reverse order of dependencies
    await prisma.textBlock.deleteMany();
    await prisma.oCRResult.deleteMany();
    await prisma.recognitionResult.deleteMany();
    await prisma.interaction.deleteMany();
    await prisma.session.deleteMany();
    await prisma.faceEmbedding.deleteMany();
    await prisma.appSettings.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.systemLog.deleteMany();
    await prisma.rateLimitRule.deleteMany();
    await prisma.modelMetadata.deleteMany();
    await prisma.user.deleteMany();
}

async function createUser() {
    const passwordHash = await bcrypt.hash('password123', 10);

    return prisma.user.create({
        data: {
            username: 'johndoe',
            email: 'john.doe@example.com',
            passwordHash,
            createdAt: new Date(),
            lastLogin: new Date(),
        },
    });
}

async function createAppSettings(userId: string) {
    return prisma.appSettings.create({
        data: {
            userId,
            voiceId: 'en-US-standard-B',
            speechRate: 1.0,
            speechPitch: 1.0,
            detectionThreshold: 0.7,
            detectionMode: 'detailed',
            language: 'en-US',
            theme: 'dark',
            notificationsEnabled: true,
            highContrast: false,
            largeText: true,
            audioDescriptions: true,
            hapticFeedback: true,
        },
    });
}

async function createSession(userId: string) {
    return prisma.session.create({
        data: {
            userId,
            startTime: new Date(Date.now() - 3600000), // 1 hour ago
            deviceInfo: {
                platform: 'Android',
                model: 'Pixel 6',
                osVersion: '12',
                appVersion: '1.2.0',
            },
        },
    });
}

async function createInteraction(sessionId: string, userId: string) {
    return prisma.interaction.create({
        data: {
            sessionId,
            userId,
            type: 'vision',
            input: {
                image: 'base64_encoded_image_data_would_go_here',
                requestType: 'objectDetection',
            },
            output: {
                objects: [
                    {
                        label: 'cup',
                        confidence: 0.92,
                        boundingBox: { x: 0.2, y: 0.3, width: 0.1, height: 0.2 },
                    },
                    {
                        label: 'table',
                        confidence: 0.85,
                        boundingBox: { x: 0.1, y: 0.6, width: 0.8, height: 0.3 },
                    },
                ],
            },
            timestamp: new Date(),
            duration: 238, // milliseconds
        },
    });
}

async function createFaceEmbedding(userId: string) {
    return prisma.faceEmbedding.create({
        data: {
            userId,
            faceId: 'face_123456',
            name: 'John Doe',
            embedding: [0.1, 0.23, -0.15, 0.42, -0.05, 0.18, 0.32, -0.27],
            createdAt: new Date(),
        },
    });
}

async function createModelMetadata() {
    // Create multiple model metadata entries for different model types
    await prisma.modelMetadata.createMany({
        data: [
            {
                name: 'YOLOv5',
                version: '6.0',
                type: 'vision',
                tasks: ['objectDetection', 'sceneUnderstanding'],
                format: 'ONNX',
                size: 15000000,
                path: '/models/vision/yolov5.onnx',
                quantized: true,
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                name: 'Whisper',
                version: 'small',
                type: 'audio',
                tasks: ['speechToText', 'audioClassification'],
                format: 'PyTorch',
                size: 98000000,
                path: '/models/audio/whisper-small.pt',
                quantized: false,
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                name: 'FaceNet',
                version: '1.0.1',
                type: 'face',
                tasks: ['faceDetection', 'faceRecognition'],
                format: 'TensorFlow',
                size: 24000000,
                path: '/models/face/facenet.pb',
                quantized: true,
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                name: 'Tesseract',
                version: '5.0',
                type: 'ocr',
                tasks: ['textExtraction', 'documentProcessing'],
                format: 'Custom',
                size: 45000000,
                path: '/models/ocr/tesseract-eng.traineddata',
                quantized: false,
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ],
    });
}

async function createOCRResult() {
    return prisma.oCRResult.create({
        data: {
            text: 'This is a sample OCR result extracted from an image.',
            confidence: 0.89,
            language: 'en',
            createdAt: new Date(),
        },
    });
}

async function createTextBlocks(ocrResultId: string) {
    await prisma.textBlock.createMany({
        data: [
            {
                ocrResultId,
                text: 'This is a',
                boundingBox: { x: 10, y: 20, width: 80, height: 30 },
                confidence: 0.92,
                type: 'phrase',
            },
            {
                ocrResultId,
                text: 'sample OCR result',
                boundingBox: { x: 95, y: 20, width: 180, height: 30 },
                confidence: 0.88,
                type: 'phrase',
            },
            {
                ocrResultId,
                text: 'extracted from an image.',
                boundingBox: { x: 10, y: 55, width: 250, height: 30 },
                confidence: 0.87,
                type: 'phrase',
            },
        ],
    });
}

async function createRecognitionResult() {
    return prisma.recognitionResult.create({
        data: {
            type: 'object',
            confidence: 0.94,
            boundingBox: { x: 0.2, y: 0.3, width: 0.4, height: 0.5 },
            metadata: {
                label: 'person',
                attributes: {
                    age: 'adult',
                    gender: 'male',
                    pose: 'standing',
                },
            },
            createdAt: new Date(),
        },
    });
}

async function createSystemLog() {
    return prisma.systemLog.create({
        data: {
            level: 'info',
            message: 'System startup completed successfully',
            metadata: {
                version: '1.0.0',
                environment: 'development',
                startupTime: 3.45,
            },
            timestamp: new Date(),
        },
    });
}

async function createRateLimitRule() {
    return prisma.rateLimitRule.create({
        data: {
            path: '/api/vision/*',
            limit: 100,
            window: 3600,
            userType: 'free',
            active: true,
        },
    });
}

async function createApiKey(userId: string) {
    return prisma.apiKey.create({
        data: {
            key: 'sk_test_' + Math.random().toString(36).substring(2, 15),
            name: 'Development API Key',
            userId,
            scopes: ['vision:read', 'speech:read', 'ocr:read'],
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            createdAt: new Date(),
            lastUsed: null,
        },
    });
}

main()
    .then(() => console.log('Seed execution completed'))
    .catch((e) => {
        console.error('Error in seed execution:', e);
        process.exit(1);
    }); 