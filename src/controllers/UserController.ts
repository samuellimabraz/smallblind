import { Request, Response } from 'express';
import { UserRepository } from '../repositories/UserRepository';
import { AuthRequest } from '../middlewares/authMiddleware';
import PrismaService from '../database/prisma-service';

export class UserController {
    private userRepository: UserRepository;
    private prisma: PrismaService;

    constructor() {
        this.userRepository = new UserRepository();
        this.prisma = PrismaService.getInstance();
    }

    /**
     * Get user profile
     * @param req Request
     * @param res Response
     */
    async getProfile(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.params.id || req.user?.id;

            if (!userId) {
                res.status(400).json({ message: 'User ID is required' });
                return;
            }

            // Check if user is requesting their own profile or is an admin
            if (req.params.id && req.user?.id !== req.params.id) {
                res.status(403).json({ message: 'Forbidden' });
                return;
            }

            const user = await this.userRepository.findById(userId);

            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }

            // Get user settings
            const settings = await this.prisma.prisma.appSettings.findUnique({
                where: { userId },
            });

            res.status(200).json({
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin,
                },
                settings,
            });
        } catch (error) {
            console.error('Error getting user profile:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Update user profile
     * @param req Request
     * @param res Response
     */
    async updateProfile(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.params.id || req.user?.id;

            if (!userId) {
                res.status(400).json({ message: 'User ID is required' });
                return;
            }

            // Check if user is updating their own profile or is an admin
            if (req.params.id && req.user?.id !== req.params.id) {
                res.status(403).json({ message: 'Forbidden' });
                return;
            }

            const { username, email } = req.body;
            const updateData: any = {};

            if (username) {
                // Check if username is already taken
                const existingUsername = await this.userRepository.findByUsername(username);
                if (existingUsername && existingUsername.id !== userId) {
                    res.status(409).json({ message: 'Username already exists' });
                    return;
                }
                updateData.username = username;
            }

            if (email) {
                // Check if email is already taken
                const existingEmail = await this.userRepository.findByEmail(email);
                if (existingEmail && existingEmail.id !== userId) {
                    res.status(409).json({ message: 'Email already exists' });
                    return;
                }
                updateData.email = email;
            }

            // Update user if there are fields to update
            if (Object.keys(updateData).length > 0) {
                const updatedUser = await this.userRepository.update(userId, updateData);

                res.status(200).json({
                    message: 'Profile updated successfully',
                    user: {
                        id: updatedUser.id,
                        username: updatedUser.username,
                        email: updatedUser.email,
                        createdAt: updatedUser.createdAt,
                        lastLogin: updatedUser.lastLogin,
                    },
                });
            } else {
                res.status(400).json({ message: 'No fields to update' });
            }
        } catch (error) {
            console.error('Error updating user profile:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Get user settings
     * @param req Request
     * @param res Response
     */
    async getSettings(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            const settings = await this.prisma.prisma.appSettings.findUnique({
                where: { userId },
            });

            if (!settings) {
                res.status(404).json({ message: 'Settings not found' });
                return;
            }

            res.status(200).json({ settings });
        } catch (error) {
            console.error('Error getting user settings:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Update user settings
     * @param req Request
     * @param res Response
     */
    async updateSettings(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            const {
                voiceId, speechRate, speechPitch,
                detectionThreshold, detectionMode,
                language, theme, notificationsEnabled,
                highContrast, largeText, audioDescriptions, hapticFeedback
            } = req.body;

            const updateData: any = {};

            // Add fields to update data if they exist in the request
            if (voiceId !== undefined) updateData.voiceId = voiceId;
            if (speechRate !== undefined) updateData.speechRate = speechRate;
            if (speechPitch !== undefined) updateData.speechPitch = speechPitch;
            if (detectionThreshold !== undefined) updateData.detectionThreshold = detectionThreshold;
            if (detectionMode !== undefined) updateData.detectionMode = detectionMode;
            if (language !== undefined) updateData.language = language;
            if (theme !== undefined) updateData.theme = theme;
            if (notificationsEnabled !== undefined) updateData.notificationsEnabled = notificationsEnabled;
            if (highContrast !== undefined) updateData.highContrast = highContrast;
            if (largeText !== undefined) updateData.largeText = largeText;
            if (audioDescriptions !== undefined) updateData.audioDescriptions = audioDescriptions;
            if (hapticFeedback !== undefined) updateData.hapticFeedback = hapticFeedback;

            // Check if settings exist
            const existingSettings = await this.prisma.prisma.appSettings.findUnique({
                where: { userId },
            });

            let settings;

            if (existingSettings) {
                // Update existing settings
                settings = await this.prisma.prisma.appSettings.update({
                    where: { userId },
                    data: updateData,
                });
            } else {
                // Create new settings
                settings = await this.prisma.prisma.appSettings.create({
                    data: {
                        ...updateData,
                        userId,
                    },
                });
            }

            res.status(200).json({
                message: 'Settings updated successfully',
                settings,
            });
        } catch (error) {
            console.error('Error updating user settings:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Delete user account
     * @param req Request
     * @param res Response
     */
    async deleteAccount(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            // Delete user
            await this.userRepository.delete(userId);

            res.status(200).json({
                message: 'Account deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting user account:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
} 