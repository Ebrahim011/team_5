'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URL } from '@/lib/constants';

function ResetPasswordArgs() {
    const searchParams = useSearchParams();
    const defaultCode = searchParams?.get('code') || '';
    
    const [formData, setFormData] = useState({
        code: defaultCode,
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.newPassword !== formData.confirmPassword) {
            setStatus('error');
            setMessage('كلمة المرور الجديدة غير متطابقة');
            return;
        }

        if (formData.newPassword.length < 6) {
            setStatus('error');
            setMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const res = await fetch(`${API_URL}/students/portal/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: formData.code,
                    otp: formData.otp,
                    newPassword: formData.newPassword
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'حدث خطأ ما');
            }

            setStatus('success');
            setMessage('تم تغيير كلمة المرور بنجاح');

            // Redirect to login page after delay
            setTimeout(() => {
                router.push('/portal');
            }, 2000);

        } catch (err: any) {
            setStatus('error');
            setMessage(err.message);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                
                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                </div>

                <h2 className="text-2xl font-bold mb-2">إعادة تعيين كلمة المرور</h2>
                <p className="text-gray-500 mb-8 text-sm">أدخل رمز التحقق المرسل لبريدك الإلكتروني</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="text-right">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">كود الطالب</label>
                        <input
                            type="text"
                            name="code"
                            placeholder="ادخل كود الطالب"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            value={formData.code}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="text-right">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">رمز التحقق (OTP)</label>
                        <input
                            type="text"
                            name="otp"
                            placeholder="أدخل الرمز المكون من 6 أرقام"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all tracking-widest text-center font-mono font-bold"
                            value={formData.otp}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="text-right">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">كلمة المرور الجديدة</label>
                        <input
                            type="password"
                            name="newPassword"
                            placeholder="*************"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="text-right">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">تأكيد كلمة المرور</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="*************"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    
                    {message && (
                        <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                            status === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                        }`}>
                             {status === 'error' ? (
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'loading' || status === 'success'}
                        className="w-full bg-[#6339AC] hover:bg-[#6339AC]/80 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-primary-600/20 hover:shadow-primary-600/40 transition-all disabled:opacity-50 disabled:shadow-none flex justify-center items-center gap-2 mt-4"
                    >
                        {status === 'loading' && (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        )}
                        {status === 'success' ? 'تم التغيير' : 'حفظ كلمة المرور الجديدة'}
                    </button>
                    
                    <Link 
                        href="/portal"
                        className="block w-full text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors pt-4"
                    >
                        إلغاء والعودة
                    </Link>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="text-center py-20">جاري التحميل...</div>}>
            <ResetPasswordArgs />
        </Suspense>
    );
}
