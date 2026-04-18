'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, GraduationCap, MapPin, Wallet } from 'lucide-react';
import { createStudent, type CreateStudentData } from '@/features/students';
import { useToast } from '@/components/ui';

export default function AddStudentPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        // Student Information
        studentName: '',
        studentPhone: '',

        // Parent Information
        parentPhone: '',

        // Academic Details
        grade: '',

        // Schedule and Location
        center: '',
        schedule: '',

        // Financial Information
        monthlyFee: '',
        paidUntil: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const studentData: CreateStudentData = {
                fullName: formData.studentName,
                studentPhone: formData.studentPhone || undefined,
                parentPhone: formData.parentPhone || undefined,
                grade: formData.grade,
                center: formData.center || undefined,
                schedule: formData.schedule || undefined,
                monthlyFee: formData.monthlyFee ? parseFloat(formData.monthlyFee) : undefined,
            };

            const response = await createStudent(studentData);

            // Redirect to success page with student ID and password
            const studentId = response.data.id || response.data._id;
            const password = (response.data as any).password || '';
            router.push(`/students/success?id=${studentId}&pwd=${encodeURIComponent(password)}`);

        } catch (error: any) {
            console.error('Failed to create student:', error);
            showToast(error.response?.data?.message || 'فشل في إضافة الطالب', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Page Title */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">إضافة طالب جديد</h2>
                <p className="text-gray-500 text-sm">أضف بيانات الطالب لإنشاء كود فريد له</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student Information */}
                <div className="bg-white rounded-2xl p-6 border-2 border-black/5 shadow-md shadow-black/10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100">
                            <User className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">معلومات الطالب</h3>
                            <p className="text-sm text-gray-500">البيانات الأساسية للطالب</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                اسم الطالب/ة الكامل
                            </label>
                            <input
                                type="text"
                                name="studentName"
                                value={formData.studentName}
                                onChange={handleInputChange}
                                placeholder="ادخل اسم الطالب بالكامل"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                هاتف الطالب/ة
                            </label>
                            <input
                                type="tel"
                                name="studentPhone"
                                value={formData.studentPhone}
                                onChange={handleInputChange}
                                placeholder="xxxxxxxxxxx"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Parent Information */}
                <div className="bg-white rounded-2xl p-6 border-2 border-black/5 shadow-md shadow-black/10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100">
                            <Phone className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">معلومات ولي الأمر</h3>
                            <p className="text-sm text-gray-500">بيانات التواصل مع ولي الأمر</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            هاتف ولي الأمر
                        </label>
                        <input
                            type="tel"
                            name="parentPhone"
                            value={formData.parentPhone}
                            onChange={handleInputChange}
                            placeholder="xxxxxxxxxxx"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Academic Details */}
                <div className="bg-white rounded-2xl p-6 border-2 border-black/5 shadow-md shadow-black/10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100">
                            <GraduationCap className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">التفاصيل الأكاديمية</h3>
                            <p className="text-sm text-gray-500">الصف الدراسي والرحلة التعليمية</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            الصف الدراسي
                        </label>
                        <input
                            type="text"
                            name="grade"
                            value={formData.grade}
                            onChange={handleInputChange}
                            placeholder="ادخل الصف الدراسي"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            required
                        />
                    </div>
                </div>

                {/* Schedule and Location */}
                <div className="bg-white rounded-2xl p-6 border-2 border-black/5 shadow-md shadow-black/10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-yellow-100">
                            <MapPin className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">السنتر والموعد</h3>
                            <p className="text-sm text-gray-500">مكان الدراسة ومواعيد الحضور</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                السنتر
                            </label>
                            <input
                                type="text"
                                name="center"
                                value={formData.center}
                                onChange={handleInputChange}
                                placeholder="ادخل السنتر"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                الموعد
                            </label>
                            <input
                                type="text"
                                name="schedule"
                                value={formData.schedule}
                                onChange={handleInputChange}
                                placeholder="ادخل الموعد"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Financial Information */}
                <div className="bg-white rounded-2xl p-6 border-2 border-black/5 shadow-md shadow-black/10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100">
                            <Wallet className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">المعلومات المالية</h3>
                            <p className="text-sm text-gray-500">الاشتراك الشهري وحالة السداد</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                الاشتراك الشهري (ج.م)
                            </label>
                            <input
                                type="number"
                                name="monthlyFee"
                                value={formData.monthlyFee}
                                onChange={handleInputChange}
                                placeholder="ادخل الاشتراك الشهري (اختياري)"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                min="0"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="paidUntil"
                                id="paidUntil"
                                checked={formData.paidUntil}
                                onChange={handleInputChange}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <label htmlFor="paidUntil" className="text-sm text-gray-700">
                                تم سداد الشهر
                            </label>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <User className="h-5 w-5" />
                        {submitting ? 'جاري الإضافة...' : 'إضافة طالب'}
                    </button>
                </div>
            </form>
        </div>
    );
}




















