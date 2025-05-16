import { Request, Response } from 'express';
import { UserRepository } from '../repositories/UserRepository';
import { SessionRepository } from '../repositories/SessionRepository';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middlewares/authMiddleware';

export class AuthController {
    private userRepository: UserRepository;
    private sessionRepository: SessionRepository;
    private jwtSecret: string;
    private jwtExpiration: number;

    constructor() {
        this.userRepository = new UserRepository();
        this.sessionRepository = new SessionRepository();
        this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        this.jwtExpiration = parseInt(process.env.JWT_EXPIRATION || '3600', 10);
    }

    /**
     * Register a new user
     * @param req Request
     * @param res Response
     */
    async register(req: Request, res: Response): Promise<void> {
        try {
            const { username, email, password } = req.body;

            if (!username || !email || !password) {
                res.status(400).json({ message: 'Missing required fields' });
                return;
            }

            // Check if username already exists
            const existingUsername = await this.userRepository.findByUsername(username);
            if (existingUsername) {
                res.status(409).json({ message: 'Username already exists' });
                return;
            }

            // Check if email already exists
            const existingEmail = await this.userRepository.findByEmail(email);
            if (existingEmail) {
                res.status(409).json({ message: 'Email already exists' });
                return;
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create user
            const user = await this.userRepository.create({
                username,
                email,
                passwordHash,
                createdAt: new Date(),
                lastLogin: new Date(),
            });

            // Generate token
            const token = this.generateToken(user);

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
            });
        } catch (error) {
            console.error('Error registering user:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Login a user
     * @param req Request
     * @param res Response
     */
    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password, deviceInfo } = req.body;

            if (!email || !password) {
                res.status(400).json({ message: 'Missing required fields' });
                return;
            }

            const user = await this.userRepository.findByEmail(email);
            if (!user) {
                res.status(400).json({ message: 'Invalid credentials' });
                return;
            }


            const passwordMatch = await bcrypt.compare(password, user.passwordHash);
            if (!passwordMatch) {
                res.status(400).json({ message: 'Invalid credentials' });
                return;
            }

            // Update last login
            await this.userRepository.updateLastLogin(user.id);

            // Create session if deviceInfo is provided
            let session = null;
            if (deviceInfo) {
                session = await this.sessionRepository.create({
                    userId: user.id,
                    startTime: new Date(),
                    endTime: null,
                    deviceInfo
                });
            }

            // Generate token
            const token = this.generateToken(user);

            res.status(200).json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: 'user', // Default role since it's not in the schema
                },
                session: session ? {
                    id: session.id
                } : null
            });
        } catch (error) {
            console.error('Error logging in user:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Logout user and end the current session
     * @param req Request
     * @param res Response
     */
    async logout(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            const sessionId = req.headers['session-id'] as string;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            // End session if session ID is provided
            if (sessionId) {
                const session = await this.sessionRepository.findById(sessionId);

                if (session && session.userId === userId) {
                    await this.sessionRepository.endSession(sessionId);
                }
            }

            res.status(200).json({ message: 'Logout successful' });
        } catch (error) {
            console.error('Error during logout:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Get current user information
     * @param req Request
     * @param res Response
     */
    async getMe(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            const user = await this.userRepository.findById(userId);
            if (!user) {
                res.status(401).json({ message: 'User not found' });
                return;
            }

            res.status(200).json({
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: 'user', 
                    createdAt: user.createdAt,
                    updatedAt: user.createdAt, // Using createdAt as updatedAt is not in schema
                },
            });
        } catch (error) {
            console.error('Error getting user information:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Refresh a token
     * @param req Request
     * @param res Response
     */
    async refreshToken(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            // Find user
            const user = await this.userRepository.findById(userId);
            if (!user) {
                res.status(401).json({ message: 'User not found' });
                return;
            }

            // Generate new token
            const token = this.generateToken(user);

            res.status(200).json({
                token,
            });
        } catch (error) {
            console.error('Error refreshing token:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Change user password
     * @param req Request
     * @param res Response
     */
    async changePassword(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            const { currentPassword, newPassword } = req.body;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            if (!currentPassword || !newPassword) {
                res.status(400).json({ message: 'Current password and new password are required' });
                return;
            }

            if (newPassword.length < 8) {
                res.status(400).json({ message: 'New password must be at least 8 characters long' });
                return;
            }

            const user = await this.userRepository.findById(userId);
            if (!user) {
                res.status(401).json({ message: 'User not found' });
                return;
            }

            // Verify current password
            const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!passwordMatch) {
                res.status(400).json({ message: 'Current password is incorrect' });
                return;
            }

            // Hash new password
            const newPasswordHash = await bcrypt.hash(newPassword, 10);

            // Update password
            await this.userRepository.updatePassword(userId, newPasswordHash);

            res.status(200).json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error('Error changing password:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Get user profile (deprecated, use getMe instead)
     * @param req Request
     * @param res Response
     */
    async getProfile(req: AuthRequest, res: Response): Promise<void> {
        return this.getMe(req, res);
    }

    /**
     * Generate a JWT token for a user
     * @param user User object
     * @returns JWT Token
     */
    private generateToken(user: any): string {
        const payload = {
            id: user.id,
            username: user.username,
            email: user.email,
        };

        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtExpiration,
        });
    }
} 