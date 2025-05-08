import PrismaService from '../database/prisma-service';
import { UserProfileService } from '../services/UserProfileService';

async function testPrisma() {
    try {
        console.log('Starting Prisma test...');

        // Get the PrismaService instance
        const prismaService = PrismaService.getInstance();

        // Connect to the database
        await prismaService.connect();
        console.log('Connected to the database successfully');

        // Initialize the UserProfileService
        const userProfileService = new UserProfileService();

        // Fetch all users
        const users = await prismaService.prisma.user.findMany();
        console.log(`Found ${users.length} users in the database`);

        if (users.length > 0) {
            const userId = users[0].id;
            console.log(`Getting profile for user: ${userId}`);

            // Get user profile
            const userProfile = await userProfileService.getUserProfile(userId);
            console.log('User profile:', userProfile);

            // Get user settings
            const settings = await userProfileService.getSettings(userId);
            console.log('User settings:', settings);

            // Get user's face embeddings
            const faces = await userProfileService.getSavedFaces(userId);
            console.log(`User has ${faces.length} saved faces`);

            // Get session history
            const sessions = await userProfileService.getSessionHistory(userId);
            console.log(`User has ${sessions.length} sessions`);

            // Count interactions
            const interactionCount = await prismaService.prisma.interaction.count({
                where: { userId },
            });
            console.log(`User has ${interactionCount} interactions`);
        }

        console.log('Prisma test completed successfully');
    } catch (error) {
        console.error('Error during Prisma test:', error);
    } finally {
        // Disconnect from the database
        const prismaService = PrismaService.getInstance();
        await prismaService.disconnect();
    }
}

// Run the test
testPrisma(); 