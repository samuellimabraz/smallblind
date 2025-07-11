import PrismaService from '../database/prisma-service';
import { User } from '../generated/prisma';
import { randomUUID } from 'crypto';
export class UserRepository {
    private prisma: PrismaService;

    constructor() {
        this.prisma = PrismaService.getInstance();
    }

    /**
     * Find a user by ID
     * @param id User ID
     */
    async findById(id: string): Promise<User | null> {
        return this.prisma.prisma.user.findUnique({
            where: { id },
        });
    }

    /**
     * Find a user by username
     * @param username Username
     */
    async findByUsername(username: string): Promise<User | null> {
        return this.prisma.prisma.user.findUnique({
            where: { username },
        });
    }

    /**
     * Find a user by email
     * @param email Email address
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.prisma.user.findUnique({
            where: { email },
        });
    }

    /**
     * Create a new user
     * @param userData User data
     */
    async create(userData: Omit<User, 'id'>): Promise<User> {
        return this.prisma.prisma.user.create({
            data: {
                ...userData,
                id: randomUUID(),
            }
        });
    }

    /**
     * Update a user
     * @param id User ID
     * @param userData Updated user data
     */
    async update(id: string, userData: Partial<User>): Promise<User> {
        return this.prisma.prisma.user.update({
            where: { id },
            data: userData,
        });
    }

    /**
     * Delete a user
     * @param id User ID
     */
    async delete(id: string): Promise<User> {
        return this.prisma.prisma.user.delete({
            where: { id },
        });
    }

    /**
     * Find all users
     */
    async findAll(): Promise<User[]> {
        return this.prisma.prisma.user.findMany();
    }

    /**
     * Update last login time
     * @param id User ID
     */
    async updateLastLogin(id: string): Promise<User> {
        return this.prisma.prisma.user.update({
            where: { id },
            data: {
                lastLogin: new Date(),
            },
        });
    }

    /**
     * Update user's password
     * @param id User ID
     * @param passwordHash New password hash
     */
    async updatePassword(id: string, passwordHash: string): Promise<User> {
        return this.prisma.prisma.user.update({
            where: { id },
            data: {
                passwordHash,
            },
        });
    }
} 