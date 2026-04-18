import { setToken, removeToken, setUserToStorage, removeUserFromStorage } from '@/lib/auth';
import * as authApi from './auth.api';
import type { LoginRequest, RegisterRequest, VerifyOTPRequest, ResetPasswordRequest, User } from '@/types/auth';

// Login service - handles login and token storage
export async function loginUser(data: LoginRequest): Promise<{ user: User; token: string }> {
    const response = await authApi.login(data);

    if (!response.success || !response.data) {
        throw new Error(response.message || 'Login failed');
    }

    const { user, token } = response.data;

    // Store token and user
    setToken(token);
    setUserToStorage(user);

    return { user, token };
}

// Register service - initiates registration flow
export async function registerUser(data: RegisterRequest): Promise<{ email: string }> {
    const response = await authApi.register(data);

    if (!response.success || !response.data) {
        throw new Error(response.message || 'Registration failed');
    }

    return { email: response.data.email };
}

// Verify OTP service - completes registration or password reset
export async function verifyUserOTP(data: VerifyOTPRequest): Promise<{ user: User; token: string }> {
    const response = await authApi.verifyOTP(data);

    if (!response.success || !response.data) {
        throw new Error(response.message || 'OTP verification failed');
    }

    const { user, token } = response.data;

    // Store token and user
    setToken(token);
    setUserToStorage(user);

    return { user, token };
}

// Resend OTP service
export async function resendUserOTP(email: string, type: 'registration' | 'password-reset'): Promise<void> {
    const response = await authApi.resendOTP(email, type);

    if (!response.success) {
        throw new Error(response.message || 'Failed to resend OTP');
    }
}

// Validate OTP service (check only)
export async function validateUserOTP(email: string, otp: string, type: 'registration' | 'password-reset'): Promise<void> {
    const response = await authApi.validateOTP(email, otp, type);

    if (!response.success) {
        throw new Error(response.message || 'OTP is invalid');
    }
}

// Forgot password service
export async function forgotUserPassword(email: string): Promise<void> {
    const response = await authApi.forgotPassword({ email });

    if (!response.success) {
        throw new Error(response.message || 'Failed to send password reset OTP');
    }
}

// Reset password service
export async function resetUserPassword(data: ResetPasswordRequest): Promise<void> {
    const response = await authApi.resetPassword(data);

    if (!response.success) {
        throw new Error(response.message || 'Failed to reset password');
    }
}

// Get user profile service
export async function getUserProfile(): Promise<User> {
    const response = await authApi.getProfile();

    if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to get profile');
    }

    return response.data.user;
}

// Logout service
export async function logoutUser(): Promise<void> {
    try {
        await authApi.logout();
    } catch {
        // Ignore logout API errors
    } finally {
        // Always clear local auth data
        removeToken();
        removeUserFromStorage();
    }
}
