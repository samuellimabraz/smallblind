import * as fs from 'fs';
import * as path from 'path';
import { ObjectDetectionService } from '../src/services/object-detection.service';

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
    const dtypeToTest = args.dtype || 'q4';
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