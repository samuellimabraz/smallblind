import { Router } from 'express';
import multer from 'multer';
import { ObjectDetectionController } from '../controllers/object-detection.controller';
import { ImageDescriptionController } from '../controllers/image-description.controller';
import { VisionHistoryController } from '../controllers/vision-history.controller';
import { detectObjectsValidation } from '../schemas/object-detection.schema';
import { describeImageValidation } from '../schemas/image-description.schema';
import { authenticateJWT, optionalAuthenticateJWT } from '../middlewares/auth.middleware';

// Configure multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB limit
    },
    fileFilter: (_req, file, cb) => {
        // Accept only images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Check if running in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Create router
export const visionRouter = Router();

// Initialize controllers
const objectDetectionController = new ObjectDetectionController();
const imageDescriptionController = new ImageDescriptionController();
const visionHistoryController = new VisionHistoryController();

/**
 * @swagger
 * /api/vision/object-detection:
 *   post:
 *     summary: Detect objects in an image
 *     description: Upload an image to detect objects using computer vision
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Vision
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: Model to use for detection (optional)
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: number
 *         description: Detection confidence threshold (0-1)
 *       - in: query
 *         name: maxObjects
 *         schema:
 *           type: integer
 *         description: Maximum number of objects to return
 *       - in: query
 *         name: dtype
 *         schema:
 *           type: string
 *         description: Quantization type (fp32, fp16, q8, q4, etc.)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to analyze
 *     responses:
 *       200:
 *         description: Objects detected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DetectionResponse'
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
visionRouter.post(
    '/object-detection',
    // Use optional authentication in development mode
    isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
    upload.single('image'),
    detectObjectsValidation,
    objectDetectionController.detectObjects
);

/**
 * @swagger
 * /api/vision/models:
 *   get:
 *     summary: Get available object detection models
 *     description: Returns the list of available models for object detection
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Vision
 *     responses:
 *       200:
 *         description: List of available models
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     models:
 *                       type: array
 *                       items:
 *                         type: string
 *                     quantizationTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     default:
 *                       type: object
 *                       properties:
 *                         model:
 *                           type: string
 *                         dtype:
 *                           type: string
 *                     currentModel:
 *                       type: object
 *                       properties:
 *                         modelName:
 *                           type: string
 *                         dtype:
 *                           type: string
 *                     note:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
visionRouter.get(
    '/models',
    // Use optional authentication in development mode
    isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
    objectDetectionController.getAvailableModels
);

/**
 * @swagger
 * /api/vision/preload:
 *   post:
 *     summary: Preload the default object detection model
 *     description: Preloads the default model to speed up first detection
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Vision
 *     responses:
 *       200:
 *         description: Model preloaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Default model preloaded successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
visionRouter.post(
    '/preload',
    // Use optional authentication in development mode
    isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
    objectDetectionController.preloadModel
);

/**
 * @swagger
 * /api/vision/models/current:
 *   get:
 *     summary: Get current model information
 *     description: Returns information about the currently loaded model
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Vision
 *     responses:
 *       200:
 *         description: Current model information
 *       404:
 *         description: No model is currently loaded
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
visionRouter.get(
    '/models/current',
    // Use optional authentication in development mode
    isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
    objectDetectionController.getCurrentModel
);

/**
 * @swagger
 * /api/vision/models/switch:
 *   post:
 *     summary: Switch to a specific model
 *     description: Unloads all current models and loads the specified model
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Vision
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - model
 *             properties:
 *               model:
 *                 type: string
 *                 description: The model name to switch to
 *                 example: Xenova/yolos-small
 *               dtype:
 *                 type: string
 *                 description: The quantization type to use
 *                 example: fp16
 *     responses:
 *       200:
 *         description: Successfully switched to model
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
visionRouter.post(
    '/models/switch',
    // Use optional authentication in development mode
    isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
    objectDetectionController.switchModel
);

/**
 * @swagger
 * /api/vision/models/unload:
 *   post:
 *     summary: Unload a specific model
 *     description: Unloads a specific model to free memory
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Vision
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - model
 *             properties:
 *               model:
 *                 type: string
 *                 description: The model name to unload
 *                 example: Xenova/yolos-tiny
 *               dtype:
 *                 type: string
 *                 description: The quantization type
 *                 example: q4
 *     responses:
 *       200:
 *         description: Successfully unloaded model
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Model not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
visionRouter.post(
    '/models/unload',
    // Use optional authentication in development mode
    isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
    objectDetectionController.unloadModel
);

/**
 * @swagger
 * /api/vision/models/unload-all:
 *   post:
 *     summary: Unload all models
 *     description: Unloads all loaded models to free memory
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Vision
 *     responses:
 *       200:
 *         description: Successfully unloaded all models
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
visionRouter.post(
    '/models/unload-all',
    // Use optional authentication in development mode
    isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
    objectDetectionController.unloadAllModels
);

/**
 * @swagger
 * /api/vision/describe-image:
 *   post:
 *     summary: Generate a description for an image
 *     description: Upload an image to get an AI-generated description using Moondream2 model
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Vision
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: Model to use for description (optional, currently only supports 'moondream2')
 *       - in: query
 *         name: prompt
 *         schema:
 *           type: string
 *         description: Custom prompt to guide the description generation
 *       - in: query
 *         name: maxNewTokens
 *         schema:
 *           type: integer
 *         description: Maximum length of generated description
 *       - in: query
 *         name: doSample
 *         schema:
 *           type: boolean
 *         description: Whether to use sampling for text generation
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to describe
 *     responses:
 *       200:
 *         description: Image described successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ImageDescriptionResponse'
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
visionRouter.post(
    '/describe-image',
    // Use optional authentication in development mode
    isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
    upload.single('image'),
    describeImageValidation,
    imageDescriptionController.describeImage
);

/**
 * @swagger
 * /api/vision/description-models:
 *   get:
 *     summary: Get available image description models
 *     description: Returns the list of available models for image description
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Vision
 *     responses:
 *       200:
 *         description: List of available models
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     models:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           modelType:
 *                             type: string
 *                           modelId:
 *                             type: string
 *                     default:
 *                       type: object
 *                       properties:
 *                         model:
 *                           type: string
 *                     currentModel:
 *                       type: object
 *                       properties:
 *                         modelType:
 *                           type: string
 *                         modelId:
 *                           type: string
 *                     note:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
visionRouter.get(
    '/description-models',
    // Use optional authentication in development mode
    isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
    imageDescriptionController.getAvailableModels
);

/**
 * @swagger
 * /api/vision/description-models/current:
 *   get:
 *     summary: Get current image description model information
 *     description: Returns information about the currently loaded image description model
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Vision
 *     responses:
 *       200:
 *         description: Current model information
 *       404:
 *         description: No model is currently loaded
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
visionRouter.get(
    '/description-models/current',
    // Use optional authentication in development mode
    isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
    imageDescriptionController.getCurrentModel
);

/**
 * @swagger
 * /api/vision/description-models/switch:
 *   post:
 *     summary: Switch to a specific image description model
 *     description: Unloads all current models and loads the specified model
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Vision
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - model
 *             properties:
 *               model:
 *                 type: string
 *                 description: The model type to switch to
 *                 example: moondream2
 *               dtype:
 *                 type: object
 *                 description: The dtype configuration
 *                 example: {embed_tokens: "fp16", vision_encoder: "fp16", decoder_model_merged: "q4"}
 *     responses:
 *       200:
 *         description: Successfully switched to model
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// visionRouter.post(
//     '/description-models/switch',
//     // Use optional authentication in development mode
//     isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
//     imageDescriptionController.switchModel
// );

/**
 * @swagger
 * /api/vision/description-models/unload:
 *   post:
 *     summary: Unload a specific image description model
 *     description: Unloads a specific model to free memory
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Vision
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - model
 *             properties:
 *               model:
 *                 type: string
 *                 description: The model type to unload
 *                 example: moondream2
 *     responses:
 *       200:
 *         description: Successfully unloaded model
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Model not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// visionRouter.post(
//     '/description-models/unload',
//     // Use optional authentication in development mode
//     isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
//     imageDescriptionController.unloadModel
// );

/**
 * @swagger
 * /api/vision/description-models/unload-all:
 *   post:
 *     summary: Unload all image description models
 *     description: Unloads all loaded image description models to free memory
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Vision
 *     responses:
 *       200:
 *         description: Successfully unloaded all models
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// visionRouter.post(
//     '/description-models/unload-all',
//     // Use optional authentication in development mode
//     isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
//     imageDescriptionController.unloadAllModels
// );

/**
 * @swagger
 * /api/vision/history:
 *   get:
 *     summary: Get vision analysis history for the authenticated user
 *     description: Returns the user's vision analysis history with pagination
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Vision History
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records to return (default 20)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of records to skip (default 0)
 *     responses:
 *       200:
 *         description: User vision history
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
visionRouter.get(
    '/history',
    authenticateJWT,
    visionHistoryController.getUserVisionHistory
);

/**
 * @swagger
 * /api/vision/history/session/{sessionId}:
 *   get:
 *     summary: Get vision analyses for a specific session
 *     description: Returns all vision analyses performed during a specific session
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Vision History
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the session
 *     responses:
 *       200:
 *         description: Session vision history
 *       400:
 *         description: Invalid session ID
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
visionRouter.get(
    '/history/session/:sessionId',
    authenticateJWT,
    visionHistoryController.getSessionVisionHistory
);

/**
 * @swagger
 * /api/vision/history/{id}:
 *   get:
 *     summary: Get a specific vision analysis by ID
 *     description: Returns details of a specific vision analysis
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Vision History
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the vision analysis
 *     responses:
 *       200:
 *         description: Vision analysis details
 *       400:
 *         description: Invalid analysis ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - analysis belongs to another user
 *       404:
 *         description: Analysis not found
 *       500:
 *         description: Server error
 */
visionRouter.get(
    '/history/:id',
    authenticateJWT,
    visionHistoryController.getVisionAnalysis
); 