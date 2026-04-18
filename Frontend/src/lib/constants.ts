// Application constants

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'ClassTrack';

// API URL configuration
// In `next dev`, Windows/shell NEXT_PUBLIC_* overrides .env.local; default to local backend.
// Set NEXT_PUBLIC_USE_REMOTE_API=true to use NEXT_PUBLIC_API_URL from the environment during dev.
const getApiUrl = () => {
    const localDefault = 'http://localhost:5000/api';

    if (process.env.NODE_ENV === 'development') {
        if (process.env.NEXT_PUBLIC_USE_REMOTE_API === 'true' && process.env.NEXT_PUBLIC_API_URL) {
            return process.env.NEXT_PUBLIC_API_URL;
        }
        if (typeof window !== 'undefined') {
            console.log('🔗 API (dev default, ignores shell NEXT_PUBLIC_API_URL):', localDefault);
        }
        return localDefault;
    }

    if (process.env.NEXT_PUBLIC_API_URL) {
        const url = process.env.NEXT_PUBLIC_API_URL;
        if (typeof window !== 'undefined') {
            console.log('🔗 Using API URL from environment:', url);
        }
        return url;
    }

    return localDefault;
};

export const API_URL = getApiUrl();

// Auth constants
export const TOKEN_KEY = 'auth_token';
export const USER_KEY = 'auth_user';

// Route paths
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    VERIFY_OTP: '/verify-otp',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    DASHBOARD: '/dashboard',
    ATTENDANCE: '/attendance',
    STUDENTS_ADD: '/students/add',
    STUDENTS_SUCCESS: '/students/success',
    FINANCE: '/finance',
    REPORTS: '/reports',
    GRADES: '/grades',
    SERVICES: '/services',
    CONTACT: '/contact',
    ASSISTANTS: '/dashboard/assistants',
    UNAUTHORIZED: '/unauthorized',
} as const;

// Protected routes that require authentication
export const PROTECTED_ROUTES = ['/dashboard', '/attendance', '/students', '/grades', '/contact', '/finance', '/reports', '/services', '/unauthorized'];

// Public routes that should redirect to dashboard if authenticated
export const AUTH_ROUTES = ['/login', '/register', '/verify-otp', '/forgot-password', '/reset-password'];

// Routes that assistants are allowed to access
export const ASSISTANT_ROUTES = [
    '/attendance',
    '/students/add',
    '/students/success',
    '/grades',
    '/contact',
    '/dashboard/sessions',
];
