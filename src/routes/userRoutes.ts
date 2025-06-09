import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();
const userController = new UserController();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile with settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     lastLogin:
 *                       type: string
 *                       format: date-time
 *                 settings:
 *                   type: object
 *       400:
 *         description: Missing user ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/profile', authenticateJWT, (req, res) => userController.getProfile(req, res));

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     lastLogin:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: No fields to update
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Username or email already exists
 *       500:
 *         description: Internal server error
 */
router.put('/profile', authenticateJWT, (req, res) => userController.updateProfile(req, res));

/**
 * @swagger
 * /api/users/settings:
 *   get:
 *     summary: Get user's settings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 settings:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Settings not found
 *       500:
 *         description: Internal server error
 */
router.get('/settings', authenticateJWT, (req, res) => userController.getSettings(req, res));

/**
 * @swagger
 * /api/users/settings:
 *   put:
 *     summary: Update user's settings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               voiceId:
 *                 type: string
 *               speechRate:
 *                 type: number
 *               speechPitch:
 *                 type: number
 *               detectionThreshold:
 *                 type: number
 *               detectionMode:
 *                 type: string
 *               language:
 *                 type: string
 *               theme:
 *                 type: string
 *               notificationsEnabled:
 *                 type: boolean
 *               highContrast:
 *                 type: boolean
 *               largeText:
 *                 type: boolean
 *               audioDescriptions:
 *                 type: boolean
 *               hapticFeedback:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 settings:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/settings', authenticateJWT, (req, res) => userController.updateSettings(req, res));

/**
 * @swagger
 * /api/users/account:
 *   delete:
 *     summary: Delete user's account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/account', authenticateJWT, (req, res) => userController.deleteAccount(req, res));

export { router as userRouter }; 