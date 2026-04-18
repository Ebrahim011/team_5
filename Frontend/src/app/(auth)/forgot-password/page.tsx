'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { AuthLayout } from '@/components/layouts';
import { Input, Button } from '@/components/ui';
import { forgotUserPassword } from '@/features/auth/auth.service';
import { ROUTES } from '@/lib/constants';

export default function ForgotPasswordPage() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = () => {
        if (!email) {
            setError('البريد الإلكتروني مطلوب');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('البريد الإلكتروني غير صالح');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEmail()) return;

        setIsLoading(true);
        setError('');

        try {
            await forgotUserPassword(email);
            // Redirect to OTP verification
            router.push(`${ROUTES.VERIFY_OTP}?email=${encodeURIComponent(email)}&type=password-reset`);
        } catch (err) {
            // Still redirect even on error (security - don't reveal if email exists)
            router.push(`${ROUTES.VERIFY_OTP}?email=${encodeURIComponent(email)}&type=password-reset`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="نسيت كلمة المرور" subtitle="أدخل بريدك الإلكتروني لإرسال رمز التحقق">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error */}
                {error && (
                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Email Field */}
                <Input
                    type="email"
                    label="البريد الإلكتروني"
                    placeholder="ضع البريد الإلكتروني"
                    icon="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                    }}
                    error={error}
                    disabled={isLoading}
                />

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    isLoading={isLoading}
                    leftIcon={!isLoading ? <Mail className="h-5 w-5" /> : undefined}
                >
                    إرسال رمز التحقق
                </Button>

                {/* Back to Login */}
                <p className="text-center text-sm text-gray-600">
                    تذكرت كلمة المرور؟{' '}
                    <Link href={ROUTES.LOGIN} className="text-purple-600 hover:underline font-medium">
                        تسجيل دخول
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
