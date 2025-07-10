import { IDBConnector } from '../interfaces/IDBConnector';
import PrismaService from './prisma-service';

/**
 * PostgresConnector is an implementation of IDBConnector for PostgreSQL
 * using Prisma ORM
 */
export class PostgresConnector implements IDBConnector {
    private prismaService: PrismaService;
    private isConnected: boolean = false;

    constructor() {
        this.prismaService = PrismaService.getInstance();
    }

    /**
     * Connect to the PostgreSQL database
     */
    public async connect(): Promise<boolean> {
        try {
            await this.prismaService.connect();
            this.isConnected = true;
            return true;
        } catch (error) {
            console.error('Failed to connect to PostgreSQL:', error);
            return false;
        }
    }

    /**
     * Disconnect from the PostgreSQL database
     */
    public async disconnect(): Promise<boolean> {
        try {
            await this.prismaService.disconnect();
            this.isConnected = false;
            return true;
        } catch (error) {
            console.error('Failed to disconnect from PostgreSQL:', error);
            return false;
        }
    }

    /**
     * Perform a query on the specified model
     * @param model The model name to query
     * @param criteria Query criteria
     * @param options Additional query options
     */
    public async query(model: string, criteria: any, options?: any): Promise<any[]> {
        if (!this.isConnected) {
            await this.connect();
        }

        const prisma = this.prismaService.prisma as any;

        try {
            return await prisma[model].findMany({
                where: criteria,
                ...options,
            });
        } catch (error) {
            console.error(`Error querying ${model}:`, error);
            throw error;
        }
    }

    /**
     * Insert a document into the specified model
     * @param model The model name
     * @param document The document to insert
     */
    public async insert(model: string, document: any): Promise<any> {
        if (!this.isConnected) {
            await this.connect();
        }

        const prisma = this.prismaService.prisma as any;

        try {
            return await prisma[model].create({
                data: document,
            });
        } catch (error) {
            console.error(`Error inserting into ${model}:`, error);
            throw error;
        }
    }

    /**
     * Update documents in the specified model that match the criteria
     * @param model The model name
     * @param criteria Query criteria for documents to update
     * @param data The data to update
     */
    public async update(model: string, criteria: any, data: any): Promise<any> {
        if (!this.isConnected) {
            await this.connect();
        }

        const prisma = this.prismaService.prisma as any;

        try {
            return await prisma[model].updateMany({
                where: criteria,
                data: data,
            });
        } catch (error) {
            console.error(`Error updating ${model}:`, error);
            throw error;
        }
    }

    /**
     * Delete documents from the specified model that match the criteria
     * @param model The model name
     * @param criteria Query criteria for documents to delete
     */
    public async delete(model: string, criteria: any): Promise<boolean> {
        if (!this.isConnected) {
            await this.connect();
        }

        const prisma = this.prismaService.prisma as any;

        try {
            await prisma[model].deleteMany({
                where: criteria,
            });
            return true;
        } catch (error) {
            console.error(`Error deleting from ${model}:`, error);
            return false;
        }
    }
} 