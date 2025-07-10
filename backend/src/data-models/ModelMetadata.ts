/**
 * Metadata for an AI model
 */
export interface ModelMetadata {
    name: string;
    version?: string;
    provider?: string;
    description?: string;
    license?: string;
    parameters?: number;
    quantization?: string;
    size?: number; // size in MB
    createdAt?: Date;
    type?: 'object-detection' | 'image-description' | 'multimodal' | 'other';
    capabilities?: string[];
}

/**
 * Configuration for model loading and usage
 */
export interface ModelConfig {
    modelId: string;
    modelType?: string;
    dtype?: string;
    threshold?: number;
    maxObjects?: number;
} 