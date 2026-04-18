// Auth Types

export interface User {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    role: 'admin' | 'teacher' | 'assistant' | 'parent';
    teacherCode?: string;
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    token: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    phone?: string;
    subject?: string;
}

export interface RegisterResponse {
    email: string;
}

export interface VerifyOTPRequest {
    email: string;
    otp: string;
}

export interface VerifyOTPResponse {
    user: User;
    token: string;
}

export interface ResendOTPRequest {
    email: string;
    type: 'registration' | 'password-reset';
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    email: string;
    otp: string;
    newPassword: string;
}
