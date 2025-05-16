import { Request, Response } from 'express';
import { ObjectDetectionService } from '../services/object-detection.service';
import { validationResult } from 'express-validator';
import { ObjectDetectionOptions } from '../interfaces/detection.interface';

export class ObjectDetectionController {
    private detectionService: ObjectDetectionService;

    constructor() {
        this.detectionService = ObjectDetectionService.getInstance();
    }

    /**
     * Detect objects in an uploaded image
     */
    public detectObjects = async (req: Request, res: Response): Promise<void> => {
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
            const options: ObjectDetectionOptions = {
                modelName: req.query.model as string,
                threshold: req.query.threshold ? parseFloat(req.query.threshold as string) : undefined,
                maxObjects: req.query.maxObjects ? parseInt(req.query.maxObjects as string) : undefined,
                dtype: req.query.dtype as string
            };

            // Process the image
            const result = await this.detectionService.detectObjects(req.file.buffer, options);

            // Return the response
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error in object detection:', error);
            res.status(500).json({
                success: false,
                error: 'Error processing image',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    };

    /**
     * Get available models for object detection
     */
    public getAvailableModels = async (_req: Request, res: Response): Promise<void> => {
        try {
            const models = this.detectionService.getSuggestedModels();
            const dtypes = this.detectionService.getQuantizationTypes();
            const currentModel = this.detectionService.getCurrentModelInfo();

            res.status(200).json({
                success: true,
                data: {
                    models,
                    quantizationTypes: dtypes,
                    default: {
                        model: 'Xenova/yolos-tiny',
                        dtype: 'q4'
                    },
                    currentModel,
                    note: "You can use any Hugging Face model that supports object detection with the transformers.js pipeline API."
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
     * Preload the default model
     */
    public preloadModel = async (_req: Request, res: Response): Promise<void> => {
        try {
            await this.detectionService.preloadDefaultModel();

            res.status(200).json({
                success: true,
                message: 'Default model preloaded successfully'
            });
        } catch (error) {
            console.error('Error preloading model:', error);
            res.status(500).json({
                success: false,
                error: 'Error preloading model',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    };

    /**
     * Switch to a specific model and unload all others
     */
    public switchModel = async (req: Request, res: Response): Promise<void> => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { model, dtype } = req.body;

            if (!model) {
                res.status(400).json({ error: 'Model name is required' });
                return;
            }

            // Switch to the requested model
            await this.detectionService.switchModel(model, dtype);

            const currentModel = this.detectionService.getCurrentModelInfo();

            res.status(200).json({
                success: true,
                message: `Successfully switched to model: ${model}`,
                data: { currentModel }
            });
        } catch (error) {
            console.error('Error switching model:', error);
            res.status(500).json({
                success: false,
                error: 'Error switching model',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    };

    /**
     * Unload a specific model
     */
    public unloadModel = async (req: Request, res: Response): Promise<void> => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { model, dtype } = req.body;

            if (!model) {
                res.status(400).json({ error: 'Model name is required' });
                return;
            }

            // Unload the specified model
            const wasUnloaded = await this.detectionService.unloadModel(model, dtype);

            if (wasUnloaded) {
                res.status(200).json({
                    success: true,
                    message: `Successfully unloaded model: ${model}`
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: `Model not found: ${model}`
                });
            }
        } catch (error) {
            console.error('Error unloading model:', error);
            res.status(500).json({
                success: false,
                error: 'Error unloading model',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    };

    /**
     * Unload all models
     */
    public unloadAllModels = async (_req: Request, res: Response): Promise<void> => {
        try {
            await this.detectionService.unloadAllModels();

            res.status(200).json({
                success: true,
                message: 'All models have been unloaded'
            });
        } catch (error) {
            console.error('Error unloading all models:', error);
            res.status(500).json({
                success: false,
                error: 'Error unloading all models',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    };

    /**
     * Get information about the current model
     */
    public getCurrentModel = async (_req: Request, res: Response): Promise<void> => {
        try {
            const currentModel = this.detectionService.getCurrentModelInfo();

            if (currentModel) {
                res.status(200).json({
                    success: true,
                    data: { currentModel }
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'No model is currently loaded'
                });
            }
        } catch (error) {
            console.error('Error getting current model:', error);
            res.status(500).json({
                success: false,
                error: 'Error getting current model',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    };
} 