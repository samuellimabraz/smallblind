import PrismaService from '../database/prisma-service';
import { User } from '../generated/prisma';

export class UserRepository {
    private prisma;

    constructor() {
        this.prisma = PrismaService.getInstance().prisma;
    }

    /**
     * Find a user by their ID
     */
    public async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id }
        });
    }

    /**
     * Find a user by their username
     */
    public async findByUsername(username: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { username }
        });
    }

    /**
     * Find a user by their email
     */
    public async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email }
        });
    }

    /**
     * Create a new user
     */
    public async create(userData: {
        username: string;
        email: string;
        passwordHash: string;
    }): Promise<User> {
        return this.prisma.user.create({
            data: userData
        });
    }

    /**
     * Update a user's information
     */
    public async update(id: string, userData: Partial<User>): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data: userData
        });
    }

    /**
     * Delete a user
     */
    public async delete(id: string): Promise<User> {
        return this.prisma.user.delete({
            where: { id }
        });
    }

    /**
     * Find all users
     */
    public async findAll(): Promise<User[]> {
        return this.prisma.user.findMany();
    }

    /**
     * Update a user's last login timestamp
     */
    public async updateLastLogin(id: string): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data: { lastLogin: new Date() }
        });
    }

    /**
     * Update a user's password
     */
    public async updatePassword(id: string, passwordHash: string): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data: { passwordHash }
        });
    }
} 