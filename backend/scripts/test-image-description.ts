import * as fs from 'fs';
import * as path from 'path';
import { ImageDescriptionService } from '../src/services/image-description.service';
import PrismaService from '../src/database/prisma-service';

// Path to test image
const TEST_IMAGE_PATH = path.join(__dirname, '../test-images/test-image.jpg');

// Parse command line arguments
function parseArgs() {
    const args: Record<string, string> = {};

    for (let i = 2; i < process.argv.length; i++) {
        const arg = process.argv[i];
        if (arg.startsWith('--')) {
            const [key, value] = arg.substring(2).split('=');
            args[key] = value;
        }
    }

    return args;
}

// Function to save the image description results to the database
async function saveToDatabase(descriptionResult: any, prompt: string, userId?: string) {
    try {
        const prisma = PrismaService.getInstance().prisma;

        // Create a default user if userId is not provided
        if (!userId) {
            const existingUser = await prisma.user.findFirst({
                where: { username: 'test_user' }
            });

            if (!existingUser) {
                console.log('Creating test user for database records...');
                const testUser = await prisma.user.create({
                    data: {
                        username: 'test_user',
                        email: 'test@example.com',
                        passwordHash: '$2b$10$dZcXMQz3STY3N30FJpGaL.7kTH72G2HuhRPF9OAMqMc7lxL6FBPC2' // password: test123
                    }
                });
                userId = testUser.id;
                console.log(`Created test user with ID: ${userId}`);
            } else {
                userId = existingUser.id;
                console.log(`Using existing test user with ID: ${userId}`);
            }
        }

        // Create a session for the test
        console.log('Creating test session...');
        const session = await prisma.session.create({
            data: {
                userId,
                deviceInfo: { userAgent: 'Test Image Description Script', ip: '127.0.0.1' }
            }
        });
        console.log(`Created session with ID: ${session.id}`);

        // Create a vision analysis record
        console.log('Creating vision analysis record...');
        const visionAnalysis = await prisma.visionAnalysis.create({
            data: {
                userId,
                sessionId: session.id,
                imageHash: 'test-image-description-hash',
                imageFormat: 'jpeg',
                fileName: 'test-image.jpg',
                analysisType: 'IMAGE_DESCRIPTION'
            }
        });
        console.log(`Created vision analysis with ID: ${visionAnalysis.id}`);

        // Create the image description record
        console.log('Creating image description record...');
        const imageDescription = await prisma.imageDescription.create({
            data: {
                visionAnalysisId: visionAnalysis.id,
                userId,
                modelName: descriptionResult.model || 'llama-model',
                prompt: prompt,
                maxNewTokens: descriptionResult.maxNewTokens || 150,
                temperature: descriptionResult.temperature || 0.7,
                description: descriptionResult.description,
                processingTimeMs: descriptionResult.processingTime
            }
        });
        console.log(`Created image description with ID: ${imageDescription.id}`);

        console.log('Successfully saved image description to the database');
        return true;
    } catch (error) {
        console.error('Error saving to database:', error);
        return false;
    }
}

async function runTest() {
    try {
        // Check if test image exists
        if (!fs.existsSync(TEST_IMAGE_PATH)) {
            console.error(`Test image not found at ${TEST_IMAGE_PATH}`);
            console.error('Please make sure the test-images directory contains a file named test-image.jpg');
            process.exit(1);
        }

        // Load the test image
        const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
        const imageSizeKB = (imageBuffer.length / 1024).toFixed(2);
        console.log(`Test image loaded: ${TEST_IMAGE_PATH} (${imageSizeKB} KB)`);

        // Get command line arguments
        const args = parseArgs();
        const modelType = args.model || process.env.LLAMA_DEFAULT_MODEL || 'internvl3-1b';
        const prompt = args.prompt || 'Describe this image in detail.';
        const maxNewTokens = args.maxNewTokens ? parseInt(args.maxNewTokens) : 150;
        const doSample = args.doSample === 'false';

        // Get the image description service
        const descriptionService = ImageDescriptionService.getInstance();

        // Get available models
        const availableModels = descriptionService.getAvailableModels();
        console.log('\nAvailable models for image description:');
        availableModels.forEach(model => {
            console.log(`- ${model.modelType} (${model.modelId})`);
        });

        console.log(`\nTesting with llama.cpp server (model: ${modelType})`);
        console.log(`Prompt: "${prompt}"`);

        console.log('\nGenerating description...');
        const startTime = Date.now();

        try {
            // Run the image description
            const result = await descriptionService.describeImage(imageBuffer, {
                modelName: modelType,
                prompt,
                maxNewTokens,
                doSample,
            });

            const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

            console.log('\n✅ Description generated successfully!');
            console.log(`\nTotal time: ${totalTime} seconds (processing time: ${Math.round(result.processingTime)}ms)`);
            console.log('\nGenerated description:');
            console.log('---------------------------------------------');
            console.log(result.description);
            console.log('---------------------------------------------');

            // Save the results to the database
            console.log('\n💾 Saving results to database...');
            const saveResult = await saveToDatabase(result, prompt);

            if (saveResult) {
                console.log('✅ Successfully saved image description results to database!');
            } else {
                console.log('❌ Failed to save image description results to database.');
            }

            console.log('Test complete. llama.cpp server manages model memory.');

        } catch (error) {
            console.error('\n❌ Error generating description:');
            console.error(error);

            console.log('\nTroubleshooting tips:');
            console.log('1. Make sure the image is a valid JPG/PNG format');
            console.log('2. Check your network connectivity for model downloading');
            console.log('3. Verify that the @huggingface/transformers package is properly installed');
            console.log('4. Try running with Node.js v16 or later');

            process.exit(1);
        }
    } catch (error) {
        console.error('Test error:', error);
        process.exit(1);
    }
}

// Run the test
console.log('Running image description test with llama.cpp server...');
console.log('Usage: npm run test:description [-- --model=your-model-alias --prompt="Describe this image." --maxNewTokens=150 --doSample=true]');

runTest().catch(error => {
    console.error('Unhandled error in test:', error);
    process.exit(1);
}); 