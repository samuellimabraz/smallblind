import { ImageDescriptionOptions, ImageDescriptionResponse } from '../interfaces/detection.interface';
// import * as fs from 'fs'; // fs is not directly used in this version of the service
// import * as path from 'path'; // path is not directly used in this version of the service
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Types of models that can be loaded (now refers to aliases or names for models configured on the llama.cpp server)
 */
type ModelType = string; // More generic, as actual model is on server

/**
 * Interface for the expected success response from llama.cpp /completion
 */
interface LlamaCppCompletionResponse {
    content: string;
    // Add other fields if you need to use them, e.g.:
    // slot_id?: number;
    // stop?: boolean;
    // model?: string;
    // tokens_predicted?: number;
    // timings?: object;
}

/**
 * Service for performing image description using a llama.cpp server
 */
export class ImageDescriptionService {
    private static instance: ImageDescriptionService;
    private currentModelKey: string | null = null; // Can still represent the default/configured model

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
            // Set the current model key to the default one from .env
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
        // modelId here might just be the same as modelType, or a more descriptive name
        // if you have a way to query the server for its exact model file, that could be used.
        // For now, we'll use the configured LLAMA_DEFAULT_MODEL.
        const configuredModel = process.env.LLAMA_DEFAULT_MODEL || this.DEFAULT_MODEL;
        return {
            modelType: configuredModel,
            modelId: configuredModel // Or a more specific identifier if available
        };
    }

    /**
     * Get a list of available models (this is now more informational, as server controls models)
     */
    public getAvailableModels(): { modelType: ModelType, modelId: string }[] {
        // This would ideally query the llama.cpp server if it had an endpoint for listing models.
        // For now, we'll return the default model.
        const defaultModel = this.getCurrentModelInfo();
        return defaultModel ? [defaultModel] : [];
    }

    /**
     * Load a model (Placeholder - llama.cpp server handles loading)
     * @param modelType The type of model to load
     * @returns A promise indicating completion
     */
    public async loadModel(
        modelType: ModelType = this.DEFAULT_MODEL,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _dtype?: Record<string, string> // dtype is no longer used
    ): Promise<void> { // Return type changed
        const modelKey = this.getModelKey(modelType);
        this.currentModelKey = modelKey;
        console.log(`Connecting to llama.cpp server, which should have model '${modelType}' loaded.`);
        // No actual loading client-side, server handles it.
        return Promise.resolve();
    }

    /**
     * Switch model (Placeholder - server typically configured with one model at a time via docker-compose)
     * @param modelType The type of model to "switch" to (conceptually)
     * @returns A promise indicating completion
     */
    public async switchModel(
        modelType: ModelType,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _dtype?: Record<string, string> // dtype is no longer used
    ): Promise<void> { // Return type changed
        console.warn(`Switching model to '${modelType}'. Ensure llama.cpp server is configured for this model.`);
        // Actual switching involves reconfiguring and restarting the llama.cpp server,
        // or using its multi-model API if enabled and supported.
        // For this service, we'll just update the conceptual currentModelKey.
        this.currentModelKey = this.getModelKey(modelType);
        process.env.LLAMA_DEFAULT_MODEL = modelType; // Update runtime concept
        this.DEFAULT_MODEL = modelType;
        return Promise.resolve();
    }

    /**
     * Unload a model (Placeholder - not directly controlled by this client)
     * @param modelType The type of model to unload (conceptually)
     * @returns True if model was conceptually "unloaded"
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
     * Describe an image using the llama.cpp server
     * @param imageBuffer The image buffer to process
     * @param options Description options including prompt (modelName is less relevant now)
     */
    public async describeImage(
        imageBuffer: Buffer,
        options: ImageDescriptionOptions = {}
    ): Promise<ImageDescriptionResponse> {
        const startTime = Date.now();

        try {
            // The model used is determined by the llama.cpp server configuration.
            // options.modelName might be used if the server supports selecting from multiple loaded models via API.
            // For now, we assume the server uses its default configured model.
            const modelIdentifier = process.env.LLAMA_DEFAULT_MODEL || this.DEFAULT_MODEL;

            const prompt = options.prompt || this.DEFAULT_PROMPT;
            const maxNewTokens = options.maxNewTokens || this.DEFAULT_MAX_NEW_TOKENS;
            // const doSample = options.doSample !== undefined ? options.doSample : false; // llama.cpp uses 'temperature'
            const temperature = options.doSample ? 0.7 : 0; // Example: 0 for deterministic, >0 for sampling

            // Convert image buffer to base64
            const imageBase64 = imageBuffer.toString('base64');

            // Construct the payload for llama.cpp server
            // The prompt needs to include a placeholder for the image, e.g., [img-ID]
            // And the image data is sent in a separate field.
            // Common convention is to use a placeholder like `[img-1]` in the prompt.
            const requestPrompt = `${prompt}\n[img-1]`; // Added newline for safety, and placeholder

            const payload = {
                prompt: requestPrompt,
                n_predict: maxNewTokens,
                temperature: temperature,
                // slot_id: 0, // If using slots for concurrent requests
                image_data: [
                    { data: imageBase64, id: 1 } // ID matches the placeholder in the prompt
                ],
                stream: false, // Get full response at once
            };

            const serverUrl = `${this.LLAMA_SERVER_URL}/completion`;
            console.log(`Sending request to llama.cpp server: ${serverUrl} with model target: ${modelIdentifier}`);

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

            const result = await response.json() as LlamaCppCompletionResponse;
            // console.log('llama.cpp server response:', result); // For debugging

            // Extract the description from the 'content' field
            // The server is expected to return the main content directly in result.content
            const description = result.content || '';

            // The llama.cpp server output might include the prompt. Clean it if necessary.
            // This depends on the model's behavior.
            // For now, we assume the 'content' field is just the generated text.
            // If the prompt is "Describe this image: [img-1]" and the model echoes it,
            // you might need to strip `prompt + " "` from the beginning of `description`.
            // Example of stripping if model includes prompt:
            // if (description.startsWith(requestPrompt.substring(0, requestPrompt.indexOf('[img-1]')))) {
            //    description = description.substring(requestPrompt.substring(0, requestPrompt.indexOf('[img-1]')).length).trim();
            // }

            const processingTime = Date.now() - startTime;

            return {
                description: description.trim(),
                processingTime,
                model: modelIdentifier, // The model configured on the server
                prompt: options.prompt || this.DEFAULT_PROMPT // The original user prompt
            };

        } catch (error: any) {
            console.error(`Error during image description with llama.cpp server:`, error);
            throw new Error(`Failed to describe image via llama.cpp: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Preload default model (Placeholder - Server handles this)
     */
    public async preloadDefaultModel(): Promise<void> {
        console.log("Preload request: Ensuring connection to llama.cpp server. Server handles actual model loading.");
        // Potentially add a health check to the server here
        try {
            const healthCheckUrl = `${this.LLAMA_SERVER_URL}/health`; // Assuming a health endpoint
            const response = await fetch(healthCheckUrl);
            if (!response.ok) {
                console.warn(`Health check to ${healthCheckUrl} failed with status ${response.status}`);
            } else {
                console.log(`Health check to ${healthCheckUrl} successful.`);
            }
        } catch (error) {
            console.warn(`Error during health check to ${this.LLAMA_SERVER_URL}:`, error);
        }
        return this.loadModel(); // Conceptually "loads" or verifies connection
    }
} 