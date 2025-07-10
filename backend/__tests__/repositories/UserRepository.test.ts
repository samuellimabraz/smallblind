import { UserRepository } from '../../src/repositories/UserRepository';
import PrismaService from '../../src/database/prisma-service';

// Mock PrismaService
jest.mock('../../src/database/prisma-service', () => {
    return {
        __esModule: true,
        default: {
            getInstance: jest.fn().mockReturnValue({
                prisma: {
                    user: {
                        findUnique: jest.fn(),
                        findMany: jest.fn(),
                        create: jest.fn(),
                        update: jest.fn(),
                        delete: jest.fn(),
                    },
                },
                connect: jest.fn(),
                disconnect: jest.fn(),
            }),
        },
    };
});

describe('UserRepository', () => {
    let userRepository: UserRepository;
    let prismaService: ReturnType<typeof PrismaService.getInstance>;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        userRepository = new UserRepository();
        prismaService = PrismaService.getInstance();
    });

    describe('findById', () => {
        it('should call findUnique with the correct parameters', async () => {
            const userId = 'test-user-id';
            const expectedUser = {
                id: userId,
                username: 'testuser',
                email: 'test@example.com',
                passwordHash: 'hashedpassword',
                createdAt: new Date(),
                lastLogin: new Date(),
            };

            // Mock the findUnique method to return a user
            prismaService.prisma.user.findUnique = jest.fn().mockResolvedValue(expectedUser);

            const result = await userRepository.findById(userId);

            // Verify findUnique was called with the correct parameters
            expect(prismaService.prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: userId },
            });

            // Verify the result is the expected user
            expect(result).toEqual(expectedUser);
        });

        it('should return null when user is not found', async () => {
            const userId = 'non-existent-id';

            // Mock the findUnique method to return null
            prismaService.prisma.user.findUnique = jest.fn().mockResolvedValue(null);

            const result = await userRepository.findById(userId);

            // Verify findUnique was called with the correct parameters
            expect(prismaService.prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: userId },
            });

            // Verify the result is null
            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should call create with the correct parameters', async () => {
            const userData = {
                username: 'newuser',
                email: 'new@example.com',
                passwordHash: 'hashedpass',
                createdAt: new Date(),
                lastLogin: null,
            };

            const createdUser = {
                id: 'new-user-id',
                ...userData,
            };

            // Mock the create method to return a user
            prismaService.prisma.user.create = jest.fn().mockResolvedValue(createdUser);

            const result = await userRepository.create(userData);

            // Verify create was called with the correct parameters
            expect(prismaService.prisma.user.create).toHaveBeenCalledWith({
                data: userData,
            });

            // Verify the result is the created user
            expect(result).toEqual(createdUser);
        });
    });

}); 