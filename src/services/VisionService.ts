import { BaseService, ServiceConfig } from './BaseService';
import { ModelManager } from '../core/ModelManager';
import { VisionModel } from '../models/VisionModel';
import { FaceRecognitionModel } from '../models/FaceRecognitionModel';
import { ILogger } from '../interfaces/ILogger';
import { RecognitionResult } from '../data-models/RecognitionResult';
import { IModel } from '../interfaces/IModel';
import { ValidationResult } from '../utils/Validator';
import fs from 'fs/promises';
import path from 'path';

export interface SceneDescription {
    caption: string;
    objects: string[];
    containsObstacles: boolean;
    safetyScore: number;
}

export interface Obstacle {
    type: string;
    position: string;
    distance: number;
    severity: 'low' | 'medium' | 'high';
}

export interface Face {
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    confidence: number;
    landmarks?: any;
}

export interface RecognizedFace extends Face {
    personId?: string;
    name?: string;
    similarity: number;
}

export interface ImageProcessOptions {
    width?: number;
    height?: number;
    format?: 'png' | 'jpeg' | 'webp';
    quality?: number;
    grayscale?: boolean;
}

export interface Object {
    id: string;
    label: string;
    confidence: number;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

/**
 * Service for vision-related tasks
 */
export class VisionService extends BaseService {
    private modelManager: ModelManager;
    private visionModels: Map<string, VisionModel | FaceRecognitionModel>;
    private supportedFormats: string[];

    constructor(config: ServiceConfig, logger: ILogger, modelManager: ModelManager) {
        super(config, logger);
        this.modelManager = modelManager;
        this.visionModels = new Map<string, VisionModel | FaceRecognitionModel>();
        this.supportedFormats = ['jpg', 'jpeg', 'png', 'webp', 'bmp'];
    }

    /**
     * Initialize the vision service
     */
    public async initialize(): Promise<void> {
        await super.initialize();

        // Pre-load commonly used models
        try {
            const objectDetectionModel = await this.getOrLoadModel('object-detection');
            const imageClassificationModel = await this.getOrLoadModel('image-classification');

            this.logger.info('Vision service initialized', {
                loadedModels: Array.from(this.visionModels.keys())
            });
        } catch (error) {
            this.logger.error('Error initializing vision service', error);
        }
    }

    /**
     * Generate a caption for an image
     * @param image Image buffer
     */
    public async captionImage(image: Buffer): Promise<string> {
        this.logActivity('Generating image caption');

        try {
            const model = await this.getOrLoadModel('image-captioning');

            if (model instanceof VisionModel) {
                const result = await model.predict(image);

                // If result is an array, take the first item, otherwise use directly
                const caption = Array.isArray(result) && result.length > 0
                    ? result[0].caption || result[0].text || result[0].description || 'No caption available'
                    : typeof result === 'string'
                        ? result
                        : result.caption || result.text || result.description || 'No caption available';

                return caption;
            } else {
                throw new Error('Invalid model type for image captioning');
            }
        } catch (error) {
            this.logger.error('Error generating image caption', error);
            return 'Could not generate caption for this image.';
        }
    }

    /**
     * Detect objects in an image
     * @param image Image buffer or path
     */
    public async detectObjects(image: Buffer | string): Promise<Object[]> {
        this.logActivity('Detecting objects', {
            imageType: typeof image === 'string' ? 'path' : 'buffer'
        });

        try {
            // Load image if path is provided
            const imageBuffer = typeof image === 'string'
                ? await this.loadImageFromPath(image)
                : image;

            // Validate image
            this.validateImage(imageBuffer);

            // Get object detection model
            const model = await this.getOrLoadModel('object-detection');

            // Detect objects
            const result = await model.predict(imageBuffer);

            // Process results
            if (Array.isArray(result)) {
                return result.map((obj, index) => ({
                    id: `object-${index}`,
                    label: obj.label || 'unknown',
                    confidence: obj.confidence || 0,
                    boundingBox: obj.boundingBox || { x: 0, y: 0, width: 0, height: 0 }
                }));
            } else {
                throw new Error('Invalid result format from object detection model');
            }
        } catch (error) {
            this.logger.error('Error in object detection', error);
            return [];
        }
    }

