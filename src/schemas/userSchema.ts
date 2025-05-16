/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - username
 *         - email
 *         - passwordHash
 *         - createdAt
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the user
 *         username:
 *           type: string
 *           description: The username for login
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email address
 *         passwordHash:
 *           type: string
 *           description: Hashed password
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the user was created
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: When the user last logged in
 *       example:
 *         id: "550e8400-e29b-41d4-a716-446655440000"
 *         username: "johndoe"
 *         email: "john.doe@example.com"
 *         passwordHash: "$2b$10$..."
 *         createdAt: "2023-01-01T00:00:00.000Z"
 *         lastLogin: "2023-01-02T12:34:56.789Z"
 *     
 *     AppSettings:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the settings
 *         userId:
 *           type: string
 *           description: ID of the user these settings belong to
 *         voiceId:
 *           type: string
 *           description: ID of the preferred voice
 *         speechRate:
 *           type: number
 *           format: float
 *           default: 1.0
 *           description: Speech rate, from 0.5 to 2.0
 *         speechPitch:
 *           type: number
 *           format: float
 *           default: 1.0
 *           description: Speech pitch, from 0.5 to 2.0
 *         detectionThreshold:
 *           type: number
 *           format: float
 *           default: 0.5
 *           description: Object detection confidence threshold
 *         detectionMode:
 *           type: string
 *           default: "standard"
 *           description: Object detection mode (standard, detailed, simple)
 *         language:
 *           type: string
 *           default: "en"
 *           description: Preferred language
 *         theme:
 *           type: string
 *           default: "system"
 *           description: UI theme
 *         notificationsEnabled:
 *           type: boolean
 *           default: true
 *           description: Whether notifications are enabled
 *         highContrast:
 *           type: boolean
 *           default: false
 *           description: Whether high contrast mode is enabled
 *         largeText:
 *           type: boolean
 *           default: false
 *           description: Whether large text mode is enabled
 *         audioDescriptions:
 *           type: boolean
 *           default: true
 *           description: Whether audio descriptions are enabled
 *         hapticFeedback:
 *           type: boolean
 *           default: true
 *           description: Whether haptic feedback is enabled
 *       example:
 *         id: "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d"
 *         userId: "550e8400-e29b-41d4-a716-446655440000"
 *         voiceId: "en-US-standard-B"
 *         speechRate: 1.0
 *         speechPitch: 1.0
 *         detectionThreshold: 0.7
 *         detectionMode: "detailed"
 *         language: "en-US"
 *         theme: "dark"
 *         notificationsEnabled: true
 *         highContrast: false
 *         largeText: true
 *         audioDescriptions: true
 *         hapticFeedback: true
 * 
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 30
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *       example:
 *         username: "johndoe"
 *         email: "john.doe@example.com"
 *         password: "password123"
 * 
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
 *           format: password
 *       example:
 *         username: "johndoe"
 *         password: "password123"
 * 
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 30
 *         email:
 *           type: string
 *           format: email
 *       example:
 *         username: "johndoe2"
 *         email: "new.email@example.com"
 * 
 *     UpdateSettingsRequest:
 *       type: object
 *       properties:
 *         voiceId:
 *           type: string
 *         speechRate:
 *           type: number
 *           format: float
 *         speechPitch:
 *           type: number
 *           format: float
 *         detectionThreshold:
 *           type: number
 *           format: float
 *         detectionMode:
 *           type: string
 *         language:
 *           type: string
 *         theme:
 *           type: string
 *         notificationsEnabled:
 *           type: boolean
 *         highContrast:
 *           type: boolean
 *         largeText:
 *           type: boolean
 *         audioDescriptions:
 *           type: boolean
 *         hapticFeedback:
 *           type: boolean
 *       example:
 *         voiceId: "en-US-standard-A"
 *         speechRate: 1.2
 *         theme: "light"
 *         largeText: true
 */

// Export TypeScript types that correspond to the Swagger schemas
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface UpdateProfileRequest {
    username?: string;
    email?: string;
}

export interface UpdateSettingsRequest {
    voiceId?: string;
    speechRate?: number;
    speechPitch?: number;
    detectionThreshold?: number;
    detectionMode?: string;
    language?: string;
    theme?: string;
    notificationsEnabled?: boolean;
    highContrast?: boolean;
    largeText?: boolean;
    audioDescriptions?: boolean;
    hapticFeedback?: boolean;
} 