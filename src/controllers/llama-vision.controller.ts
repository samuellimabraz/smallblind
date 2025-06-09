import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ImageDescriptionService } from '../services/image-description.service';
import { VisionStorageService } from '../services/vision-storage.service';
import { ImageDescriptionOptions } from '../interfaces/detection.interface';
import fetch from 'node-fetch';

// Extended Request interface to include user and session
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        username?: string;
        email?: string;
    };
    session?: {
        id: string;
        [key: string]: any;
    };
}

export class LlamaVisionController {
    private descriptionService: ImageDescriptionService;
    private visionStorageService: VisionStorageService;
    private llamaServerUrl: string;

    constructor() {
        this.descriptionService = ImageDescriptionService.getInstance();
        this.visionStorageService = VisionStorageService.getInstance();
        this.llamaServerUrl = process.env.LLAMA_SERVER_URL || 'http://localhost:8080';
    }

    /**
     * Check if the llama.cpp server is running
     */
    public checkServerStatus = async (_req: Request, res: Response): Promise<void> => {
        try {
            const healthCheckUrl = `${this.llamaServerUrl}/health`;
            let isRunning = false;
            let status = 'offline';

            try {
                const response = await fetch(healthCheckUrl);
                isRunning = response.ok;
                status = isRunning ? 'online' : 'error';
            } catch (error) {
                console.warn(`Error checking llama.cpp server status:`, error);
            }

            res.status(200).json({
                success: true,
                data: {
                    isRunning,
                    status,
                    serverUrl: this.llamaServerUrl
                }
            });
        } catch (error) {
            console.error('Error checking server status:', error);
            res.status(500).json({
                success: false,
                error: 'Error checking server status',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    };

    /**
     * Get model information from the llama.cpp server
     */
    public getModelInfo = async (_req: Request, res: Response): Promise<void> => {
        try {
            // Get information about the current model
            const currentModel = this.descriptionService.getCurrentModelInfo();

            res.status(200).json({
                success: true,
                data: {
                    currentModel,
                    defaultModel: process.env.LLAMA_DEFAULT_MODEL || 'model.gguf'
                }
            });
        } catch (error) {
            console.error('Error getting model info:', error);
            res.status(500).json({
                success: false,
                error: 'Error getting model information',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    };

    /**
     * Get available models
     */
    public getAvailableModels = async (_req: Request, res: Response): Promise<void> => {
        try {
            const models = this.descriptionService.getAvailableModels();
            const currentModel = this.descriptionService.getCurrentModelInfo();

            res.status(200).json({
                success: true,
                data: {
                    models,
                    default: {
                        model: currentModel?.modelType || process.env.LLAMA_DEFAULT_MODEL || 'default-model',
                    },
                    currentModel,
                    note: "Model is handled by the configured llama.cpp server."
                }
            });
        } catch (error) {
            console.error('Error getting available models:', error);
            res.status(500).json({
                success: false,
                error: 'Error retrieving models',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    };

    /**
     * Describe an image using llama.cpp server
     */
    public describeImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            // Check if file was uploaded
            if (!req.file) {
                res.status(400).json({ error: 'No image file provided' });
                return;
            }

            // Parse options from query parameters
            const options: ImageDescriptionOptions = {
                modelName: req.query.model as string,
                prompt: req.query.prompt as string,
                maxNewTokens: req.query.maxNewTokens ? parseInt(req.query.maxNewTokens as string) : undefined,
                doSample: req.query.doSample === 'true'
            };

            const startTime = Date.now();

            // Process the image using the llama.cpp server
            const result = await this.descriptionService.describeImage(req.file.buffer, options);

            const processingTime = Date.now() - startTime;

            // Save the description results to the database if user is authenticated
            let savedResult = null;
            if (req.user) {
                try {
                    // Extract session ID if available
                    const sessionId = req.session?.id || null;

                    // Save the image description results
                    savedResult = await this.visionStorageService.saveImageDescription(
                        req.user.id,
                        sessionId,
                        req.file.buffer,
                        req.file.originalname || null,
                        req.file.mimetype?.split('/')[1] || null, // Extract format (jpeg, png, etc.)
                        result.model,
                        options.prompt || 'Describe this image in detail',
                        options.maxNewTokens || 150,
                        options.doSample ? 0.7 : 0, // Temperature based on doSample
                        result.description,
                        processingTime
                    );

                    console.log(`Saved image description results with ID: ${savedResult?.id || 'unknown'}`);
                } catch (storageError) {
                    // Log the error but don't fail the request
                    console.error('Error saving description results:', storageError);
                }
            }

            // Return the response
            res.status(200).json({
                success: true,
                data: {
                    ...result,
                    processingTime,
                    savedResultId: savedResult?.id || null
                }
            });
        } catch (error) {
            console.error('Error in image description:', error);
            res.status(500).json({
                success: false,
                error: 'Error processing image',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    };
} 