    /**
     * Detect obstacles in an image
     * @param image Image buffer
     */
    public async detectObstacles(image: Buffer): Promise<Obstacle[]> {
        this.logActivity('Detecting obstacles in image');

        try {
            const objectResults = await this.detectObjects(image);

            // Filter and map objects to obstacles
            // This is a simplified logic - in a real implementation, more complex scene
            // understanding would be used to determine what constitutes an obstacle
            const obstacles: Obstacle[] = objectResults
                .filter(obj => {
                    const label = obj.label as string || '';
                    const potentialObstacles = [
                        'chair', 'table', 'desk', 'person', 'pole', 'car', 'truck',
                        'stair', 'step', 'curb', 'tree', 'bench', 'wall', 'fence'
                    ];
                    return potentialObstacles.some(item => label.toLowerCase().includes(item));
                })
                .map(obj => {
                    // Calculate distance (mock implementation)
                    // In a real app, depth estimation would be used
                    const width = obj.boundingBox.width;
                    const height = obj.boundingBox.height;
                    const size = width * height;
                    const mockDistance = Math.max(1, Math.min(10, 100 / size));

                    // Determine position within frame
                    const centerX = obj.boundingBox.x + (obj.boundingBox.width / 2);
                    const centerY = obj.boundingBox.y + (obj.boundingBox.height / 2);
                    let position = 'center';

                    if (centerX < 0.33) position = 'left';
                    else if (centerX > 0.66) position = 'right';

                    if (centerY < 0.33) position = `top ${position}`;
                    else if (centerY > 0.66) position = `bottom ${position}`;

                    // Calculate severity based on size and distance
                    let severity: 'low' | 'medium' | 'high' = 'low';
                    if (mockDistance < 3) severity = 'high';
                    else if (mockDistance < 6) severity = 'medium';

                    return {
                        type: obj.label as string || 'unknown obstacle',
                        position,
                        distance: mockDistance,
                        severity
                    };
                });

            return obstacles;
        } catch (error) {
            this.logger.error('Error detecting obstacles', error);
            return [];
        }
    }

    /**
     * Generate a comprehensive scene description
     * @param image Image buffer
     */
    public async understandScene(image: Buffer): Promise<SceneDescription> {
        this.logActivity('Generating scene understanding');

        try {
            // Run captioning and object detection in parallel
            const [caption, objects] = await Promise.all([
                this.captionImage(image),
                this.detectObjects(image)
            ]);

            const objectLabels = objects.map(obj => obj.label).filter(Boolean) as string[];

            // Check for obstacles
            const obstacles = await this.detectObstacles(image);
            const containsObstacles = obstacles.length > 0;

            // Calculate safety score (mock implementation)
            // In a real app, this would use more sophisticated scene analysis
            let safetyScore = 1.0;

            if (containsObstacles) {
                const highSeverityCount = obstacles.filter(o => o.severity === 'high').length;
                const mediumSeverityCount = obstacles.filter(o => o.severity === 'medium').length;

                safetyScore -= (highSeverityCount * 0.2) + (mediumSeverityCount * 0.1);
                safetyScore = Math.max(0, safetyScore);
            }

            return {
                caption,
                objects: objectLabels,
                containsObstacles,
                safetyScore
            };
        } catch (error) {
            this.logger.error('Error understanding scene', error);
            return {
                caption: 'Could not analyze this scene.',
                objects: [],
                containsObstacles: false,
                safetyScore: 0.5
            };
        }
    }

    /**
     * Detect faces in an image
     * @param image Image buffer
     */
    public async detectFaces(image: Buffer): Promise<Face[]> {
        this.logActivity('Detecting faces in image');

        try {
            const model = await this.getOrLoadModel('face-detection');

            if (model instanceof FaceRecognitionModel) {
                const faces = await model.detect(image);
                return faces;
            } else {
                throw new Error('Invalid model type for face detection');
            }
        } catch (error) {
            this.logger.error('Error detecting faces', error);
            return [];
        }
    }

    /**
     * Recognize registered faces in an image
     * @param image Image buffer
     * @param registeredFaces Array of registered face embeddings for comparison
     */
    public async recognizeFaces(
        image: Buffer,
        registeredFaces: Array<{ id: string; name: string; embedding: number[] }>
    ): Promise<RecognizedFace[]> {
        this.logActivity('Recognizing faces in image');

        try {
            // First detect faces
            const faces = await this.detectFaces(image);
            if (faces.length === 0) return [];

            const recognitionModel = await this.getOrLoadModel('face-recognition');

            if (recognitionModel instanceof FaceRecognitionModel) {
                const recognizedFaces: RecognizedFace[] = [];

                // For each detected face, generate embedding and find best match
                for (const face of faces) {
                    const embedding = await recognitionModel.generateEmbedding(image, face);

                    // Find best match
                    let bestMatch = { id: '', name: '', similarity: 0 };

                    for (const registeredFace of registeredFaces) {
                        const similarity = recognitionModel.compareEmbeddings(
                            embedding,
                            registeredFace.embedding
                        );

                        if (similarity > bestMatch.similarity) {
                            bestMatch = {
                                id: registeredFace.id,
                                name: registeredFace.name,
                                similarity
                            };
                        }
                    }

                    // Only consider as recognized if similarity is above threshold
                    if (bestMatch.similarity > 0.7) {
                        recognizedFaces.push({
                            ...face,
                            personId: bestMatch.id,
                            name: bestMatch.name,
                            similarity: bestMatch.similarity
                        });
                    } else {
                        recognizedFaces.push({
                            ...face,
                            similarity: bestMatch.similarity
                        });
                    }
                }

                return recognizedFaces;
            } else {
                throw new Error('Invalid model type for face recognition');
            }
        } catch (error) {
            this.logger.error('Error recognizing faces', error);
            return [];
        }
    }

