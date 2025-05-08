/**
 * Face embedding for facial recognition
 */
export class FaceEmbedding {
    /**
     * Unique identifier for the face embedding
     */
    id: string;

    /**
     * ID of the user this face belongs to
     */
    userId: string;

    /**
     * ID of the face (a user can have multiple faces stored)
     */
    faceId: string;

    /**
     * Name or label for the face
     */
    name: string;

    /**
     * Vector embedding for the face
     */
    embedding: number[];

    /**
     * Timestamp when the face was created
     */
    createdAt: Date;

    constructor(data: Partial<FaceEmbedding>) {
        this.id = data.id || '';
        this.userId = data.userId || '';
        this.faceId = data.faceId || '';
        this.name = data.name || '';
        this.embedding = data.embedding || [];
        this.createdAt = data.createdAt || new Date();
    }
} 