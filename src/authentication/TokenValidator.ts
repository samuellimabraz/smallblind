import { JWTManager } from './JWTManager';

/**
 * Token validator for verifying authentication tokens
 */
export class TokenValidator {
    private jwtManager: JWTManager;

    constructor(jwtManager: JWTManager) {
        this.jwtManager = jwtManager;
    }

    /**
     * Validate a token
     * @param token Authentication token
     * @param scope Optional permission scopes to check
     */
    public async validate(token: string, scope?: string[]): Promise<boolean> {
        try {
            // Validate token signature and expiration
            const payload = await this.jwtManager.verifyToken(token);

            // If scopes are provided, check if token has the required scopes
            if (scope && scope.length > 0) {
                const tokenScopes = payload.scope || [];

                // Check if token has all required scopes
                const hasAllScopes = scope.every(s => tokenScopes.includes(s));

                if (!hasAllScopes) {
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Token validation failed:', error);
            return false;
        }
    }

    /**
     * Extract user ID from a token
     * @param token Authentication token
     */
    public async getUserId(token: string): Promise<string | null> {
        try {
            const payload = await this.jwtManager.verifyToken(token);
            return payload.sub || null;
        } catch (error) {
            console.error('Failed to extract user ID from token:', error);
            return null;
        }
    }

    /**
     * Extract payload from a token
     * @param token Authentication token
     */
    public async getPayload(token: string): Promise<any | null> {
        try {
            return await this.jwtManager.verifyToken(token);
        } catch (error) {
            console.error('Failed to extract payload from token:', error);
            return null;
        }
    }
} 