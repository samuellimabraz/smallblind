import { pipeline } from '@huggingface/transformers';
import { BoundingBox, DetectionResponse, DetectionResult, ObjectDetectionOptions } from '../interfaces/detection.interface';
import * as fs from 'fs';
import * as path from 'path';

// Define valid dtype types
type ValidDtype = 'fp32' | 'fp16' | 'q8' | 'int8' | 'uint8' | 'q4' | 'bnb4' | 'q4f16';

/**
 * Service for performing object detection on images using transformers.js
 */
export class ObjectDetectionService {
    private static instance: ObjectDetectionService;
    private models: Map<string, any> = new Map();
    private modelLoadPromises: Map<string, Promise<any>> = new Map();
    private currentModelKey: string | null = null;

    // Default model - can be configured via env var or settings
    private DEFAULT_MODEL = 'Xenova/yolos-tiny';
    private DEFAULT_DTYPE: ValidDtype = 'fp16'; // Default quantization level

    // Valid quantization types
    private VALID_DTYPES: ValidDtype[] = ['fp32', 'fp16', 'q8', 'int8', 'uint8', 'q4', 'bnb4', 'q4f16'];

    /**
     * Gets the singleton instance of the service
     */
    public static getInstance(): ObjectDetectionService {
        if (!ObjectDetectionService.instance) {
            ObjectDetectionService.instance = new ObjectDetectionService();
        }
        return ObjectDetectionService.instance;
    }

    /**
     * Get the key for a model+dtype combination
     */
    private getModelKey(modelName: string, dtype: string): string {
        // Use a special delimiter that's unlikely to be in model names
        return `${modelName}|||${dtype}`;
    }

    /**
     * Get information about the currently loaded model
     */
    public getCurrentModelInfo(): { modelName: string, dtype: string } | null {
        if (!this.currentModelKey) {
            return null;
        }

        // Split by our special delimiter
        const parts = this.currentModelKey.split('|||');
        if (parts.length !== 2) {
            console.warn(`Invalid model key format: ${this.currentModelKey}`);
            return null;
        }

        const [modelName, dtype] = parts;
        return { modelName, dtype };
    }

    /**
     * Load a model with the specified name and dtype
     * @param modelName The HuggingFace model name to load
     * @param dtype The quantization type (fp32, fp16, q8, q4, etc.)
     * @returns The loaded model
     */
    public async loadModel(modelName: string = this.DEFAULT_MODEL, dtype: string = this.DEFAULT_DTYPE): Promise<any> {
        // Validate dtype
        const validatedDtype = this.VALID_DTYPES.includes(dtype as ValidDtype)
            ? (dtype as ValidDtype)
            : this.DEFAULT_DTYPE;

        if (validatedDtype !== dtype) {
            console.warn(`Invalid dtype: ${dtype}, using default: ${this.DEFAULT_DTYPE}`);
        }

        // Create a unique key for the model+dtype combination
        const modelKey = this.getModelKey(modelName, validatedDtype);

        // If model is already loaded, return it
        if (this.models.has(modelKey)) {
            this.currentModelKey = modelKey;
            return this.models.get(modelKey);
        }

        // If model is currently loading, return the promise
        if (this.modelLoadPromises.has(modelKey)) {
            this.currentModelKey = modelKey;
            return this.modelLoadPromises.get(modelKey);
        }

        console.log(`Loading object detection model: ${modelName} with dtype: ${validatedDtype}`);

        // Create and store the loading promise
        const loadPromise = pipeline('object-detection', modelName, {
            dtype: validatedDtype
        });
        this.modelLoadPromises.set(modelKey, loadPromise);

        try {
            // Wait for the model to load
            const model = await loadPromise;
            this.models.set(modelKey, model);
            this.currentModelKey = modelKey;
            console.log(`Model ${modelName} (${validatedDtype}) loaded successfully`);
            return model;
        } catch (error) {
            console.error(`Error loading model ${modelName} (${validatedDtype}):`, error);
            this.modelLoadPromises.delete(modelKey);
            throw error;
        }
    }

