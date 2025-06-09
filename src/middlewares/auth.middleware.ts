import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';

// Extend Express Request
export interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
        email: string;
    };
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Get auth header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized - No token provided'
            });
            return;
        }

        // Extract token from header
        const token = authHeader.split(' ')[1];

        // Get JWT secret from environment
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            console.error('JWT_SECRET not configured in environment');
            res.status(500).json({
                success: false,
                error: 'Server configuration error'
            });
            return;
        }

        // Verify token
        const decoded = jwt.verify(token, jwtSecret) as { id: string; username: string; email: string };

        // Check if user exists in database
        const userRepo = new UserRepository();
        const user = await userRepo.findById(decoded.id);

        if (!user) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized - User not found'
            });
            return;
        }

        // Attach user to request
        req.user = {
            id: decoded.id,
            username: decoded.username,
            email: decoded.email
        };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized - Invalid token'
            });
        } else {
            console.error('Authentication error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
};

/**
 * Optional authentication - doesn't return error if no token, just continues without user
 */
export const optionalAuthenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Get auth header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token, continue without user
            next();
            return;
        }

        // Extract token from header
        const token = authHeader.split(' ')[1];

        // Get JWT secret from environment
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            // No secret, continue without user
            next();
            return;
        }

        // Verify token
        const decoded = jwt.verify(token, jwtSecret) as { id: string; username: string; email: string };

        // Check if user exists in database
        const userRepo = new UserRepository();
        const user = await userRepo.findById(decoded.id);

        if (user) {
            // Attach user to request
            req.user = {
                id: decoded.id,
                username: decoded.username,
                email: decoded.email
            };
        }

        next();
    } catch (error) {
        // On error, just continue without user
        next();
    }
}; 