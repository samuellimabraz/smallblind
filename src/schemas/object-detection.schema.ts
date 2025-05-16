import { query } from 'express-validator';

export const detectObjectsValidation = [
    query('model')
        .optional()
        .isString()
        .withMessage('Model must be a string'),

    query('threshold')
        .optional()
        .isFloat({ min: 0, max: 1 })
        .withMessage('Threshold must be a float between 0 and 1'),

    query('maxObjects')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Max objects must be an integer between 1 and 100'),

    query('dtype')
        .optional()
        .isString()
        .withMessage('dtype must be a string')
];

/**
 * @swagger
 * components:
 *   schemas:
 *     BoundingBox:
 *       type: object
 *       properties:
 *         xmin:
 *           type: number
 *           description: The X coordinate of the top-left corner
 *         ymin:
 *           type: number
 *           description: The Y coordinate of the top-left corner
 *         xmax:
 *           type: number
 *           description: The X coordinate of the bottom-right corner
 *         ymax:
 *           type: number
 *           description: The Y coordinate of the bottom-right corner
 *         width:
 *           type: number
 *           description: Width of the bounding box
 *         height:
 *           type: number
 *           description: Height of the bounding box
 *
 *     DetectionResult:
 *       type: object
 *       properties:
 *         box:
 *           $ref: '#/components/schemas/BoundingBox'
 *         score:
 *           type: number
 *           description: Confidence score (0-1)
 *         label:
 *           type: string
 *           description: Object class label
 *         class:
 *           type: number
 *           description: Numeric class identifier
 *
 *     DetectionResponse:
 *       type: object
 *       properties:
 *         detections:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DetectionResult'
 *         processingTime:
 *           type: number
 *           description: Processing time in milliseconds
 *         model:
 *           type: string
 *           description: Model used for detection
 *         dtype:
 *           type: string
 *           description: Quantization level used (fp32, fp16, q8, q4, q2)
 */ 