    /**
     * Explicitly load a specific model and unload any other models
     * @param modelName The HuggingFace model name to load
     * @param dtype The quantization type
     * @returns The loaded model
     */
    public async switchModel(modelName: string, dtype: string = this.DEFAULT_DTYPE): Promise<any> {
        // Unload all other models
        await this.unloadAllModels();

        // Load the requested model
        return this.loadModel(modelName, dtype);
    }

    /**
     * Unload a specific model to free memory
     * @param modelName The model name to unload
     * @param dtype The quantization type
     * @returns True if model was unloaded, false if it wasn't loaded
     */
    public async unloadModel(modelName: string, dtype: string = this.DEFAULT_DTYPE): Promise<boolean> {
        const validatedDtype = this.VALID_DTYPES.includes(dtype as ValidDtype)
            ? (dtype as ValidDtype)
            : this.DEFAULT_DTYPE;

        const modelKey = this.getModelKey(modelName, validatedDtype);

        // Cancel any pending load
        this.modelLoadPromises.delete(modelKey);

        // Remove from loaded models
        const wasLoaded = this.models.delete(modelKey);

        // Reset current model key if it matches
        if (this.currentModelKey === modelKey) {
            this.currentModelKey = null;
        }

        if (wasLoaded) {
            console.log(`Model ${modelName} (${validatedDtype}) unloaded`);

            // Force garbage collection (Node.js only)
            if (global.gc) {
                try {
                    global.gc();
                    console.log('Garbage collection triggered');
                } catch (e) {
                    console.warn('Failed to trigger garbage collection:', e);
                }
            }
        }

        return wasLoaded;
    }

    /**
     * Unload all models to free memory
     */
    public async unloadAllModels(): Promise<void> {
        // Get all loaded model keys
        const modelKeys = Array.from(this.models.keys());

        // Clear collections
        this.models.clear();
        this.modelLoadPromises.clear();
        this.currentModelKey = null;

        console.log(`Unloaded ${modelKeys.length} models`);

        // Force garbage collection (Node.js only)
        if (global.gc) {
            try {
                global.gc();
                console.log('Garbage collection triggered');
            } catch (e) {
                console.warn('Failed to trigger garbage collection:', e);
            }
        }
    }

    /**
     * Formats the detection results to a standardized format
     */
    private formatDetections(rawDetections: any[]): DetectionResult[] {
        if (!Array.isArray(rawDetections)) {
            console.warn("Unexpected detection format:", rawDetections);
            return [];
        }

        return rawDetections.map(detection => {
            // Handle different result formats between libraries
            let xmin, ymin, xmax, ymax;
            let score = detection.score;
            let label = detection.label;

            // Handle DETR format
            if (Array.isArray(detection.box)) {
                // Format: [xmin, ymin, xmax, ymax]
                [xmin, ymin, xmax, ymax] = detection.box.map((val: number) => Math.round(val));
            }
            // Handle OWL-ViT format
            else if (typeof detection.box === 'object' && detection.box !== null) {
                // Format: {xmin, ymin, xmax, ymax}
                xmin = Math.round(detection.box.xmin);
                ymin = Math.round(detection.box.ymin);
                xmax = Math.round(detection.box.xmax);
                ymax = Math.round(detection.box.ymax);
            }
            // Handle alternative formats
            else if (detection.bbox) {
                const [x, y, width, height] = detection.bbox;
                xmin = Math.round(x);
                ymin = Math.round(y);
                xmax = Math.round(x + width);
                ymax = Math.round(y + height);
                score = detection.confidence || detection.score;
                label = detection.class_name || detection.category || detection.label;
            } else {
                console.warn(`Unknown box format:`, detection);
                xmin = 0;
                ymin = 0;
                xmax = 100;
                ymax = 100;
            }

            const box: BoundingBox = {
                xmin,
                ymin,
                xmax,
                ymax,
                width: xmax - xmin,
                height: ymax - ymin
            };

            return {
                box,
                score: score,
                label: label,
                class: detection.class || ''
            };
        });
    }

