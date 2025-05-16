/**
 * @swagger
 * components:
 *   schemas:
 *     Session:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *         - startTime
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the session
 *         userId:
 *           type: string
 *           description: ID of the user this session belongs to
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: When the session started
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: When the session ended (null if session is ongoing)
 *         deviceInfo:
 *           type: object
 *           properties:
 *             platform:
 *               type: string
 *             model:
 *               type: string
 *             osVersion:
 *               type: string
 *             appVersion:
 *               type: string
 *           description: Information about the device used in this session
 *       example:
 *         id: "d2a5f8b1-c6e3-42a9-b0f7-d8e9c1a2b3c4"
 *         userId: "550e8400-e29b-41d4-a716-446655440000"
 *         startTime: "2023-06-15T14:22:10.123Z"
 *         endTime: "2023-06-15T14:45:30.456Z"
 *         deviceInfo: {
 *           platform: "Android",
 *           model: "Pixel 6",
 *           osVersion: "12",
 *           appVersion: "1.2.0"
 *         }
 *     
 *     Interaction:
 *       type: object
 *       required:
 *         - id
 *         - sessionId
 *         - userId
 *         - type
 *         - timestamp
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the interaction
 *         sessionId:
 *           type: string
 *           description: ID of the session this interaction belongs to
 *         userId:
 *           type: string
 *           description: ID of the user who performed this interaction
 *         type:
 *           type: string
 *           description: Type of interaction (vision, speech, ocr, qa, etc.)
 *         input:
 *           type: object
 *           description: Input data for the interaction
 *         output:
 *           type: object
 *           description: Output data from the interaction
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the interaction occurred
 *         duration:
 *           type: integer
 *           description: Duration of the interaction in milliseconds
 *       example:
 *         id: "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"
 *         sessionId: "d2a5f8b1-c6e3-42a9-b0f7-d8e9c1a2b3c4"
 *         userId: "550e8400-e29b-41d4-a716-446655440000"
 *         type: "vision"
 *         input: {
 *           image: "base64_encoded_image_data_would_go_here",
 *           requestType: "objectDetection"
 *         }
 *         output: {
 *           objects: [
 *             {
 *               label: "cup",
 *               confidence: 0.92,
 *               boundingBox: { x: 0.2, y: 0.3, width: 0.1, height: 0.2 }
 *             },
 *             {
 *               label: "table",
 *               confidence: 0.85,
 *               boundingBox: { x: 0.1, y: 0.6, width: 0.8, height: 0.3 }
 *             }
 *           ]
 *         }
 *         timestamp: "2023-06-15T14:25:10.123Z"
 *         duration: 238
 * 
 *     CreateSessionRequest:
 *       type: object
 *       properties:
 *         deviceInfo:
 *           type: object
 *           properties:
 *             platform:
 *               type: string
 *             model:
 *               type: string
 *             osVersion:
 *               type: string
 *             appVersion:
 *               type: string
 *       example:
 *         deviceInfo: {
 *           platform: "Android",
 *           model: "Pixel 6",
 *           osVersion: "12",
 *           appVersion: "1.2.0"
 *         }
 * 
 *     AddInteractionRequest:
 *       type: object
 *       required:
 *         - type
 *       properties:
 *         type:
 *           type: string
 *           description: Type of interaction
 *         input:
 *           type: object
 *           description: Input data
 *         output:
 *           type: object
 *           description: Output data
 *         duration:
 *           type: integer
 *           description: Duration in milliseconds
 *       example:
 *         type: "vision"
 *         input: {
 *           image: "base64_encoded_image_data",
 *           requestType: "objectDetection"
 *         }
 *         output: {
 *           objects: [
 *             {
 *               label: "cup",
 *               confidence: 0.92,
 *               boundingBox: { x: 0.2, y: 0.3, width: 0.1, height: 0.2 }
 *             }
 *           ]
 *         }
 *         duration: 238
 */

// Export TypeScript types that correspond to the Swagger schemas
export interface CreateSessionRequest {
    deviceInfo?: {
        platform?: string;
        model?: string;
        osVersion?: string;
        appVersion?: string;
        [key: string]: any;
    };
}

export interface AddInteractionRequest {
    type: string;
    input?: any;
    output?: any;
    duration?: number;
} 