import * as fs from 'fs';
import * as path from 'path';
import { ObjectDetectionService } from '../src/services/object-detection.service';
import PrismaService from '../src/database/prisma-service';

/**
 * Test script for object detection service
 * Usage: npm run test:detection [-- --model=Xenova/yolos-small] [-- --dtype=q4]
 */

// Path to test image
const TEST_IMAGE_PATH = path.join(process.cwd(), 'test-images', 'test-image.jpg');

// Parse command line arguments
function parseArgs(): Record<string, string> {
    const args: Record<string, string> = {};

    process.argv.slice(2).forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.substring(2).split('=');
            args[key] = value || 'true';
        }
    });

    return args;
}

// Function to save the detection results to the database
async function saveToDatabase(detectionResult: any, userId?: string) {
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
                deviceInfo: { userAgent: 'Test Detection Script', ip: '127.0.0.1' }
            }
        });
        console.log(`Created session with ID: ${session.id}`);

        // Create a vision analysis record
        console.log('Creating vision analysis record...');
        const visionAnalysis = await prisma.visionAnalysis.create({
            data: {
                userId,
                sessionId: session.id,
                imageHash: 'test-image-hash',
                imageFormat: 'jpeg',
                fileName: 'test-image.jpg',
                analysisType: 'OBJECT_DETECTION'
            }
        });
        console.log(`Created vision analysis with ID: ${visionAnalysis.id}`);

        // Create the object detection record
        console.log('Creating object detection record...');
        const objectDetection = await prisma.objectDetection.create({
            data: {
                visionAnalysisId: visionAnalysis.id,
                userId,
                modelName: detectionResult.model,
                modelSettings: {
                    threshold: 0.45,
                    dtype: detectionResult.dtype
                },
                processingTimeMs: detectionResult.processingTime
            }
        });
        console.log(`Created object detection with ID: ${objectDetection.id}`);

        // Create records for each detected object
        console.log('Creating detected object records...');
        for (const detection of detectionResult.detections) {
            await prisma.detectedObject.create({
                data: {
                    objectDetectionId: objectDetection.id,
                    label: detection.label,
                    confidence: detection.score,
                    boundingBox: {
                        xmin: detection.box.xmin,
                        ymin: detection.box.ymin,
                        width: detection.box.width,
                        height: detection.box.height
                    }
                }
            });
        }

        console.log(`Successfully saved ${detectionResult.detections.length} detected objects to the database`);
        return true;
    } catch (error) {
        console.error('Error saving to database:', error);
        return false;
    }
}

async function runTest(): Promise<void> {
    console.log('🔍 Testing Object Detection Service with @huggingface/transformers');
    console.log('------------------------------------------------------');

    const args = parseArgs();

    // Check if test image exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
        console.error('❌ Test image not found at:', TEST_IMAGE_PATH);
        console.error('Please add a test image named "test-image.jpg" in the test-images directory.');
        console.error('Example: copy an image to test-images/test-image.jpg');
        process.exit(1);
    }

    // Load image
    console.log('📁 Loading test image from:', TEST_IMAGE_PATH);
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    const fileSizeKB = (imageBuffer.length / 1024).toFixed(2);
    console.log(`✅ Image loaded (${fileSizeKB} KB)`);

    // Get service instance
    const detectionService = ObjectDetectionService.getInstance();

    // List available models
    console.log('\n📋 Suggested models:');
    const models = detectionService.getSuggestedModels();
    models.forEach((model: string, index: number) => {
        console.log(`   ${index + 1}. ${model}`);
    });

    // Get available quantization types
    const dtypes = detectionService.getQuantizationTypes();
    console.log('\n📊 Available quantization types:');
    dtypes.forEach((dtype: string, index: number) => {
        console.log(`   ${index + 1}. ${dtype}`);
    });

    // Determine which model and dtype to test
    const modelToTest = args.model || models[0];
    const dtypeToTest = args.dtype || 'fp16';
    console.log(`\n🚀 Testing with model: ${modelToTest}`);
    console.log(`🔧 Using quantization: ${dtypeToTest}`);

    try {
        console.time('Detection time');

        // Run detection
        const result = await detectionService.detectObjects(imageBuffer, {
            modelName: modelToTest,
            threshold: 0.45,
            dtype: dtypeToTest
        });

        console.timeEnd('Detection time');

        // Display results
        console.log('\n✅ Detection successful!');
        console.log(`📊 Found ${result.detections.length} objects`);
        console.log(`⏱️ Processing time: ${result.processingTime}ms`);
        console.log(`🔧 Model: ${result.model} (${result.dtype})`);

        if (result.detections.length > 0) {
            console.log('\n📋 Detected objects:');
            result.detections.forEach((detection, i) => {
                console.log(`   ${i + 1}. ${detection.label} (confidence: ${(detection.score * 100).toFixed(2)}%)`);
                console.log(`      Box: x=${detection.box.xmin}, y=${detection.box.ymin}, width=${detection.box.width}, height=${detection.box.height}`);
            });

            // Save the results to the database
            console.log('\n💾 Saving results to database...');
            const saveResult = await saveToDatabase(result);

            if (saveResult) {
                console.log('✅ Successfully saved detection results to database!');
            } else {
                console.log('❌ Failed to save detection results to database.');
            }
        } else {
            console.log('No objects detected in the image.');
        }

    } catch (error) {
        console.error('❌ Error during detection:', error);
        console.error('\nTroubleshooting tips:');
        console.error('1. Ensure the image is a valid JPG/PNG format');
        console.error('2. Check network connectivity for model downloading');
        console.error('3. Try with a different model using the --model=Xenova/yolos-small option');
        console.error('4. Try with a different quantization type using the --dtype=fp16 option');
        console.error('5. Make sure @huggingface/transformers is properly installed');
    }
}

// Run the test
runTest().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
}); 