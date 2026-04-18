'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { AuthLayout } from '@/components/layouts';
import { Input, Button } from '@/components/ui';
import { registerUser } from '@/features/auth/auth.service';
import { ROUTES } from '@/lib/constants';

import { extractErrorMessage, extractFormErrors } from '@/lib/utils';

export default function RegisterPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        subject: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        const newErrors: typeof errors = {};

        if (!formData.name || formData.name.trim().length < 2) {
            newErrors.name = 'الاسم مطلوب (حرفان على الأقل)';
        }

        if (!formData.email) {
            newErrors.email = 'البريد الإلكتروني مطلوب';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'البريد الإلكتروني غير صالح';
        }

        if (!formData.password) {
            newErrors.password = 'كلمة المرور مطلوبة';
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
            const { email } = await registerUser({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone || undefined,
                subject: formData.subject || undefined,
            });

            // Redirect to OTP verification with email in query
            router.push(`${ROUTES.VERIFY_OTP}?email=${encodeURIComponent(email)}&type=registration`);

        } catch (error) {
            setErrors(extractFormErrors(error));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="إنشاء حساب جديد">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* General Error */}
                {errors.general && (
                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
                        {errors.general}
                    </div>
                )}

                {/* Name Field */}
                <Input
                    type="text"
                    label="الاسم الكامل"
                    placeholder="ضع اسمك الكامل"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    error={errors.name}
                    disabled={isLoading}
                />

                {/* Email Field */}
                <Input
                    type="email"
                    label="البريد الإلكتروني"
                    placeholder="ضع البريد الإلكتروني"
                    icon="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    error={errors.email}
                    disabled={isLoading}
                />

                {/* Phone Field */}
                <Input
                    type="tel"
                    label="رقم الهاتف (اختياري)"
                    placeholder="01xxxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={isLoading}
                />

                {/* Subject Field */}
                <Input
                    type="text"
                    label="المادة التي تدرسها (اختياري)"
                    placeholder="مثال: الرياضيات، اللغة العربية، العلوم..."
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    disabled={isLoading}
                />

                {/* Password Field */}
                <Input
                    type="password"
                    label="كلمة المرور"
                    placeholder="xxxxxxxx"
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
                    label="تأكيد كلمة المرور"
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
                    leftIcon={!isLoading ? <UserPlus className="h-5 w-5" /> : undefined}
                >
                    إنشاء حساب
                </Button>

                {/* Login Link */}
                <p className="text-center text-sm text-gray-600">
                    لديك حساب بالفعل؟{' '}
                    <Link href={ROUTES.LOGIN} className="text-purple-600 hover:underline font-medium">
                        تسجيل دخول
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
