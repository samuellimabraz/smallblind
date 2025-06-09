import { Router } from 'express';
import multer from 'multer';
import { LlamaVisionController } from '../controllers/llama-vision.controller';
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
export const llamaRouter = Router();

// Initialize controller
const llamaVisionController = new LlamaVisionController();

/**
 * @swagger
 * /api/llama/status:
 *   get:
 *     summary: Check if llama.cpp server is running
 *     description: Returns the status of the llama.cpp server
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Llama CPP
 *     responses:
 *       200:
 *         description: Server status
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
 *                     isRunning:
 *                       type: boolean
 *                     status:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
llamaRouter.get(
    '/status',
    // Use optional authentication in development mode
    isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
    llamaVisionController.checkServerStatus
);

/**
 * @swagger
 * /api/llama/model:
 *   get:
 *     summary: Get model information from llama.cpp server
 *     description: Returns information about the currently loaded model in the llama.cpp server
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Llama CPP
 *     responses:
 *       200:
 *         description: Model information
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
llamaRouter.get(
    '/model',
    // Use optional authentication in development mode
    isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
    llamaVisionController.getModelInfo
);

/**
 * @swagger
 * /api/llama/models:
 *   get:
 *     summary: Get available multimodal models
 *     description: Returns the list of available multimodal models for image description
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Llama CPP
 *     responses:
 *       200:
 *         description: List of available models
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
llamaRouter.get(
    '/models',
    // Use optional authentication in development mode
    isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
    llamaVisionController.getAvailableModels
);

/**
 * @swagger
 * /api/llama/describe-image:
 *   post:
 *     summary: Generate a description for an image using llama.cpp
 *     description: Upload an image to get an AI-generated description using InternVL3 or SmolVLM models
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Llama CPP
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: Model ID to use (e.g., 'internvl3-1b', 'smolvlm-500m')
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
llamaRouter.post(
    '/describe-image',
    // Use optional authentication in development mode
    isDevelopment ? optionalAuthenticateJWT : authenticateJWT,
    upload.single('image'),
    describeImageValidation,
    llamaVisionController.describeImage
); 