import { IAuthProvider } from '../interfaces/IAuthProvider';
import { JWTManager } from './JWTManager';
import { OAuthManager } from './OAuthManager';
import { TokenValidator } from './TokenValidator';

export interface AuthManagerConfig {
    jwtSecret: string;
    jwtExpiration: number;
    oauthProviders: {
        google?: {
            clientId: string;
            clientSecret: string;
        };
        facebook?: {
            appId: string;
            appSecret: string;
        };
        apple?: {
            clientId: string;
            teamId: string;
            keyId: string;
            privateKey: string;
        };
    };
}

/**
 * Authentication manager for coordinating authentication providers
 */
export class AuthManager {
    private jwtManager: JWTManager;
    private oauthManager: OAuthManager;
    private tokenValidator: TokenValidator;

    constructor(config: AuthManagerConfig) {
        this.jwtManager = new JWTManager({
            secret: config.jwtSecret,
            expiration: config.jwtExpiration
        });

        this.oauthManager = new OAuthManager({
            providers: config.oauthProviders
        });

        this.tokenValidator = new TokenValidator(this.jwtManager);
    }

    /**
     * Authenticate a user using the appropriate provider
     * @param providerType Provider type ('jwt', 'google', 'facebook', etc.)
     * @param credentials Authentication credentials
     */
    public async authenticate(providerType: string, credentials: any): Promise<any> {
        let authProvider: IAuthProvider;

        switch (providerType) {
            case 'jwt':
                authProvider = this.jwtManager;
                break;
            case 'google':
            case 'facebook':
            case 'apple':
                authProvider = this.oauthManager;
                credentials = { ...credentials, provider: providerType };
                break;
            default:
                throw new Error(`Unsupported auth provider: ${providerType}`);
        }

        return authProvider.authenticate(credentials);
    }

    /**
     * Validate a token
     * @param token Authentication token
     * @param scope Optional permission scopes to check
     */
    public async validateToken(token: string, scope?: string[]): Promise<boolean> {
        return this.tokenValidator.validate(token, scope);
    }

    /**
     * Refresh a token
     * @param token Refresh token
     */
    public async refreshToken(token: string): Promise<any> {
        return this.jwtManager.refreshToken(token);
    }

    /**
     * Generate a token for a user
     * @param userId User ID
     * @param metadata Additional metadata to include in the token
     */
    public async generateToken(userId: string, metadata?: any): Promise<any> {
        const user = { id: userId, ...(metadata || {}) };
        return this.jwtManager.generateToken(user);
    }
} 