import axios from 'axios';
import * as fs from 'fs';
import { ImageDescriptionOptions, ImageDescriptionResponse } from '../interfaces/detection.interface';

/**
 * Service for performing image description using llama.cpp server with multimodal models
 */
export class LlamaVisionService {
    private static instance: LlamaVisionService;
    private serverUrl: string;
    private defaultModel: string;

    // Available models
    private availableModels = [
        { id: 'internvl3-1b', name: 'InternVL3-1B-Instruct' },
        { id: 'smolvlm-500m', name: 'SmolVLM-500M-Instruct' }
    ];

    constructor() {
        // Read config from environment variables or use defaults
        this.serverUrl = process.env.LLAMA_SERVER_URL || 'http://localhost:8080';
        this.defaultModel = process.env.LLAMA_DEFAULT_MODEL || 'internvl3-1b';
    }

    /**
     * Gets the singleton instance of the service
     */
    public static getInstance(): LlamaVisionService {
        if (!LlamaVisionService.instance) {
            LlamaVisionService.instance = new LlamaVisionService();
        }
        return LlamaVisionService.instance;
    }

    /**
     * Get available models
     */
    public getAvailableModels() {
        return this.availableModels;
    }

    /**
     * Check if the llama.cpp server is running
     */
    public async checkServerStatus(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.serverUrl}/health`);
            return response.status === 200;
        } catch (error) {
            console.error('Error checking llama.cpp server status:', error);
            return false;
        }
    }

    /**
     * Get model info from the server
     */
    public async getModelInfo(): Promise<any> {
        try {
            const response = await axios.get(`${this.serverUrl}/model`);
            return response.data;
        } catch (error) {
            console.error('Error getting model info from llama.cpp server:', error);
            throw new Error('Failed to get model info from server');
        }
    }

    /**
     * Convert image buffer to base64
     */
    private bufferToBase64(buffer: Buffer): string {
        return buffer.toString('base64');
    }

    /**
     * Create a prompt template for the multimodal model
     */
    private createPrompt(prompt: string): string {
        return `<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`;
    }

    /**
     * Describe an image using the llama.cpp server with multimodal models
     */
    public async describeImage(
        imageBuffer: Buffer,
        options: ImageDescriptionOptions = {}
    ): Promise<ImageDescriptionResponse> {
        const startTime = Date.now();

        try {
            // Check if server is running
            const isServerRunning = await this.checkServerStatus();
            if (!isServerRunning) {
                throw new Error('Llama.cpp server is not running');
            }

            // Use custom prompt or default
            const defaultPrompt = 'Please describe this image in detail.';
            const prompt = options.prompt || defaultPrompt;

            // Convert image to base64
            const base64Image = this.bufferToBase64(imageBuffer);

            // Parameters for the request
            const params = {
                prompt: this.createPrompt(prompt),
                image_data: [{ data: base64Image, id: 1 }],
                stream: false,
                max_tokens: options.maxNewTokens || 300,
                temperature: options.doSample ? 0.7 : 0.1,
                stop: ["<|im_start|>", "<|im_end|>"]
            };

            // Make request to llama.cpp server
            const response = await axios.post(`${this.serverUrl}/completion`, params);

            // Process the response
            const responseData = response.data as { content: string };
            const generatedText = responseData.content;

            // Measure processing time
            const processingTime = Date.now() - startTime;

            // Return in the format expected by the application
            return {
                description: generatedText,
                processingTime,
                model: options.modelName || this.defaultModel,
                prompt
            };
        } catch (error) {
            console.error('Error during image description with llama.cpp:', error);
            throw new Error(`Failed to describe image with llama.cpp: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
} 