    /**
     * Save image to disk and return a file URL
     */
    private async bufferToImageFile(buffer: Buffer): Promise<string> {
        // Create temporary directory if it doesn't exist
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Create a temporary file path with jpg extension
        const tempFilePath = path.join(tempDir, `temp-${Date.now()}.jpg`);

        // Write buffer to temporary file
        fs.writeFileSync(tempFilePath, buffer);

        // Return the absolute file path
        return tempFilePath;
    }

    /**
     * Convert image buffer to base64 data URL
     */
    private async prepareImageInput(imageBuffer: Buffer): Promise<string> {
        try {
            // Try to save the file to disk first (most reliable approach)
            const filePath = await this.bufferToImageFile(imageBuffer);
            return filePath;
        } catch (error) {
            console.log("File saving failed, trying base64 encoding:", error);

            // Fallback to base64 data URL
            try {
                const base64Image = imageBuffer.toString('base64');
                return `data:image/jpeg;base64,${base64Image}`;
            } catch (error) {
                console.error("Base64 encoding failed:", error);
                throw new Error("Failed to prepare image input");
            }
        }
    }

    /**
     * Detect objects in an image
     * @param imageBuffer The image buffer to process
     * @param options Detection options including model name and threshold
     */
    public async detectObjects(
        imageBuffer: Buffer,
        options: ObjectDetectionOptions = {}
    ): Promise<DetectionResponse> {
        const startTime = Date.now();

        // Use specified model or default
        const modelName = options.modelName || this.DEFAULT_MODEL;
        const threshold = options.threshold || 0.5;
        const maxObjects = options.maxObjects || 0; // 0 means no limit
        const dtype = options.dtype || this.DEFAULT_DTYPE;

        // Load the model
        const detector = await this.loadModel(modelName, dtype);

        try {
            // Prepare the image
            const imageInput = await this.prepareImageInput(imageBuffer);

            console.log(`Running detection with model ${modelName}, threshold: ${threshold}, dtype: ${dtype}`);
            console.log(`Image input type: ${typeof imageInput}`);

            // Run detection
            const result = await detector(imageInput, {
                threshold: threshold
            });

            console.log("Raw detection results:", JSON.stringify(result).substring(0, 200) + "...");

            // Process results
            let detections = this.formatDetections(result);

            // Limit the number of objects if specified
            if (maxObjects > 0 && detections.length > maxObjects) {
                detections = detections.slice(0, maxObjects);
            }

            const processingTime = Date.now() - startTime;

            // Clean up temp file if it was created
            if (typeof imageInput === 'string' && imageInput.startsWith('/')) {
                try {
                    if (fs.existsSync(imageInput)) {
                        fs.unlinkSync(imageInput);
                    }
                } catch (error) {
                    console.warn("Failed to clean up temporary image file:", error);
                }
            }

            return {
                detections,
                processingTime,
                model: modelName,
                dtype: dtype
            };
        } catch (error: any) {
            console.error(`Error during object detection:`, error);

            throw new Error(`Failed to process image: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Get suggested models for object detection
     */
    public getSuggestedModels(): string[] {
        return [
            'Xenova/yolos-tiny',
            'Xenova/yolos-small',
            'Xenova/detr-resnet-50',
            'onnx-community/rtdetr_r50vd',
            'onnx-community/dfine_n_coco-ONNX'
        ];
    }

    /**
     * Get available quantization types
     */
    public getQuantizationTypes(): string[] {
        return [...this.VALID_DTYPES];
    }

    /**
     * Preload default model to speed up first inference
     */
    public async preloadDefaultModel(): Promise<void> {
        await this.loadModel();
    }
} 