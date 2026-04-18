'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { API_URL } from '@/lib/constants';

const GRADES = [
    {
        label: 'المرحلة الابتدائية',
        grades: [
            'الصف الأول الابتدائي',
            'الصف الثاني الابتدائي',
            'الصف الثالث الابتدائي',
            'الصف الرابع الابتدائي',
            'الصف الخامس الابتدائي',
            'الصف السادس الابتدائي'
        ]
    },
    {
        label: 'المرحلة الإعدادية',
        grades: [
            'الصف الأول الإعدادي',
            'الصف الثاني الإعدادي',
            'الصف الثالث الإعدادي'
        ]
    },
    {
        label: 'المرحلة الثانوية',
        grades: [
            'الصف الأول الثانوي',
            'الصف الثاني الثانوي',
            'الصف الثالث الثانوي'
        ]
    }
];

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isGradeOpen, setIsGradeOpen] = useState(false);
    
    // Steps: 1: Info, 2: Study, 3: Contact
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        teacherCode: '',
        grade: '',
        classroom: '', // Center/School
        phone: '',
        parentPhone: '',
        address: ''
    });

    const handlePrev = () => {
        setStep(prev => prev - 1);
    };

    const handleNext = () => {
        setStep(prev => prev + 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_URL}/students/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'حدث خطأ أثناء التسجيل');
            }

            router.push(`/portal/success?code=${data.data.code}&password=${data.data.password}&name=${encodeURIComponent(data.data.name)}`);

        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 text-center">
                
                 <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                    </svg>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold mb-2">إنشاء حساب جديد</h2>
                <p className="text-sm sm:text-base text-gray-500 mb-8">سجّل بياناتك للحصول على كود الطالب</p>

                {/* Steps Indicator */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex flex-col items-center gap-2">
                             <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-colors duration-200
                                ${step === s ? 'bg-[#6339AC] text-white' : 
                                  step > s ? 'bg-[#E9E1F8] text-[#6339AC]' : 'bg-gray-100 text-gray-400'}`}>
                                {s}
                            </div>
                            <span className={`text-[10px] sm:text-xs font-medium transition-colors duration-200 ${step === s ? 'text-[#6339AC]' : 'text-gray-400'}`}>
                                {s === 1 ? 'البيانات' : s === 2 ? 'الدراسة' : 'تواصل'}
                            </span>
                        </div>
                    ))}
                </div>

                {error && <div className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg text-right">{error}</div>}

                <form onSubmit={handleSubmit} className="text-right">
                    {step === 1 && (
                        <div className="space-y-4">
                             <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">كود المعلم <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="ادخل كود المعلم"
                                    className="w-full bg-purple-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 transition-shadow"
                                    value={formData.teacherCode}
                                    onChange={(e) => setFormData({...formData, teacherCode: e.target.value})}
                                    required
                                />
                            </div>
                             <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">الاسم كامل <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="ادخل اسمك الكامل"
                                    className="w-full bg-purple-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 transition-shadow"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">البريد الإلكتروني <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    placeholder="ادخل البريد الإلكتروني"
                                    className="w-full bg-purple-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 transition-shadow"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={!formData.fullName || !formData.email || !formData.teacherCode}
                                className="w-full bg-[#6339AC] hover:bg-[#502d8e] text-white rounded-xl py-3 font-medium mt-6 shadow-lg shadow-[#6339AC]/25 hover:shadow-[#6339AC]/40 transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                                التالي
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">الصف الدراسي <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsGradeOpen(!isGradeOpen)}
                                        className="w-full bg-purple-50 border-0 rounded-xl px-4 py-3 text-right flex items-center justify-between focus:ring-2 focus:ring-primary-500 transition-shadow"
                                    >
                                        <span className={formData.grade ? 'text-gray-900' : 'text-gray-400'}>
                                            {formData.grade || 'اختر الصف الدراسي'}
                                        </span>
                                        {isGradeOpen ? (
                                            <ChevronUp className="w-5 h-5 text-gray-500" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-500" />
                                        )}
                                    </button>

                                    {isGradeOpen && (
                                        <>
                                            <div 
                                                className="fixed inset-0 z-10" 
                                                onClick={() => setIsGradeOpen(false)}
                                            ></div>
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-20 max-h-80 overflow-y-auto">
                                                {GRADES.map((group) => (
                                                    <div key={group.label} className="p-2">
                                                        <div className="text-xs font-semibold text-primary-600 px-3 py-2 bg-purple-50 rounded-lg mb-1">
                                                            {group.label}
                                                        </div>
                                                        {group.grades.map((grade) => (
                                                            <button
                                                                key={grade}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData({ ...formData, grade });
                                                                    setIsGradeOpen(false);
                                                                }}
                                                                className={`w-full text-right px-4 py-2.5 rounded-lg text-sm transition-colors ${
                                                                    formData.grade === grade 
                                                                        ? 'bg-primary-50 text-primary-700 font-medium' 
                                                                        : 'text-gray-600 hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                {grade}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                             <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">اسم السنتر <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="اسم السنتر"
                                    className="w-full bg-purple-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 transition-shadow"
                                    value={formData.classroom}
                                    onChange={(e) => setFormData({...formData, classroom: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={handlePrev}
                                    className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-3 font-medium transition-colors"
                                >
                                    السابق
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!formData.grade || !formData.classroom}
                                    className="w-2/3 bg-[#6339AC] hover:bg-[#502d8e] text-white rounded-xl py-3 font-medium shadow-lg shadow-[#6339AC]/25 hover:shadow-[#6339AC]/40 transition-all disabled:opacity-50 disabled:shadow-none"
                                >
                                    التالي
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                             <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">رقم الهاتف <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    placeholder="01xxxxxxxxx"
                                    className="w-full bg-purple-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 transition-shadow"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">رقم ولي الأمر <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    placeholder="01xxxxxxxxx"
                                    className="w-full bg-purple-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 transition-shadow"
                                    value={formData.parentPhone}
                                    onChange={(e) => setFormData({...formData, parentPhone: e.target.value})}
                                    required
                                />
                                {formData.phone && formData.parentPhone && formData.phone === formData.parentPhone && (
                                    <p className="text-red-500 text-xs mt-1">رقم الهاتف ورقم ولي الأمر يجب أن يكونا مختلفين</p>
                                )}
                            </div>
                             <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">العنوان <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="العنوان بالتفصيل"
                                    className="w-full bg-purple-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 transition-shadow"
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={handlePrev}
                                    className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-3 font-medium transition-colors"
                                >
                                    السابق
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !formData.parentPhone || !formData.phone || !formData.address || formData.phone === formData.parentPhone}
                                    className="w-2/3 bg-[#6339AC] hover:bg-[#502d8e] text-white rounded-xl py-3 font-medium shadow-lg shadow-[#6339AC]/25 hover:shadow-[#6339AC]/40 transition-all disabled:opacity-50 disabled:shadow-none"
                                >
                                    {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
