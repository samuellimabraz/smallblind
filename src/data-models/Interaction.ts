/**
 * Interaction model for tracking user interactions with the system
 */
export class Interaction {
    /**
     * Unique identifier for the interaction
     */
    id: string;

    /**
     * ID of the session this interaction belongs to
     */
    sessionId: string;

    /**
     * Type of interaction (e.g., 'image-caption', 'ocr', 'vqa')
     */
    type: string;

    /**
     * Input data for the interaction
     */
    input: any;

    /**
     * Output data from the interaction
     */
    output: any;

    /**
     * Timestamp when the interaction occurred
     */
    timestamp: Date;

    /**
     * Duration of the interaction in milliseconds
     */
    duration: number;

    constructor(data: Partial<Interaction>) {
        this.id = data.id || '';
        this.sessionId = data.sessionId || '';
        this.type = data.type || '';
        this.input = data.input || null;
        this.output = data.output || null;
        this.timestamp = data.timestamp || new Date();
        this.duration = data.duration || 0;
    }
} 