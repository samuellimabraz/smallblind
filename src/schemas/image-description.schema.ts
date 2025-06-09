import { query } from 'express-validator';

export const describeImageValidation = [
    query('model')
        .optional()
        .isString()
        .withMessage('Model must be a string'),

    query('prompt')
        .optional()
        .isString()
        .withMessage('Prompt must be a string'),

    query('maxNewTokens')
        .optional()
        .isInt({ min: 10, max: 1000 })
        .withMessage('Max tokens must be an integer between 10 and 1000'),

    query('doSample')
        .optional()
        .isBoolean()
        .withMessage('doSample must be a boolean')
];

/**
 * @swagger
 * components:
 *   schemas:
 *     ImageDescriptionResponse:
 *       type: object
 *       properties:
 *         description:
 *           type: string
 *           description: The generated description of the image
 *         processingTime:
 *           type: number
 *           description: Processing time in milliseconds
 *         model:
 *           type: string
 *           description: Model used for description (as configured on llama.cpp server)
 *         prompt:
 *           type: string
 *           description: Prompt used to generate the description
 */ 