    /**
     * Register a new face for a user
     * @param images Array of face images from different angles
     * @param userId User ID
     * @param faceId Face identifier
     */
    public async registerFace(images: Buffer[], userId: string, faceId: string): Promise<number[][]> {
        this.logActivity('Registering face', { userId, faceId });

        try {
            const detectionModel = await this.getOrLoadModel('face-detection');
            const recognitionModel = await this.getOrLoadModel('face-recognition');

            if (!(detectionModel instanceof FaceRecognitionModel) ||
                !(recognitionModel instanceof FaceRecognitionModel)) {
                throw new Error('Invalid model types for face registration');
            }

            const embeddings: number[][] = [];

            // Process each image
            for (const image of images) {
                // Detect faces
                const faces = await detectionModel.detect(image);

                if (faces.length === 0) {
                    this.logger.warn('No face detected in image during registration', { userId, faceId });
                    continue;
                }

                // Find the largest face in the image (presumably the main subject)
                faces.sort((a, b) =>
                    (b.boundingBox.width * b.boundingBox.height) -
                    (a.boundingBox.width * a.boundingBox.height)
                );

                const mainFace = faces[0];

                // Generate embedding for this face
                const embedding = await recognitionModel.generateEmbedding(image, mainFace);
                embeddings.push(embedding);
            }

            if (embeddings.length === 0) {
                throw new Error('No valid face embeddings could be generated from the provided images');
            }

            return embeddings;
        } catch (error) {
            this.logger.error('Error registering face', error);
            throw error;
        }
    }

    /**
     * Classifies an image
     * @param image Image buffer or path
     */
    public async classifyImage(image: Buffer | string): Promise<{ label: string; confidence: number }[]> {
        this.logActivity('Classifying image', {
            imageType: typeof image === 'string' ? 'path' : 'buffer'
        });

        try {
            // Load image if path is provided
            const imageBuffer = typeof image === 'string'
                ? await this.loadImageFromPath(image)
                : image;

            // Validate image
            this.validateImage(imageBuffer);

            // Get image classification model
            const model = await this.getOrLoadModel('image-classification');

            // Classify image
            const result = await model.predict(imageBuffer);

            // Process results
            if (Array.isArray(result)) {
                return result.map(item => ({
                    label: item.label || 'unknown',
                    confidence: item.confidence || 0
                }));
            } else if (result && result.label) {
                return [{ label: result.label, confidence: result.confidence || 0 }];
            } else {
                throw new Error('Invalid result format from image classification model');
            }
        } catch (error) {
            this.logger.error('Error in image classification', error);
            return [];
        }
    }

    /**
     * Processes an image with various transformations
     * @param image Image buffer or path
     * @param options Processing options
     */
    public async processImage(image: Buffer | string, options: ImageProcessOptions): Promise<Buffer> {
        this.logActivity('Processing image', { options });

        try {
            // Load image if path is provided
            const imageBuffer = typeof image === 'string'
                ? await this.loadImageFromPath(image)
                : image;

            // Validate image
            this.validateImage(imageBuffer);

            // In a real implementation, this would use an image processing library
            // like Sharp or Jimp to apply the requested transformations

            // For now, just return the original image
            this.logger.info('Image processed with options', { options });
            return imageBuffer;
        } catch (error) {
            this.logger.error('Error processing image', error);
            throw error;
        }
    }

    /**
     * Gets supported image formats
     */
    public getSupportedFormats(): string[] {
        return [...this.supportedFormats];
    }

    /**
     * Load image from file path
     * @param imagePath Path to image file
     */
    private async loadImageFromPath(imagePath: string): Promise<Buffer> {
        try {
            // Check if file exists
            await fs.access(imagePath);

            // Check if file has a supported extension
            const extension = path.extname(imagePath).toLowerCase().replace('.', '');
            if (!this.supportedFormats.includes(extension)) {
                throw new Error(`Unsupported image format: ${extension}`);
            }

            // Read file
            return await fs.readFile(imagePath);
        } catch (error) {
            this.logger.error('Error loading image from path', error);
            throw error;
        }
    }

    /**
     * Validate image buffer
     * @param image Image buffer
     */
    private validateImage(image: Buffer): ValidationResult {
        if (!(image instanceof Buffer)) {
            throw new Error('Invalid image: not a buffer');
        }

        if (image.length === 0) {
            throw new Error('Invalid image: empty buffer');
        }

        // In a real implementation, we would check the file signature/magic bytes
        // to validate that it's actually an image file of a supported format

        return { valid: true };
    }

    /**
     * Get or load a vision model by task
     * @param task Model task
     */
    private async getOrLoadModel(task: string): Promise<VisionModel | FaceRecognitionModel> {
        // Check if we already have this model loaded
        const cachedModel = Array.from(this.visionModels.values()).find(model =>
            model.getMetadata().tasks.includes(task)
        );

        if (cachedModel) {
            return cachedModel;
        }

        // Get model from model manager
        const model = await this.modelManager.getModelForTask(task);

        if (!model) {
            throw new Error(`No model available for task: ${task}`);
        }

        if (model instanceof VisionModel || model instanceof FaceRecognitionModel) {
            // Cache the model for future use
            this.visionModels.set(model.getMetadata().id, model);
            return model;
        } else {
            throw new Error(`Model for task ${task} is not a vision model`);
        }
    }
} 