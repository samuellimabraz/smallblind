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