import { authService } from "./authService";
import { env } from "@/lib/env";

const API_BASE_URL = env.BACKEND_API_URL || "http://localhost:3000/api";

export interface BoundingBox {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
    width: number;
    height: number;
}

export interface DetectionResult {
    box: BoundingBox;
    score: number;
    label: string;
    class: string;
}

export interface ObjectDetectionResponse {
    success: boolean;
    data: {
        detections: DetectionResult[];
        processingTime: number;
        model: string;
        dtype: string;
        savedResultId?: string;
    };
}

export interface ObjectDetectionOptions {
    model?: string;
    threshold?: number;
    maxObjects?: number;
    dtype?: string;
}

class ObjectDetectionService {
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

    async detectObjects(
        imageFile: File,
        options: ObjectDetectionOptions = {}
    ): Promise<ObjectDetectionResponse> {
        const formData = new FormData();
        formData.append("image", imageFile);

        // Build query parameters
        const queryParams = new URLSearchParams();
        if (options.model) queryParams.append("model", options.model);
        if (options.threshold !== undefined) queryParams.append("threshold", options.threshold.toString());
        if (options.maxObjects !== undefined) queryParams.append("maxObjects", options.maxObjects.toString());
        if (options.dtype) queryParams.append("dtype", options.dtype);

        const endpoint = `/vision/object-detection${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

        console.log(`Detecting objects with options:`, options);

        try {
            const result = await this.request(endpoint, {
                method: "POST",
                body: formData,
            });

            console.log("Detection result:", result);
            return result;
        } catch (error) {
            console.error("Object detection API error:", error);
            throw error;
        }
    }

    async getAvailableModels() {
        return this.request("/vision/models");
    }

    async getCurrentModel() {
        return this.request("/vision/models/current");
    }

    async switchModel(model: string, dtype?: string) {
        return this.request("/vision/models/switch", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ model, dtype }),
        });
    }
}

export const objectDetectionService = new ObjectDetectionService(); 