import PrismaService from '../database/prisma-service';

export class UserProfileService {
    private prisma: PrismaService;

    constructor() {
        this.prisma = PrismaService.getInstance();
    }

    /**
     * Get a user profile by ID
     * @param userId User ID
     */
    async getUserProfile(userId: string) {
        try {
            return await this.prisma.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    AppSettings: true,
                },
            });
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw error;
        }
    }

    /**
     * Update a user profile
     * @param userId User ID
     * @param data Data to update
     */
    async updateUserProfile(userId: string, data: any) {
        try {
            return await this.prisma.prisma.user.update({
                where: { id: userId },
                data,
            });
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    /**
     * Get user settings
     * @param userId User ID
     */
    async getSettings(userId: string) {
        try {
            return await this.prisma.prisma.appSettings.findUnique({
                where: { userId },
            });
        } catch (error) {
            console.error('Error getting user settings:', error);
            throw error;
        }
    }

    /**
     * Update user settings
     * @param userId User ID
     * @param settings Settings to update
     */
    async updateSettings(userId: string, settings: any) {
        try {
            const existingSettings = await this.prisma.prisma.appSettings.findUnique({
                where: { userId },
            });

            if (existingSettings) {
                return await this.prisma.prisma.appSettings.update({
                    where: { userId },
                    data: settings,
                });
            } else {
                return await this.prisma.prisma.appSettings.create({
                    data: {
                        ...settings,
                        userId,
                    },
                });
            }
        } catch (error) {
            console.error('Error updating user settings:', error);
            throw error;
        }
    }

    /**
     * Get session history for a user
     * @param userId User ID
     */
    async getSessionHistory(userId: string) {
        try {
            return await this.prisma.prisma.session.findMany({
                where: { userId },
                orderBy: {
                    startTime: 'desc',
                },
            });
        } catch (error) {
            console.error('Error getting session history:', error);
            throw error;
        }
    }
    
    /**
     * Delete a user account and all related data
     * @param userId User ID
     */
    async deleteUserAccount(userId: string) {
        try {
            // Prisma will cascade delete related records due to onDelete: Cascade
            await this.prisma.prisma.user.delete({
                where: { id: userId },
            });
        } catch (error) {
            console.error('Error deleting user account:', error);
            throw error;
        }
    }
} 