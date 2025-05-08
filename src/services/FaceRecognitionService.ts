import { BaseService, ServiceConfig } from './BaseService';
import { ModelManager } from '../core/ModelManager';
import { FaceRecognitionModel } from '../models/FaceRecognitionModel';
import { ILogger } from '../interfaces/ILogger';
import { DatabaseConnector } from '../core/DatabaseConnector';
import fs from 'fs/promises';
import path from 'path';

export interface FaceIdentity {
    userId: string;
    faceId: string;
    name?: string;
    embedding: number[];
    createdAt: Date;
    updatedAt: Date;
}

export interface FaceMatchResult {
    faceId: string;
    userId?: string;
    name?: string;
    confidence: number;
    isMatch: boolean;
}

export interface FaceDetectionOptions {
    minConfidence?: number;
    maxFaces?: number;
    includeLandmarks?: boolean;
}

/**
 * Service for face recognition tasks
 */
export class FaceRecognitionService extends BaseService {
    private modelManager: ModelManager;
    private faceModel: FaceRecognitionModel | null;
    private dbConnector: DatabaseConnector;
    private faceEmbeddings: Map<string, FaceIdentity>;
    private similarityThreshold: number;

    constructor(
        config: ServiceConfig,
        logger: ILogger,
        modelManager: ModelManager,
        dbConnector: DatabaseConnector
    ) {
        super(config, logger);
        this.modelManager = modelManager;
        this.faceModel = null;
        this.dbConnector = dbConnector;
        this.faceEmbeddings = new Map<string, FaceIdentity>();
        this.similarityThreshold = 0.7; // Default similarity threshold for matching
    }

    /**
     * Initialize the face recognition service
     */
    public async initialize(): Promise<void> {
        await super.initialize();

        try {
            // Load face recognition model
            this.faceModel = await this.getOrLoadModel('face-recognition');

            // Load existing face embeddings from database
            await this.loadFaceEmbeddings();

            this.logger.info('Face recognition service initialized', {
                embeddingsLoaded: this.faceEmbeddings.size
            });
        } catch (error) {
            this.logger.error('Error initializing face recognition service', error);
        }
    }

    /**
     * Detect faces in an image
     * @param image Image buffer or path
     * @param options Detection options
     */
    public async detectFaces(image: Buffer | string, options?: FaceDetectionOptions): Promise<any[]> {
        this.logActivity('Detecting faces', {
            imageType: typeof image === 'string' ? 'path' : 'buffer',
            options
        });

        try {
            if (!this.faceModel) {
                this.faceModel = await this.getOrLoadModel('face-recognition');
            }

            // Load image if path is provided
            const imageBuffer = typeof image === 'string'
                ? await this.loadImageFromPath(image)
                : image;

            // Default options
            const processedOptions: FaceDetectionOptions = {
                minConfidence: options?.minConfidence || 0.5,
                maxFaces: options?.maxFaces || 10,
                includeLandmarks: options?.includeLandmarks || false
            };

            // Detect faces
            const faces = await this.faceModel.detect(imageBuffer);

            // Filter results based on options
            return faces
                .filter(face => face.confidence >= processedOptions.minConfidence)
                .slice(0, processedOptions.maxFaces)
                .map(face => {
                    if (!processedOptions.includeLandmarks) {
                        const { landmarks, ...faceWithoutLandmarks } = face;
                        return faceWithoutLandmarks;
                    }
                    return face;
                });
        } catch (error) {
            this.logger.error('Error detecting faces', error);
            return [];
        }
    }

