'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

export default function UnauthorizedPage() {
    const router = useRouter();
    const { user } = useAuth();

    const handleGoBack = () => {
        // Redirect assistants to attendance, others to dashboard
        if (user?.role === 'assistant') {
            router.push(ROUTES.ATTENDANCE);
        } else {
            router.push(ROUTES.DASHBOARD);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FBFAFF] via-white to-white flex items-center justify-center p-4" dir="rtl">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-red-600" />
                    </div>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    غير مسموح لك بزيارة هذه الصفحة
                </h1>
                
                <p className="text-gray-600 mb-8">
                    You are not allowed to visit this page.
                </p>

                <p className="text-sm text-gray-500 mb-8">
                    لا تملك الصلاحيات اللازمة للوصول إلى هذه الصفحة. يرجى التواصل مع المسؤول إذا كنت تعتقد أن هذا خطأ.
                </p>

                <button
                    onClick={handleGoBack}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-purple-700 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>العودة للصفحة الرئيسية</span>
                </button>
            </div>
        </div>
    );
}
















