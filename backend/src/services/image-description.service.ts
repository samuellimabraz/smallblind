import { ImageDescriptionOptions, ImageDescriptionResponse } from '../interfaces/detection.interface';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Types of models that can be loaded (now refers to aliases or names for models configured on the llama.cpp server)
 */
type ModelType = string;

/**
 * Interface for the expected success response from llama.cpp /completion
 */
interface LlamaCppCompletionResponse {
    content: string;
    slot_id?: number;
    stop?: boolean;
    model?: string;
    tokens_predicted?: number;
    timings?: object;
}

/**
 * Interface for chat completions response
 */
interface LlamaCppChatResponse {
    choices: Array<{
        message: {
            content: string;
            role: string;
        };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

/**
 * Service for performing image description using a llama.cpp server
 */
export class ImageDescriptionService {
    private static instance: ImageDescriptionService;
    private currentModelKey: string | null = null;

    // Default model alias and server configuration from .env
    private DEFAULT_MODEL: ModelType = process.env.LLAMA_DEFAULT_MODEL || 'default-model';
    private LLAMA_SERVER_URL: string = process.env.LLAMA_SERVER_URL || 'http://localhost:8080';
    private DEFAULT_PROMPT = 'Describe this image in detail.';
    private DEFAULT_MAX_NEW_TOKENS = 150;

    /**
     * Gets the singleton instance of the service
     */
    public static getInstance(): ImageDescriptionService {
        if (!ImageDescriptionService.instance) {
            ImageDescriptionService.instance = new ImageDescriptionService();
            ImageDescriptionService.instance.currentModelKey = ImageDescriptionService.instance.getModelKey(ImageDescriptionService.instance.DEFAULT_MODEL);
        }
        return ImageDescriptionService.instance;
    }

    /**
     * Get the key for a model (can be just the model name/alias)
     */
    private getModelKey(modelType: ModelType): string {
        return `image-description-${modelType}`;
    }

    /**
     * Get information about the currently configured model on the llama.cpp server
     */
    public getCurrentModelInfo(): { modelType: ModelType, modelId: string } | null {
        // Return the actual model that's loaded on the server
        return {
            modelType: 'SmolVLM2-2.2B-Instruct',
            modelId: 'SmolVLM2-2.2B-Instruct'
        };
    }

    /**
     * Get a list of available models
     */
    public getAvailableModels(): { modelType: ModelType, modelId: string }[] {
        return [
            {
                modelType: 'SmolVLM2-2.2B-Instruct',
                modelId: 'SmolVLM2-2.2B-Instruct'
            }
        ];
    }

    /**
     * Load a model (Placeholder - llama.cpp server handles loading)
     */
    public async loadModel(
        modelType: ModelType = this.DEFAULT_MODEL,
        _dtype?: Record<string, string>
    ): Promise<void> {
        const modelKey = this.getModelKey(modelType);
        this.currentModelKey = modelKey;
        console.log(`Connecting to llama.cpp server, which should have model '${modelType}' loaded.`);
        return Promise.resolve();
    }

    /**
     * Switch model (Placeholder - server typically configured with one model at a time)
     */
    public async switchModel(
        modelType: ModelType,
        _dtype?: Record<string, string>
    ): Promise<void> {
        console.warn(`Switching model to '${modelType}'. Ensure llama.cpp server is configured for this model.`);
        this.currentModelKey = this.getModelKey(modelType);
        process.env.LLAMA_DEFAULT_MODEL = modelType;
        this.DEFAULT_MODEL = modelType;
        return Promise.resolve();
    }

    /**
     * Unload a model (Placeholder)
     */
    public async unloadModel(modelType: ModelType): Promise<boolean> {
        console.warn(`Request to unload model '${modelType}'. This is not directly managed by the client for llama.cpp server.`);
        if (this.currentModelKey === this.getModelKey(modelType)) {
            this.currentModelKey = null;
        }
        return Promise.resolve(true);
    }

    /**
     * Unload all models (Placeholder)
     */
    public async unloadAllModels(): Promise<void> {
        console.warn("Request to unload all models. This is not directly managed by the client for llama.cpp server.");
        this.currentModelKey = null;
        return Promise.resolve();
    }

    /**
     * Create a proper chat template for multimodal models
     */
    private createChatTemplate(prompt: string): string {
        // Include the image placeholder [img-1] in the prompt
        return `USER: [img-1] ${prompt}\nASSISTANT:`;
    }

    /**
     * Describe an image using the llama.cpp server with chat completions endpoint
     */
    public async describeImage(
        imageBuffer: Buffer,
        options: ImageDescriptionOptions = {}
    ): Promise<ImageDescriptionResponse> {
        const startTime = Date.now();

        try {
            // Use the actual model name from the server
            const modelIdentifier = 'SmolVLM2-2.2B-Instruct';
            const prompt = options.prompt || this.DEFAULT_PROMPT;
            const maxNewTokens = options.maxNewTokens || this.DEFAULT_MAX_NEW_TOKENS;
            const temperature = options.doSample ? 0.7 : 0.1;

            // Convert image buffer to base64
            const imageBase64 = imageBuffer.toString('base64');
            const mimeType = this.detectMimeType(imageBuffer);

            // Use the chat completions API (OpenAI-compatible) which works reliably
            const payload = {
                model: modelIdentifier,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: prompt
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${mimeType};base64,${imageBase64}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: maxNewTokens,
                temperature: temperature,
                top_p: 0.9,
                stream: false
            };

            const serverUrl = `${this.LLAMA_SERVER_URL}/v1/chat/completions`;
            console.log(`Sending request to llama.cpp server: ${serverUrl}`);
            console.log(`Request prompt: ${prompt}`);
            console.log(`Image data size: ${imageBase64.length} chars`);

            const response = await fetch(serverUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error('Error response from llama.cpp server:', errorBody);
                throw new Error(`llama.cpp server request failed with status ${response.status}: ${errorBody}`);
            }

            const result = await response.json() as LlamaCppChatResponse;
            console.log('llama.cpp server response:', result);

            const description = result.choices?.[0]?.message?.content || '';
            const processingTime = Date.now() - startTime;

            return {
                description: description.trim(),
                processingTime,
                model: modelIdentifier,
                prompt: options.prompt || this.DEFAULT_PROMPT
            };

        } catch (error: any) {
            console.error(`Error during image description with llama.cpp server:`, error);
            throw new Error(`Failed to describe image via llama.cpp: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Alternative method using chat completions API (OpenAI-compatible)
     */
    public async describeImageWithChatAPI(
        imageBuffer: Buffer,
        options: ImageDescriptionOptions = {}
    ): Promise<ImageDescriptionResponse> {
        const startTime = Date.now();

        try {
            const modelIdentifier = process.env.LLAMA_DEFAULT_MODEL || 'gpt-4-vision-preview';
            const prompt = options.prompt || this.DEFAULT_PROMPT;
            const maxNewTokens = options.maxNewTokens || this.DEFAULT_MAX_NEW_TOKENS;
            const temperature = options.doSample ? 0.7 : 0.1;

            // Convert image buffer to base64
            const imageBase64 = imageBuffer.toString('base64');
            const mimeType = this.detectMimeType(imageBuffer);

            const payload = {
                model: modelIdentifier,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: prompt
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${mimeType};base64,${imageBase64}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: maxNewTokens,
                temperature: temperature,
                top_p: 0.9
            };

            const serverUrl = `${this.LLAMA_SERVER_URL}/v1/chat/completions`;
            console.log(`Sending chat API request to: ${serverUrl}`);

            const response = await fetch(serverUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error('Error response from llama.cpp chat API:', errorBody);
                throw new Error(`llama.cpp chat API request failed with status ${response.status}: ${errorBody}`);
            }

            const result = await response.json() as LlamaCppChatResponse;
            console.log('llama.cpp chat API response:', result);

            const description = result.choices?.[0]?.message?.content || '';
            const processingTime = Date.now() - startTime;

            return {
                description: description.trim(),
                processingTime,
                model: modelIdentifier,
                prompt: options.prompt || this.DEFAULT_PROMPT
            };

        } catch (error: any) {
            console.error(`Error during image description with llama.cpp chat API:`, error);
            throw new Error(`Failed to describe image via llama.cpp chat API: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Detect MIME type from image buffer
     */
    private detectMimeType(buffer: Buffer): string {
        const header = buffer.toString('hex', 0, 4);

        if (header.startsWith('ffd8')) return 'image/jpeg';
        if (header.startsWith('8950')) return 'image/png';
        if (header.startsWith('4749')) return 'image/gif';
        if (header.startsWith('5249')) return 'image/webp';

        return 'image/jpeg'; // Default fallback
    }

    /**
     * Preload default model (Placeholder - Server handles this)
     */
    public async preloadDefaultModel(): Promise<void> {
        console.log("Preload request: Ensuring connection to llama.cpp server.");
        try {
            // Try to ping the server
            const healthCheckUrl = `${this.LLAMA_SERVER_URL}/health`;
            const response = await fetch(healthCheckUrl);
            if (!response.ok) {
                console.warn(`Health check to ${healthCheckUrl} failed with status ${response.status}`);
            } else {
                console.log(`Health check to ${healthCheckUrl} successful.`);
            }
        } catch (error) {
            console.warn(`Error during health check to ${this.LLAMA_SERVER_URL}:`, error);
        }
        return this.loadModel();
    }
}