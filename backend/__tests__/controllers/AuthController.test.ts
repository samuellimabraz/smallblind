import { AuthController } from '../../src/controllers/AuthController';
import { UserRepository } from '../../src/repositories/UserRepository';
import { SessionRepository } from '../../src/repositories/SessionRepository';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../../src/repositories/UserRepository');
jest.mock('../../src/repositories/SessionRepository');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthController', () => {
    let authController: AuthController;
    let mockUserRepository: jest.Mocked<UserRepository>;
    let mockSessionRepository: jest.Mocked<SessionRepository>;
    let mockRequest: any;
    let mockResponse: any;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup mocks
        mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
        mockSessionRepository = new SessionRepository() as jest.Mocked<SessionRepository>;

        // Mock environment variables
        process.env.JWT_SECRET = 'test-jwt-secret';
        process.env.JWT_EXPIRATION = '3600';

        // Create AuthController instance with mocked repositories
        authController = new AuthController();
        (authController as any).userRepository = mockUserRepository;
        (authController as any).sessionRepository = mockSessionRepository;

        // Setup request and response mocks
        mockRequest = {
            body: {},
            user: { id: 'user-123' },
            headers: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            // Setup test data
            const testUser = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            };

            mockRequest.body = testUser;

            // Mock repository methods
            mockUserRepository.findByUsername = jest.fn().mockResolvedValue(null);
            mockUserRepository.findByEmail = jest.fn().mockResolvedValue(null);

            const passwordHash = 'hashed_password';
            (bcrypt.hash as jest.Mock).mockResolvedValue(passwordHash);

            const createdUser = {
                id: 'user-123',
                username: testUser.username,
                email: testUser.email,
                passwordHash,
                createdAt: new Date(),
                lastLogin: new Date(),
            };
            mockUserRepository.create = jest.fn().mockResolvedValue(createdUser);

            const token = 'generated-jwt-token';
            (jwt.sign as jest.Mock).mockReturnValue(token);

            // Call the method
            await authController.register(mockRequest, mockResponse);

            // Assertions
            expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(testUser.username);
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(testUser.email);
            expect(bcrypt.hash).toHaveBeenCalledWith(testUser.password, 10);
            expect(mockUserRepository.create).toHaveBeenCalledWith({
                username: testUser.username,
                email: testUser.email,
                passwordHash,
                createdAt: expect.any(Date),
                lastLogin: expect.any(Date),
            });
            expect(jwt.sign).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'User registered successfully',
                token,
                user: {
                    id: createdUser.id,
                    username: createdUser.username,
                    email: createdUser.email,
                },
            });
        });

        it('should return 400 if required fields are missing', async () => {
            // Setup with missing fields
            mockRequest.body = { username: 'testuser' };

            // Call the method
            await authController.register(mockRequest, mockResponse);

            // Assertions
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Missing required fields',
            });
        });

        // Additional tests can be added for other scenarios
    });

}); 