import PrismaService from '../database/prisma-service';
import { Session, Interaction, Prisma } from '../generated/prisma';

export interface SessionWithInteractions extends Session {
    interactions: Interaction[];
}

export class SessionRepository {
    private prisma: PrismaService;

    constructor() {
        this.prisma = PrismaService.getInstance();
    }

    /**
     * Find a session by ID
     * @param id Session ID
     */
    async findById(id: string): Promise<SessionWithInteractions | null> {
        return this.prisma.prisma.session.findUnique({
            where: { id },
            include: {
                interactions: true,
            },
        });
    }

    /**
     * Find sessions by user ID
     * @param userId User ID
     */
    async findByUserId(userId: string): Promise<SessionWithInteractions[]> {
        return this.prisma.prisma.session.findMany({
            where: { userId },
            include: {
                interactions: true,
            },
            orderBy: {
                startTime: 'desc',
            },
        });
    }

    /**
     * Create a new session
     * @param sessionData Session data
     */
    async create(sessionData: {
        userId: string;
        startTime: Date;
        endTime: Date | null;
        deviceInfo: any;
    }): Promise<Session> {
        return this.prisma.prisma.session.create({
            data: {
                userId: sessionData.userId,
                startTime: sessionData.startTime,
                endTime: sessionData.endTime,
                deviceInfo: sessionData.deviceInfo as Prisma.InputJsonValue,
            },
        });
    }

    /**
     * Update a session
     * @param id Session ID
     * @param sessionData Updated session data
     */
    async update(id: string, sessionData: {
        endTime?: Date | null;
        deviceInfo?: any;
    }): Promise<Session> {
        const updateData: Prisma.SessionUpdateInput = {};

        if (sessionData.endTime !== undefined) {
            updateData.endTime = sessionData.endTime;
        }

        if (sessionData.deviceInfo !== undefined) {
            updateData.deviceInfo = sessionData.deviceInfo as Prisma.InputJsonValue;
        }

        return this.prisma.prisma.session.update({
            where: { id },
            data: updateData,
        });
    }

    /**
     * Delete a session
     * @param id Session ID
     */
    async delete(id: string): Promise<Session> {
        return this.prisma.prisma.session.delete({
            where: { id },
        });
    }

    /**
     * Find all sessions
     */
    async findAll(): Promise<Session[]> {
        return this.prisma.prisma.session.findMany({
            orderBy: {
                startTime: 'desc',
            },
        });
    }

    /**
     * End a session (update endTime)
     * @param id Session ID
     */
    async endSession(id: string): Promise<Session> {
        return this.prisma.prisma.session.update({
            where: { id },
            data: {
                endTime: new Date(),
            },
        });
    }

    /**
     * Add an interaction to a session
     * @param sessionId Session ID
     * @param interactionData Interaction data
     */
    async addInteraction(sessionId: string, interactionData: {
        userId: string;
        type: string;
        input?: any;
        output?: any;
        timestamp?: Date;
        duration?: number | null;
    }): Promise<Interaction> {
        return this.prisma.prisma.interaction.create({
            data: {
                sessionId,
                userId: interactionData.userId,
                type: interactionData.type,
                input: interactionData.input as Prisma.InputJsonValue,
                output: interactionData.output as Prisma.InputJsonValue,
                timestamp: interactionData.timestamp || new Date(),
                duration: interactionData.duration || null,
            },
        });
    }

    /**
     * Get interactions for a session
     * @param sessionId Session ID
     */
    async getInteractions(sessionId: string): Promise<Interaction[]> {
        return this.prisma.prisma.interaction.findMany({
            where: { sessionId },
            orderBy: {
                timestamp: 'asc',
            },
        });
    }
} 