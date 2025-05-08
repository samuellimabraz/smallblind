import { BoundingBox } from './OCRResult';

/**
 * Result from recognition operations (object detection, face recognition)
 */
export class RecognitionResult {
    /**
     * Unique identifier for the recognition result
     */
    id: string;

    /**
     * Type of recognition (e.g., 'face', 'object', 'text')
     */
    type: string;

    /**
     * Confidence score for the recognition
     */
    confidence: number;

    /**
     * Bounding box for the recognized element
     */
    boundingBox: BoundingBox;

    /**
     * Additional metadata for the recognition
     */
    metadata: any;

    constructor(data: Partial<RecognitionResult>) {
        this.id = data.id || '';
        this.type = data.type || '';
        this.confidence = data.confidence || 0;
        this.boundingBox = data.boundingBox || { x: 0, y: 0, width: 0, height: 0 };
        this.metadata = data.metadata || {};
    }
} 