'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { AuthLayout } from '@/components/layouts';
import { Input, Button } from '@/components/ui';
import { resetUserPassword } from '@/features/auth/auth.service';
import { ROUTES } from '@/lib/constants';
import { extractErrorMessage } from '@/lib/utils';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const email = searchParams?.get('email') ?? '';
    const otp = searchParams?.get('otp') ?? '';

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; general?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if no email/otp
    useEffect(() => {
        if (!email || !otp) {
            router.push(ROUTES.FORGOT_PASSWORD);
        }
    }, [email, otp, router]);

    const validateForm = () => {
        const newErrors: typeof errors = {};

        if (!formData.password) {
            newErrors.password = 'كلمة المرور الجديدة مطلوبة';
        } else if (formData.password.length < 8) {
            newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setErrors({});

        try {
            await resetUserPassword({
                email,
                otp,
                newPassword: formData.password,
            });

            // Redirect to login with success message
            router.push(ROUTES.LOGIN);
        } catch (err) {
            setErrors({
                general: extractErrorMessage(err),
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="كلمة مرور جديدة">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* General Error */}
                {errors.general && (
                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
                        {errors.general}
                    </div>
                )}

                {/* New Password Field */}
                <Input
                    type="password"
                    label="كلمة مرور جديدة"
                    placeholder="ضع كلمة المرور الجديدة"
                    icon="password"
                    showPasswordToggle
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    error={errors.password}
                    disabled={isLoading}
                />

                {/* Confirm Password Field */}
                <Input
                    type="password"
                    label="تأكيد كلمة مرور جديدة"
                    placeholder="تأكيد كلمة المرور"
                    icon="password"
                    showPasswordToggle
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    error={errors.confirmPassword}
                    disabled={isLoading}
                />

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    isLoading={isLoading}
                    leftIcon={!isLoading ? <KeyRound className="h-5 w-5" /> : undefined}
                >
                    إنهاء
                </Button>
            </form>
        </AuthLayout>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <AuthLayout title="جاري التحميل...">
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                </div>
            </AuthLayout>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
