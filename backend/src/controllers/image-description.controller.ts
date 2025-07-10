import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ImageDescriptionService } from '../services/image-description.service';
import { ImageDescriptionOptions } from '../interfaces/detection.interface';

export class ImageDescriptionController {
    private descriptionService: ImageDescriptionService;

    constructor() {
        this.descriptionService = ImageDescriptionService.getInstance();
    }

    /**
     * Describe an image using multimodal models
     */
    public describeImage = async (req: Request, res: Response): Promise<void> => {
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


            // Process the image
            const result = await this.descriptionService.describeImage(req.file.buffer, options);

            // Return the response
            res.status(200).json({
                success: true,
                data: result
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

    /**
     * Get available models for image description
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
                        // Use the actual model name from the server
                        model: 'SmolVLM2-2.2B-Instruct',
                    },
                    currentModel,
                    note: "Image description is handled by the configured llama.cpp server."
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
    // public preloadModel = async (_req: Request, res: Response): Promise<void> => {
    //     try {
    //         await this.descriptionService.preloadDefaultModel();
    //         res.status(200).json({
    //             success: true,
    //             message: 'Default image description model preloaded successfully (connected to llama.cpp server)'
    //         });
    //     } catch (error) {
    //         console.error('Error preloading model:', error);
    //         res.status(500).json({
    //             success: false,
    //             error: 'Error preloading model / connecting to llama.cpp server',
    //             details: error instanceof Error ? error.message : String(error)
    //         });
    //     }
    // };

    /**
     * Switch to a specific model and unload all others
     * (NOTE: For llama.cpp server, this is a conceptual switch.
     * The actual model change needs server reconfiguration.)
     */
    // public switchModel = async (req: Request, res: Response): Promise<void> => {
    //     try {
    //         const errors = validationResult(req);
    //         if (!errors.isEmpty()) {
    //             res.status(400).json({ errors: errors.array() });
    //             return;
    //         }
    //
    //         const { model /*, dtype */ } = req.body; // dtype removed
    //
    //         if (!model) {
    //             res.status(400).json({ error: 'Model name is required' });
    //             return;
    //         }
    //
    //         // await this.descriptionService.switchModel(model, dtype); // dtype removed
    //         await this.descriptionService.switchModel(model);
    //
    //         const currentModel = this.descriptionService.getCurrentModelInfo();
    //
    //         res.status(200).json({
    //             success: true,
    //             message: `Conceptually switched to model: ${model}. Ensure llama.cpp server is configured accordingly.`,
    //             data: { currentModel }
    //         });
    //     } catch (error) {
    //         console.error('Error switching model:', error);
    //         res.status(500).json({
    //             success: false,
    //             error: 'Error switching model',
    //             details: error instanceof Error ? error.message : String(error)
    //         });
    //     }
    // };

    /**
     * Unload a specific model
     * (NOTE: For llama.cpp server, this is conceptual.)
     */
    // public unloadModel = async (req: Request, res: Response): Promise<void> => {
    //     try {
    //         const errors = validationResult(req);
    //         if (!errors.isEmpty()) {
    //             res.status(400).json({ errors: errors.array() });
    //             return;
    //         }
    //
    //         const { model } = req.body;
    //
    //         if (!model) {
    //             res.status(400).json({ error: 'Model name is required' });
    //             return;
    //         }
    //
    //         const wasUnloaded = await this.descriptionService.unloadModel(model);
    //
    //         if (wasUnloaded) {
    //             res.status(200).json({
    //                 success: true,
    //                 message: `Conceptually unloaded model: ${model}`
    //             });
    //         } else {
    //             res.status(404).json({
    //                 success: false,
    //                 message: `Model not found or not managed by client: ${model}`
    //             });
    //         }
    //     } catch (error) {
    //         console.error('Error unloading model:', error);
    //         res.status(500).json({
    //             success: false,
    //             error: 'Error unloading model',
    //             details: error instanceof Error ? error.message : String(error)
    //         });
    //     }
    // };

    /**
     * Unload all models
     * (NOTE: For llama.cpp server, this is conceptual.)
     */
    // public unloadAllModels = async (_req: Request, res: Response): Promise<void> => {
    //     try {
    //         await this.descriptionService.unloadAllModels();
    //
    //         res.status(200).json({
    //             success: true,
    //             message: 'All image description models have been conceptually unloaded (client-side)'
    //         });
    //     } catch (error) {
    //         console.error('Error unloading all models:', error);
    //         res.status(500).json({
    //             success: false,
    //             error: 'Error unloading all models',
    //             details: error instanceof Error ? error.message : String(error)
    //         });
    //     }
    // };

    /**
     * Get information about the current model
     */
    public getCurrentModel = async (_req: Request, res: Response): Promise<void> => {
        try {
            const currentModel = this.descriptionService.getCurrentModelInfo();

            if (currentModel) {
                res.status(200).json({
                    success: true,
                    data: { currentModel }
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'No image description model is currently loaded'
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