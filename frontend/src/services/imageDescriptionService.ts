import { authService } from "./authService";
import { env } from "@/lib/env";

const API_BASE_URL = env.BACKEND_API_URL || "http://localhost:3000/api";

export interface ImageDescriptionOptions {
    model?: string;
    prompt?: string;
    maxNewTokens?: number;
    doSample?: boolean;
}

export interface ImageDescriptionResponse {
    success: boolean;
    data: {
        description: string;
        processingTime: number;
        model: string;
        prompt: string;
    };
    error?: string;
}

class ImageDescriptionService {
    private async request(endpoint: string, options: RequestInit = {}) {
        const token = authService.getToken();
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        };

        console.log(`Making request to: ${url}`);

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API request failed: ${response.statusText}`);
        }

        return response.json();
    }

    private async makeApiCall(
        imageFile: File,
        options: ImageDescriptionOptions = {}
    ): Promise<ImageDescriptionResponse> {
        const formData = new FormData();
        formData.append("image", imageFile);

        // Build query parameters
        const queryParams = new URLSearchParams();
        if (options.model) queryParams.append("model", options.model);
        if (options.prompt) queryParams.append("prompt", options.prompt);
        if (options.maxNewTokens !== undefined) queryParams.append("maxNewTokens", options.maxNewTokens.toString());
        if (options.doSample !== undefined) queryParams.append("doSample", options.doSample.toString());

        const endpoint = `/vision/describe-image${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

        console.log(`Describing image with options:`, options);

        try {
            const result = await this.request(endpoint, {
                method: "POST",
                body: formData,
            });

            console.log("Image description result:", result);
            return result;
        } catch (error) {
            console.error("Image description API error:", error);
            throw error;
        }
    }

    async describeScene(imageFile: File): Promise<ImageDescriptionResponse> {
        return this.makeApiCall(imageFile, {
            prompt: "Describe this scene in detail. What do you see? What is happening? Include details about objects, people, actions, colors, lighting to help a blind person understand the scene.",
            maxNewTokens: 120,
            doSample: true
        });
    }

    async extractText(imageFile: File): Promise<ImageDescriptionResponse> {
        return this.makeApiCall(imageFile, {
            prompt: "Read and transcribe all visible text in this image. Include signs, labels, documents, handwriting, and any other text you can see. If there is no text, say 'No text found'.",
            maxNewTokens: 100,
            doSample: false
        });
    }

    async describeImage(
        imageFile: File,
        options: ImageDescriptionOptions = {}
    ): Promise<ImageDescriptionResponse> {
        return this.makeApiCall(imageFile, options);
    }

    async getAvailableModels(): Promise<any> {
        return this.request("/vision/description-models");
    }

    async getCurrentModel(): Promise<any> {
        return this.request("/vision/description-models/current");
    }
}

export const imageDescriptionService = new ImageDescriptionService(); 