import { User as PrismaUser } from '../generated/prisma';

// Extend the Prisma User type if needed or simply re-export it
export type User = PrismaUser;

// You can also define additional types related to users here
export interface UserWithoutPassword extends Omit<User, 'passwordHash'> {
    // Add any additional fields if needed
}

export interface CreateUserData {
    username: string;
    email: string;
    passwordHash: string;
} 