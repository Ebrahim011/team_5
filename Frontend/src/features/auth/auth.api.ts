import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    VerifyOTPRequest,
    VerifyOTPResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    User,
} from '@/types/auth';

// API endpoints for authentication
const AUTH_ENDPOINTS = {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    PROFILE: '/auth/profile',
    LOGOUT: '/auth/logout',
} as const;

// Login user
export async function login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await api.post<ApiResponse<LoginResponse>>(AUTH_ENDPOINTS.LOGIN, data);
    return response.data;
}

// Register new user
export async function register(data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    const response = await api.post<ApiResponse<RegisterResponse>>(AUTH_ENDPOINTS.REGISTER, data);
    return response.data;
}

// Verify OTP (for registration or password reset)
export async function verifyOTP(data: VerifyOTPRequest): Promise<ApiResponse<VerifyOTPResponse>> {
    const response = await api.post<ApiResponse<VerifyOTPResponse>>(AUTH_ENDPOINTS.VERIFY_OTP, data);
    return response.data;
}

// Resend OTP
export async function resendOTP(email: string, type: 'registration' | 'password-reset' = 'registration'): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>(AUTH_ENDPOINTS.RESEND_OTP, { email, type });
    return response.data;
}

// Forgot password - sends OTP
export async function forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>(AUTH_ENDPOINTS.FORGOT_PASSWORD, data);
    return response.data;
}

// Reset password with OTP
export async function resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>(AUTH_ENDPOINTS.RESET_PASSWORD, data);
    return response.data;
}

// Validate OTP (check only)
export async function validateOTP(email: string, otp: string, type: 'registration' | 'password-reset'): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/auth/validate-otp', { email, otp, type });
    return response.data;
}

// Get current user profile
export async function getProfile(): Promise<ApiResponse<{ user: User }>> {
    // Check if device is offline
    const isOffline = typeof window !== 'undefined' && !navigator.onLine;
    
    if (isOffline) {
        // Try to load from localStorage
        try {
            const cachedUser = localStorage.getItem('user');
            if (cachedUser) {
                const user = JSON.parse(cachedUser);
                return {
                    success: true,
                    message: 'User profile loaded from cache',
                    data: { user },
                };
            }
        } catch (error) {
            console.error('Error loading cached user profile:', error);
        }
        
        // If no cached data, throw error
        throw new Error('No cached user profile available');
    }
    
    const response = await api.get<ApiResponse<{ user: User }>>(AUTH_ENDPOINTS.PROFILE);
    return response.data;
}

// Logout user
export async function logout(): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>(AUTH_ENDPOINTS.LOGOUT);
    return response.data;
}
