import { IModel } from '../interfaces/IModel';
import { ModelMetadata } from '../data-models/ModelMetadata';
import { ValidationResult } from '../interfaces/IController';

/**
 * Abstract base class for AI models
 */
export abstract class BaseModel implements IModel {
    protected modelPath: string;
    protected modelInstance: any;
    protected metadata: ModelMetadata;

    constructor(metadata: ModelMetadata) {
        this.metadata = metadata;
        this.modelPath = metadata.path;
    }

    /**
     * Load the model into memory
     */
    public async load(): Promise<boolean> {
        return true;
    }

    /**
     * Unload the model from memory
     */
    public async unload(): Promise<boolean> {
        this.modelInstance = null;
        return true;
    }

    /**
     * Get model metadata
     */
    public getMetadata(): ModelMetadata {
        return this.metadata;
    }

    /**
     * Run inference on input data
     * @param input Input data
     */
    public abstract predict(input: any): Promise<any>;

    /**
     * Validate input data
     * @param input Input data to validate
     */
    protected validateInput(input: any): ValidationResult {
        return {
            valid: true
        };
    }
} 