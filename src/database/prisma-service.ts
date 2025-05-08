import { PrismaClient } from '../generated/prisma';

/**
 * PrismaService provides a singleton instance of PrismaClient
 * to be used throughout the application.
 */
class PrismaService {
    private static instance: PrismaService;
    private _prisma: PrismaClient;

    private constructor() {
        this._prisma = new PrismaClient({
            log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
    }

    /**
     * Get the singleton instance of PrismaService
     */
    public static getInstance(): PrismaService {
        if (!PrismaService.instance) {
            PrismaService.instance = new PrismaService();
        }
        return PrismaService.instance;
    }

    /**
     * Get the PrismaClient instance
     */
    public get prisma(): PrismaClient {
        return this._prisma;
    }

    /**
     * Connect to the database
     */
    public async connect(): Promise<void> {
        try {
            await this._prisma.$connect();
            console.log('Database connection established');
        } catch (error) {
            console.error('Failed to connect to database:', error);
            throw error;
        }
    }

    /**
     * Disconnect from the database
     */
    public async disconnect(): Promise<void> {
        await this._prisma.$disconnect();
        console.log('Database connection closed');
    }
}

export default PrismaService; 