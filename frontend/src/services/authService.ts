import { env } from "@/lib/env";

const API_BASE_URL = "http://localhost:3000/api";

export interface LoginRequest {
    email: string;
    password: string;
    deviceInfo?: any;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        username: string;
        email: string;
        role: string;
        createdAt: string;
        updatedAt: string;
    };
    session?: {
        id: string;
    };
}

export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    createdAt: string;
    updatedAt: string;
}

class AuthService {
    private token: string | null = null;

    constructor() {
        // Load token from localStorage on initialization
        this.token = localStorage.getItem("smallblind_token");
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            "Content-Type": "application/json",
            ...(this.token && { Authorization: `Bearer ${this.token}` }),
            ...options.headers,
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid, clear it
                this.clearToken();
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `API request failed: ${response.statusText}`);
        }

        return response.json();
    }

    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const response = await this.request("/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        });

        this.setToken(response.token);
        return response;
    }

    async register(userData: RegisterRequest): Promise<AuthResponse> {
        const response = await this.request("/auth/register", {
            method: "POST",
            body: JSON.stringify(userData),
        });

        this.setToken(response.token);
        return response;
    }

    async logout(): Promise<void> {
        try {
            await this.request("/auth/logout", {
                method: "POST",
            });
        } catch (error) {
            // Even if logout fails on server, clear local token
            console.error("Logout error:", error);
        } finally {
            this.clearToken();
        }
    }

    async getMe(): Promise<User> {
        return this.request("/auth/me");
    }

    async refreshToken(): Promise<string> {
        const response = await this.request("/auth/refresh-token", {
            method: "POST",
        });

        this.setToken(response.token);
        return response.token;
    }

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await this.request("/auth/change-password", {
            method: "POST",
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    }

    setToken(token: string): void {
        this.token = token;
        localStorage.setItem("smallblind_token", token);
    }

    clearToken(): void {
        this.token = null;
        localStorage.removeItem("smallblind_token");
        // Also clear old facial recognition credentials
        localStorage.removeItem("smallblind_api_key");
        localStorage.removeItem("smallblind_organization_id");
    }

    getToken(): string | null {
        return this.token;
    }

    isAuthenticated(): boolean {
        return !!this.token;
    }

    // Get device info for session tracking
    getDeviceInfo() {
        return {
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            language: navigator.language,
            timestamp: new Date().toISOString(),
        };
    }
}

export const authService = new AuthService(); 