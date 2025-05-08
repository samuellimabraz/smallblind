/**
 * Metadata for AI models in the system
 */
export class ModelMetadata {
    /**
     * Unique identifier for the model
     */
    id: string;

    /**
     * Name of the model
     */
    name: string;

    /**
     * Version of the model
     */
    version: string;

    /**
     * Type of model (e.g., 'vision', 'audio', 'text')
     */
    type: string;

    /**
     * Tasks this model can perform
     */
    tasks: string[];

    /**
     * Format of the model (e.g., 'onnx', 'tensorflow')
     */
    format: string;

    /**
     * Size of the model in bytes
     */
    size: number;

    /**
     * Path to the model file
     */
    path: string;

    /**
     * Whether the model is quantized
     */
    quantized: boolean;

    constructor(data: Partial<ModelMetadata>) {
        this.id = data.id || '';
        this.name = data.name || '';
        this.version = data.version || '';
        this.type = data.type || '';
        this.tasks = data.tasks || [];
        this.format = data.format || '';
        this.size = data.size || 0;
        this.path = data.path || '';
        this.quantized = data.quantized || false;
    }
} 