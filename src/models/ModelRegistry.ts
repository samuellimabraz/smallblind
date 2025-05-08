import { ModelMetadata } from '../data-models/ModelMetadata';

/**
 * Registry for AI models
 */
export class ModelRegistry {
    private models: Map<string, ModelMetadata>;

    constructor() {
        this.models = new Map<string, ModelMetadata>();
    }

    /**
     * Register a model
     * @param modelMetadata Model metadata
     */
    public async registerModel(modelMetadata: ModelMetadata): Promise<boolean> {
        if (this.models.has(modelMetadata.id)) {
            return false;
        }

        this.models.set(modelMetadata.id, modelMetadata);
        return true;
    }

    /**
     * Unregister a model
     * @param modelId Model ID
     */
    public async unregisterModel(modelId: string): Promise<boolean> {
        return this.models.delete(modelId);
    }

    /**
     * Get model metadata
     * @param modelId Model ID
     */
    public async getModel(modelId: string): Promise<ModelMetadata | null> {
        return this.models.get(modelId) || null;
    }

    /**
     * List models matching criteria
     * @param criteria Filter criteria
     */
    public async listModels(criteria?: Partial<ModelMetadata>): Promise<ModelMetadata[]> {
        if (!criteria) {
            return Array.from(this.models.values());
        }

        return Array.from(this.models.values()).filter(model => {
            for (const [key, value] of Object.entries(criteria)) {
                if (Array.isArray(model[key as keyof ModelMetadata]) && Array.isArray(value)) {
                    // For arrays (like tasks), check if there's any overlap
                    const modelArray = model[key as keyof ModelMetadata] as unknown as any[];
                    const criteriaArray = value as any[];
                    if (!criteriaArray.some(item => modelArray.includes(item))) {
                        return false;
                    }
                } else if (model[key as keyof ModelMetadata] !== value) {
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * Load initial models from a configuration file or directory
     * @param modelsBasePath Base path for model files
     */
    public async loadInitialModels(modelsBasePath: string): Promise<number> {
        // Implementation would scan directory for model metadata files

        // Mock implementation with some default models
        const defaultModels: ModelMetadata[] = [
            new ModelMetadata({
                id: 'smolvlm2',
                name: 'SmolVLM2',
                version: '1.0.0',
                type: 'vision',
                tasks: ['image-captioning', 'vqa'],
                format: 'onnx',
                size: 300 * 1024 * 1024, // 300MB
                path: `${modelsBasePath}/smolvlm2.onnx`,
                quantized: true
            }),
            new ModelMetadata({
                id: 'smoldocling',
                name: 'SmolDocling-256M',
                version: '1.0.0',
                type: 'vision',
                tasks: ['document-processing', 'ocr'],
                format: 'onnx',
                size: 256 * 1024 * 1024, // 256MB
                path: `${modelsBasePath}/smoldocling.onnx`,
                quantized: true
            }),
            new ModelMetadata({
                id: 'tinyyolov8',
                name: 'TinyYOLOv8',
                version: '1.0.0',
                type: 'vision',
                tasks: ['object-detection', 'obstacle-detection'],
                format: 'onnx',
                size: 6 * 1024 * 1024, // 6MB
                path: `${modelsBasePath}/tinyyolov8.onnx`,
                quantized: true
            }),
            new ModelMetadata({
                id: 'facenet',
                name: 'FaceNet-ONNX',
                version: '1.0.0',
                type: 'vision',
                tasks: ['face-detection', 'face-recognition'],
                format: 'onnx',
                size: 30 * 1024 * 1024, // 30MB
                path: `${modelsBasePath}/facenet.onnx`,
                quantized: true
            }),
            new ModelMetadata({
                id: 'whisper-tiny',
                name: 'Whisper Tiny',
                version: '1.0.0',
                type: 'audio',
                tasks: ['speech-to-text'],
                format: 'onnx',
                size: 75 * 1024 * 1024, // 75MB
                path: `${modelsBasePath}/whisper-tiny.onnx`,
                quantized: true
            }),
            new ModelMetadata({
                id: 'bark-small',
                name: 'Bark-small',
                version: '1.0.0',
                type: 'audio',
                tasks: ['text-to-speech'],
                format: 'onnx',
                size: 140 * 1024 * 1024, // 140MB
                path: `${modelsBasePath}/bark-small.onnx`,
                quantized: true
            })
        ];

        for (const model of defaultModels) {
            await this.registerModel(model);
        }

        return defaultModels.length;
    }
} 