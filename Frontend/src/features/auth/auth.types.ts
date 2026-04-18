// Auth Feature Types

// Re-export from global types for convenience
export type {
    User,
    AuthState,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    VerifyOTPRequest,
    VerifyOTPResponse,
    ResendOTPRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
} from '@/types/auth';

// OTP Types
export type OTPType = 'registration' | 'password-reset';

// Auth Flow State
export interface AuthFlowState {
    email: string;
    otpType: OTPType;
    step: 'email' | 'otp' | 'password';
}
