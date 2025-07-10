import PrismaService from '../database/prisma-service';
import { Session, Prisma } from '../generated/prisma';

export class SessionRepository {
    private prisma: PrismaService;

    constructor() {
        this.prisma = PrismaService.getInstance();
    }

    /**
     * Find a session by ID
     * @param id Session ID
     */
    async findById(id: string): Promise<Session | null> {
        return this.prisma.prisma.session.findUnique({
            where: { id },
        });
    }

    /**
     * Find sessions by user ID
     * @param userId User ID
     */
    async findByUserId(userId: string): Promise<Session[]> {
        return this.prisma.prisma.session.findMany({
            where: { userId },
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
        endTime?: Date | null;
        deviceInfo: any;
    }): Promise<Session> {
        return this.prisma.prisma.session.create({
            data: {
                userId: sessionData.userId,
                startTime: sessionData.startTime,
                endTime: sessionData.endTime || null,
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
} 