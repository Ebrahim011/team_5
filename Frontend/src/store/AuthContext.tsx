'use client';

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { User, AuthState } from '@/types/auth';
import { getToken, getUserFromStorage, removeToken, removeUserFromStorage, setUserToStorage } from '@/lib/auth';
import { getUserProfile, logoutUser as logoutUserService } from '@/features/auth/auth.service';

export interface AuthContextType extends AuthState {
    login: (user: User, token: string) => void;
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
    refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state from storage
    useEffect(() => {
        const initAuth = async () => {
            try {
                const storedToken = getToken();
                const storedUser = getUserFromStorage();

                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(storedUser);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                removeToken();
                removeUserFromStorage();
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    // Login - set user and token in state
    const login = useCallback((user: User, token: string) => {
        setUser(user);
        setToken(token);
    }, []);

    // Logout - clear state and storage
    const logout = useCallback(async () => {
        try {
            await logoutUserService();
        } finally {
            setUser(null);
            setToken(null);
        }
    }, []);

    // Update user data
    const updateUser = useCallback((user: User) => {
        setUser(user);
    }, []);

    // Refresh user profile from server
    const refreshProfile = useCallback(async () => {
        if (!token) return;

        const isOffline = typeof window !== 'undefined' && !navigator.onLine;

        try {
            const profile = await getUserProfile();
            setUser(profile);
            setUserToStorage(profile);

            // If role changed, user needs to re-login to get new token
            const storedUser = getUserFromStorage();
            if (storedUser && storedUser.role !== profile.role) {
                console.warn('User role changed. Please logout and login again to get new token.');
            }
        } catch (error: any) {
            // In offline mode, try to use cached user
            if (isOffline) {
                try {
                    const cachedUser = getUserFromStorage();
                    if (cachedUser) {
                        console.log('📴 Using cached user profile (offline mode)');
                        setUser(cachedUser);
                        return;
                    }
                } catch (cacheError) {
                    console.error('Error loading cached user:', cacheError);
                }
            }
            
            // Only log error if online (to avoid spam in offline mode)
            if (!isOffline) {
            console.error('Error refreshing profile:', error);
            }
        }
    }, [token]);

    // Memoized context value
    const value = useMemo<AuthContextType>(() => ({
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        updateUser,
        refreshProfile,
    }), [user, token, isLoading, login, logout, updateUser, refreshProfile]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
