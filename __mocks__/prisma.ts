// Mock for Prisma client
const mockPrismaClient = {
    user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    session: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    interaction: {
        findMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
    },
    appSettings: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
};

export const PrismaClient = jest.fn(() => mockPrismaClient);

// Mock for JsonValue type
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject { [Key: string]: JsonValue }
export interface JsonArray extends Array<JsonValue> { }

// Mock for Prisma generated types
export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    lastLogin: Date | null;
}

export interface Session {
    id: string;
    userId: string;
    startTime: Date;
    endTime: Date | null;
    deviceInfo: JsonValue;
}

export interface Interaction {
    id: string;
    sessionId: string;
    userId: string;
    type: string;
    input: JsonValue | null;
    output: JsonValue | null;
    timestamp: Date;
    duration: number | null;
}

// Export the mock client as default
export default { prisma: mockPrismaClient }; 