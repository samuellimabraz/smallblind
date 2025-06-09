/**
 * Detection interfaces for object detection functionality
 */

export interface DetectionResult {
    box: BoundingBox;
    score: number;
    label: string;
    class?: number;
}

export interface BoundingBox {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
    width?: number;
    height?: number;
}

export interface ObjectDetectionOptions {
    modelName?: string;
    threshold?: number;
    maxObjects?: number;
    dtype?: string; // Quantization level: fp32, fp16, q8, q4, q2
}

export interface DetectionResponse {
    detections: DetectionResult[];
    processingTime: number;
    model: string;
    dtype: string; // Quantization level used
}

export interface ModelInfo {
    name: string;
    size: string;
    description: string;
    isLoaded: boolean;
}

export interface VisionModelRegistry {
    objectDetection: ModelInfo[];
    imageCaption: ModelInfo[];
}

/**
 * Options for image description
 */
export interface ImageDescriptionOptions {
    modelName?: string;
    prompt?: string;
    maxNewTokens?: number;
    doSample?: boolean;
    dtype?: {
        embed_tokens: 'fp16' | 'fp32';
        vision_encoder: 'fp16' | 'fp32' | 'q8';
        decoder_model_merged: 'q4' | 'q4f16' | 'q8';
    };
}

/**
 * Response for image description
 */
export interface ImageDescriptionResponse {
    description: string;
    processingTime: number;
    model: string;
    prompt: string;
} 