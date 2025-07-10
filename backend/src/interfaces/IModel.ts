import { ModelMetadata } from '../data-models/ModelMetadata';

/**
 * Interface for AI models in the SmallBlind system
 */
export interface IModel {
  /**
   * Load the model into memory
   */
  load(): Promise<boolean>;
  
  /**
   * Unload the model from memory
   */
  unload(): Promise<boolean>;
  
  /**
   * Run inference on input data
   * @param input Any input data the model can process
   */
  predict(input: any): Promise<any>;
  
  /**
   * Get model metadata
   */
  getMetadata(): ModelMetadata;
} 