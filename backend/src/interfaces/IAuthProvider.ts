import { User } from '../data-models/User';

/**
 * Interface for authentication providers in the SmallBlind system
 */
export interface TokenResponse {
    token: string;
    refreshToken?: string;
    expiresIn: number;
    tokenType: string;
}

export interface IAuthProvider {
    /**
     * Authenticate user credentials
     * @param credentials User credentials (username/password, OAuth token, etc.)
     */
    authenticate(credentials: any): Promise<TokenResponse>;

    /**
     * Authorize a token for specific permission scopes
     * @param token Authentication token
     * @param scope Array of permission scopes to check
     */
    authorize(token: string, scope: string[]): Promise<boolean>;

    /**
     * Generate a new token for a user
     * @param user User to generate token for
     */
    generateToken(user: User): Promise<TokenResponse>;

    /**
     * Refresh an existing token
     * @param token Refresh token
     */
    refreshToken(token: string): Promise<TokenResponse>;
} 