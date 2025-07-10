import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, LoginRequest, RegisterRequest, AuthResponse } from '@/services/authService';
import { facialRecognitionAPI } from '@/services/facialRecognitionAPI';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginRequest) => Promise<AuthResponse>;
    register: (userData: RegisterRequest) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<string>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user;

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                if (authService.isAuthenticated()) {
                    const userData = await authService.getMe();
                    setUser(userData);
                    
                    const token = authService.getToken();
                    if (token) {
                        facialRecognitionAPI.setToken(token);
                    }
                }
            } catch (error) {
                console.error('Failed to initialize auth:', error);
                authService.clearToken();
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
        setIsLoading(true);
        try {
            const response = await authService.login({
                ...credentials,
                deviceInfo: authService.getDeviceInfo(),
            });
            setUser(response.user);
            
            facialRecognitionAPI.setToken(response.token);
            
            try {
                await facialRecognitionAPI.initializeOrganization();
            } catch (error) {
                console.error('Failed to initialize facial recognition:', error);
            }
            
            return response;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
        setIsLoading(true);
        try {
            const response = await authService.register(userData);
            setUser(response.user);
            
            facialRecognitionAPI.setToken(response.token);
            
            try {
                await facialRecognitionAPI.initializeOrganization();
            } catch (error) {
                console.error('Failed to initialize facial recognition:', error);
            }
            
            return response;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        setIsLoading(true);
        try {
            await authService.logout();
            setUser(null);
            facialRecognitionAPI.setToken('');
        } finally {
            setIsLoading(false);
        }
    };

    const refreshToken = async (): Promise<string> => {
        return authService.refreshToken();
    };

    const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
        return authService.changePassword(currentPassword, newPassword);
    };

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshToken,
        changePassword,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 