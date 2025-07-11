import { authService } from "./authService";
import { env } from "@/lib/env";

const API_BASE_URL = env.BACKEND_API_URL || "http://localhost:3000/api";

export interface VisionHistoryItem {
    id: string;
    userId: string;
    sessionId?: string;
    createdAt: string;
    imageHash?: string;
    imageFormat?: string;
    fileName?: string;
    imagePath?: string;
    analysisType: 'OBJECT_DETECTION' | 'IMAGE_DESCRIPTION' | 'FACE_RECOGNITION';
    objectDetection?: {
        id: string;
        modelName: string;
        modelSettings?: any;
        processingTimeMs?: number;
        detectedObjects: Array<{
            id: string;
            label: string;
            confidence: number;
            boundingBox: any;
            attributes?: any;
        }>;
    };
    imageDescription?: {
        id: string;
        modelName: string;
        prompt: string;
        maxNewTokens?: number;
        temperature?: number;
        description: string;
        processingTimeMs?: number;
    };
    faceRecognition?: {
        id: string;
        threshold: number;
        processingTimeMs?: number;
        recognizedFaces: Array<{
            id: string;
            personId?: string;
            personName?: string;
            confidence: number;
            boundingBox?: any;
            attributes?: any;
        }>;
    };
    session?: {
        id: string;
        startTime: string;
        endTime?: string;
    };
}

export interface VisionHistoryResponse {
    data: VisionHistoryItem[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

export interface VisionHistoryOptions {
    limit?: number;
    offset?: number;
}

class VisionHistoryService {
    private async request(endpoint: string, options: RequestInit = {}) {
        const token = authService.getToken();
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            "Content-Type": "application/json",
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

    async getUserVisionHistory(options: VisionHistoryOptions = {}): Promise<VisionHistoryResponse> {
        const { limit = 20, offset = 0 } = options;
        const queryParams = new URLSearchParams();

        if (limit) queryParams.append("limit", limit.toString());
        if (offset) queryParams.append("offset", offset.toString());

        const endpoint = `/vision/history${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

        try {
            const result = await this.request(endpoint);
            console.log("Vision history result:", result);

            // The backend returns { success: true, data: { data: [...], pagination: {...} } }
            // We need to extract the actual data from the nested structure
            if (result.success && result.data) {
                return result.data;
            } else {
                throw new Error(result.error || "Invalid response format");
            }
        } catch (error) {
            console.error("Vision history API error:", error);
            throw error;
        }
    }

    async getSessionVisionHistory(sessionId: string): Promise<{ data: VisionHistoryItem[] }> {
        const endpoint = `/vision/history/session/${sessionId}`;

        try {
            const result = await this.request(endpoint);
            console.log("Session vision history result:", result);

            // The backend returns { success: true, data: [...] }
            if (result.success && result.data) {
                return { data: result.data };
            } else {
                throw new Error(result.error || "Invalid response format");
            }
        } catch (error) {
            console.error("Session vision history API error:", error);
            throw error;
        }
    }

    async getVisionAnalysis(id: string): Promise<{ data: VisionHistoryItem }> {
        const endpoint = `/vision/history/${id}`;

        try {
            const result = await this.request(endpoint);
            console.log("Vision analysis result:", result);

            // The backend returns { success: true, data: {...} }
            if (result.success && result.data) {
                return { data: result.data };
            } else {
                throw new Error(result.error || "Invalid response format");
            }
        } catch (error) {
            console.error("Vision analysis API error:", error);
            throw error;
        }
    }
}

export const visionHistoryService = new VisionHistoryService(); 