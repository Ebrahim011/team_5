'use client';

import { useContext } from 'react';
import { AuthContext, AuthContextType } from '@/store/AuthContext';

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);

    if (!context) {
        // During static generation, providers aren't available
        // Return a default object to prevent build errors
        if (typeof window === 'undefined') {
            return {
                isAuthenticated: false,
                isLoading: false,
                user: null,
                login: async () => {},
                logout: async () => {},
                refreshProfile: async () => {},
            } as AuthContextType;
        }
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}
