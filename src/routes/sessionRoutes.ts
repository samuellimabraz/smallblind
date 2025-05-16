import { Router } from 'express';
import { SessionController } from '../controllers/SessionController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();
const sessionController = new SessionController();

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Get all sessions for the authenticated user
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                       endTime:
 *                         type: string
 *                         format: date-time
 *                       deviceInfo:
 *                         type: object
 *                       interactions:
 *                         type: array
 *                         items:
 *                           type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', authenticateJWT, (req, res) => sessionController.getSessions(req, res));

/**
 * @swagger
 * /api/sessions/{id}:
 *   get:
 *     summary: Get a specific session by ID
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *                     deviceInfo:
 *                       type: object
 *                     interactions:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Missing session ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', authenticateJWT, (req, res) => sessionController.getSession(req, res));

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Create a new session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceInfo:
 *                 type: object
 *                 description: Information about the device
 *     responses:
 *       201:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     deviceInfo:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', authenticateJWT, (req, res) => sessionController.createSession(req, res));

/**
 * @swagger
 * /api/sessions/{id}/end:
 *   put:
 *     summary: End a session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 session:
 *                   type: object
 *       400:
 *         description: Missing session ID or session already ended
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/end', authenticateJWT, (req, res) => sessionController.endSession(req, res));

/**
 * @swagger
 * /api/sessions/{id}:
 *   delete:
 *     summary: Delete a session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing session ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authenticateJWT, (req, res) => sessionController.deleteSession(req, res));

/**
 * @swagger
 * /api/sessions/{id}/interactions:
 *   post:
 *     summary: Add an interaction to a session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 description: Type of interaction
 *               input:
 *                 type: object
 *                 description: Input data
 *               output:
 *                 type: object
 *                 description: Output data
 *               duration:
 *                 type: integer
 *                 description: Duration in milliseconds
 *     responses:
 *       201:
 *         description: Interaction added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 interaction:
 *                   type: object
 *       400:
 *         description: Missing session ID, interaction type, or session is ended
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/interactions', authenticateJWT, (req, res) => sessionController.addInteraction(req, res));

/**
 * @swagger
 * /api/sessions/{id}/interactions:
 *   get:
 *     summary: Get interactions for a session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: List of interactions for the session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 interactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       sessionId:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       type:
 *                         type: string
 *                       input:
 *                         type: object
 *                       output:
 *                         type: object
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       duration:
 *                         type: integer
 *       400:
 *         description: Missing session ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/interactions', authenticateJWT, (req, res) => sessionController.getInteractions(req, res));

export { router as sessionRouter }; 