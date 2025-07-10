import { Request, Response } from 'express';
import { SessionRepository } from '../repositories/SessionRepository';
import { AuthRequest } from '../middlewares/authMiddleware';

export class SessionController {
    private sessionRepository: SessionRepository;

    constructor() {
        this.sessionRepository = new SessionRepository();
    }

    /**
     * Get all sessions for a user
     * @param req Request
     * @param res Response
     */
    async getSessions(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            const sessions = await this.sessionRepository.findByUserId(userId);

            res.status(200).json({ sessions });
        } catch (error) {
            console.error('Error getting sessions:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Get a specific session by ID
     * @param req Request
     * @param res Response
     */
    async getSession(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            const sessionId = req.params.id;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            if (!sessionId) {
                res.status(400).json({ message: 'Session ID is required' });
                return;
            }

            const session = await this.sessionRepository.findById(sessionId);

            if (!session) {
                res.status(404).json({ message: 'Session not found' });
                return;
            }

            // Check if the session belongs to the authenticated user
            if (session.userId !== userId) {
                res.status(403).json({ message: 'Forbidden' });
                return;
            }

            res.status(200).json({ session });
        } catch (error) {
            console.error('Error getting session:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Create a new session
     * @param req Request
     * @param res Response
     */
    async createSession(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            const { deviceInfo } = req.body;

            const session = await this.sessionRepository.create({
                userId,
                startTime: new Date(),
                endTime: null,
                deviceInfo: deviceInfo || {},
            });

            res.status(201).json({
                message: 'Session created successfully',
                session,
            });
        } catch (error) {
            console.error('Error creating session:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * End a session
     * @param req Request
     * @param res Response
     */
    async endSession(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            const sessionId = req.params.id;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            if (!sessionId) {
                res.status(400).json({ message: 'Session ID is required' });
                return;
            }

            const session = await this.sessionRepository.findById(sessionId);

            if (!session) {
                res.status(404).json({ message: 'Session not found' });
                return;
            }

            // Check if the session belongs to the authenticated user
            if (session.userId !== userId) {
                res.status(403).json({ message: 'Forbidden' });
                return;
            }

            // Check if the session is already ended
            if (session.endTime) {
                res.status(400).json({ message: 'Session already ended' });
                return;
            }

            const updatedSession = await this.sessionRepository.endSession(sessionId);

            res.status(200).json({
                message: 'Session ended successfully',
                session: updatedSession,
            });
        } catch (error) {
            console.error('Error ending session:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Delete a session
     * @param req Request
     * @param res Response
     */
    async deleteSession(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            const sessionId = req.params.id;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            if (!sessionId) {
                res.status(400).json({ message: 'Session ID is required' });
                return;
            }

            const session = await this.sessionRepository.findById(sessionId);

            if (!session) {
                res.status(404).json({ message: 'Session not found' });
                return;
            }

            // Check if the session belongs to the authenticated user
            if (session.userId !== userId) {
                res.status(403).json({ message: 'Forbidden' });
                return;
            }

            await this.sessionRepository.delete(sessionId);

            res.status(200).json({
                message: 'Session deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting session:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
} 