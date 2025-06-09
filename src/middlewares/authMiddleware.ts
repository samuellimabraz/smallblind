import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Interface for request with user data
export interface AuthRequest extends Request {
    user?: any;
}

/**
 * Middleware to protect routes by validating JWT tokens
 * @param req Request object
 * @param res Response object
 * @param next Next function
 */
export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization header missing' });
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Invalid authorization format' });
    }

    const token = tokenParts[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'Token expired' });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Optional JWT authentication middleware - proceeds if token is missing
 * @param req Request object
 * @param res Response object
 * @param next Next function
 */
export const optionalAuthenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return next();
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return next();
    }

    const token = tokenParts[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
    } catch (error) {
        // Invalid token, but we don't fail the request
    }

    next();
}; 