    /**
     * Register a face for a user
     * @param userId User ID
     * @param image Image buffer or path containing face
     * @param name Optional name for the face
     */
    public async registerFace(userId: string, image: Buffer | string, name?: string): Promise<FaceIdentity | null> {
        this.logActivity('Registering face', { userId, name });

        try {
            if (!this.faceModel) {
                this.faceModel = await this.getOrLoadModel('face-recognition');
            }

            // Load image if path is provided
            const imageBuffer = typeof image === 'string'
                ? await this.loadImageFromPath(image)
                : image;

            // Detect faces in the image
            const faces = await this.faceModel.detect(imageBuffer);

            if (faces.length === 0) {
                throw new Error('No face detected in the image');
            }

            if (faces.length > 1) {
                throw new Error('Multiple faces detected in the image, please provide an image with a single face');
            }

            // Get the detected face
            const face = faces[0];

            // Generate face embedding
            const embedding = await this.faceModel.generateEmbedding(imageBuffer, face);

            // Create face identity
            const faceId = `face_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const faceIdentity: FaceIdentity = {
                userId,
                faceId,
                name,
                embedding,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Store in memory
            this.faceEmbeddings.set(faceId, faceIdentity);

            // Store in database
            await this.saveFaceEmbedding(faceIdentity);

            return faceIdentity;
        } catch (error) {
            this.logger.error('Error registering face', error);
            return null;
        }
    }

    /**
     * Recognize faces in an image
     * @param image Image buffer or path
     * @param options Detection options
     */
    public async recognizeFaces(image: Buffer | string, options?: FaceDetectionOptions): Promise<FaceMatchResult[]> {
        this.logActivity('Recognizing faces', {
            imageType: typeof image === 'string' ? 'path' : 'buffer',
            options
        });

        try {
            if (!this.faceModel) {
                this.faceModel = await this.getOrLoadModel('face-recognition');
            }

            // Load image if path is provided
            const imageBuffer = typeof image === 'string'
                ? await this.loadImageFromPath(image)
                : image;

            // Detect faces in the image
            const faces = await this.detectFaces(imageBuffer, options);

            if (faces.length === 0) {
                return [];
            }

            // Process each detected face
            const matchPromises = faces.map(async (face) => {
                // Generate embedding for the detected face
                const embedding = await this.faceModel!.generateEmbedding(imageBuffer, face);

                // Find the best match among registered faces
                const bestMatch = this.findBestMatch(embedding);

                if (bestMatch && bestMatch.confidence >= this.similarityThreshold) {
                    return {
                        faceId: bestMatch.faceId,
                        userId: bestMatch.userId,
                        name: bestMatch.name,
                        confidence: bestMatch.confidence,
                        isMatch: true
                    };
                } else {
                    return {
                        faceId: `unknown_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                        confidence: bestMatch ? bestMatch.confidence : 0,
                        isMatch: false
                    };
                }
            });

            return await Promise.all(matchPromises);
        } catch (error) {
            this.logger.error('Error recognizing faces', error);
            return [];
        }
    }

    /**
     * Delete a registered face
     * @param faceId Face ID to delete
     */
    public async deleteFace(faceId: string): Promise<boolean> {
        this.logActivity('Deleting face', { faceId });

        try {
            if (!this.faceEmbeddings.has(faceId)) {
                return false;
            }

            // Remove from memory
            this.faceEmbeddings.delete(faceId);

            // Remove from database
            const collection = this.dbConnector.getCollection('face_embeddings');
            await collection.deleteOne({ faceId });

            return true;
        } catch (error) {
            this.logger.error('Error deleting face', error);
            return false;
        }
    }

    /**
     * Get all faces registered for a user
     * @param userId User ID
     */
    public async getUserFaces(userId: string): Promise<FaceIdentity[]> {
        this.logActivity('Getting user faces', { userId });

        try {
            const userFaces: FaceIdentity[] = [];

            for (const face of this.faceEmbeddings.values()) {
                if (face.userId === userId) {
                    userFaces.push(face);
                }
            }

            return userFaces;
        } catch (error) {
            this.logger.error('Error getting user faces', error);
            return [];
        }
    }

    /**
     * Set similarity threshold for matching
     * @param threshold Threshold value (0-1)
     */
    public setSimilarityThreshold(threshold: number): void {
        if (threshold < 0 || threshold > 1) {
            throw new Error('Similarity threshold must be between 0 and 1');
        }

        this.similarityThreshold = threshold;
    }

    /**
     * Get similarity threshold
     */
    public getSimilarityThreshold(): number {
        return this.similarityThreshold;
    }

    /**
     * Find best match for a face embedding
     * @param embedding Face embedding to match
     */
    private findBestMatch(embedding: number[]): (FaceIdentity & { confidence: number }) | null {
        if (this.faceEmbeddings.size === 0) {
            return null;
        }

        let bestMatch: (FaceIdentity & { confidence: number }) | null = null;
        let highestSimilarity = 0;

        for (const face of this.faceEmbeddings.values()) {
            const similarity = this.faceModel!.compareEmbeddings(embedding, face.embedding);

            if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                bestMatch = { ...face, confidence: similarity };
            }
        }

        return bestMatch;
    }

    /**
     * Load face embeddings from database
     */
    private async loadFaceEmbeddings(): Promise<void> {
        try {
            const collection = this.dbConnector.getCollection('face_embeddings');
            const embeddings = await collection.find({}).toArray();

            for (const embedding of embeddings) {
                this.faceEmbeddings.set(embedding.faceId, {
                    userId: embedding.userId,
                    faceId: embedding.faceId,
                    name: embedding.name,
                    embedding: embedding.embedding,
                    createdAt: new Date(embedding.createdAt),
                    updatedAt: new Date(embedding.updatedAt)
                });
            }

            this.logger.info('Face embeddings loaded', { count: this.faceEmbeddings.size });
        } catch (error) {
            this.logger.error('Error loading face embeddings', error);
        }
    }

    /**
     * Save face embedding to database
     * @param faceIdentity Face identity to save
     */
    private async saveFaceEmbedding(faceIdentity: FaceIdentity): Promise<void> {
        try {
            const collection = this.dbConnector.getCollection('face_embeddings');
            await collection.insertOne({
                ...faceIdentity,
                createdAt: faceIdentity.createdAt.toISOString(),
                updatedAt: faceIdentity.updatedAt.toISOString()
            });
        } catch (error) {
            this.logger.error('Error saving face embedding', error);
        }
    }

    /**
     * Load image from file path
     * @param imagePath Path to image file
     */
    private async loadImageFromPath(imagePath: string): Promise<Buffer> {
        try {
            // Check if file exists
            await fs.access(imagePath);

            // Check file extension
            const extension = path.extname(imagePath).toLowerCase().replace('.', '');
            const supportedFormats = ['jpg', 'jpeg', 'png', 'bmp'];

            if (!supportedFormats.includes(extension)) {
                throw new Error(`Unsupported file format for face recognition: ${extension}`);
            }

            // Read file
            return await fs.readFile(imagePath);
        } catch (error) {
            this.logger.error('Error loading image from path', error);
            throw error;
        }
    }

    /**
     * Get or load a face recognition model
     * @param task Model task
     */
    private async getOrLoadModel(task: string): Promise<FaceRecognitionModel> {
        // Get model from model manager
        const model = await this.modelManager.getModelForTask(task);

        if (!model) {
            throw new Error(`No model available for task: ${task}`);
        }

        if (model instanceof FaceRecognitionModel) {
            return model;
        } else {
            throw new Error(`Model for task ${task} is not a face recognition model`);
        }
    }
} 