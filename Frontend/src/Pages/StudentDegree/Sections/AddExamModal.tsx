import { X, GraduationCap, User, BookOpen, Hash, Award, Loader2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { examService } from '@/services/examService';
import { getStudents } from '@/features/students/api/studentApi';
import { Exam } from '@/types/exam';
import { useToast } from '@/components/ui';

interface AddGradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
}

export default function AddGradeModal({ isOpen, onClose, onSubmit }: AddGradeModalProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetchingName, setFetchingName] = useState(false);
    const [exams, setExams] = useState<Exam[]>([]);
    const [formData, setFormData] = useState({
        studentName: '',
        studentCode: '',
        examTitle: '',
        fullMark: '100', // Default full mark
        score: '',
        status: 'present',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchExams();
        }
    }, [isOpen]);

    // Auto-fetch student name when code changes
    useEffect(() => {
        const fetchStudentName = async () => {
            const code = formData.studentCode.trim();
            if (code.length >= 4) {
                setFetchingName(true);
                try {
                    const res = await getStudents(code);
                    if (res.success && res.data.length > 0) {
                        // Find exact match or first result
                        const student = res.data.find(s => s.nationalId === code) || res.data[0];
                        setFormData(prev => ({ ...prev, studentName: student.fullName }));
                    } else {
                        setFormData(prev => ({ ...prev, studentName: '' }));
                    }
                } catch (error) {
                    console.error('Error fetching student name:', error);
                } finally {
                    setFetchingName(false);
                }
            } else if (code.length === 0) {
                setFormData(prev => ({ ...prev, studentName: '' }));
            }
        };

        const timeoutId = setTimeout(fetchStudentName, 600);
        return () => clearTimeout(timeoutId);
    }, [formData.studentCode]);

    const fetchExams = async () => {
        try {
            const res = await examService.getExams();
            if (res.success && res.data) {
                setExams(res.data);
            }
        } catch (error) {
            console.error('Error fetching exams:', error);
        }
    };

    if (!isOpen) return null;

    const isScoreInvalid = Number(formData.score) > Number(formData.fullMark);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isScoreInvalid) {
            showToast('الدرجة لا يمكن أن تكون أكبر من الدرجة النهائية', 'error');
            return;
        }

        if (!formData.studentName) {
            showToast('يجب إدخال كود طالب صحيح لعرض الاسم', 'error');
            return;
        }

        setLoading(true);
        try {
            // Need to pass data that addSingleResult expects
            await onSubmit({
                ...formData,
                score: Number(formData.score),
                fullMark: Number(formData.fullMark)
            });
            showToast('تم حفظ الدرجة بنجاح', 'success');
            onClose();
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.message || 'حدث خطأ أثناء حفظ الدرجة';
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden max-h-[95vh] flex flex-col" dir="rtl">
                {/* Header */}
                <div className="p-6 md:p-8 bg-[#F8F7FF] border-b border-gray-100 flex justify-between items-center shrink-0">
                    <button 
                        onClick={onClose}
                        className="h-10 w-10 md:h-12 md:w-12 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-colors bg-white shadow-sm border border-gray-100"
                    >
                        <X className="h-6 w-6 md:h-7 md:w-7" />
                    </button>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <h2 className="text-xl md:text-3xl font-bold text-gray-900">إضافة درجة جديدة</h2>
                            <p className="text-sm md:text-lg text-gray-400 font-medium">إدخال درجات الطلاب في الامتحانات</p>
                        </div>
                        <div className="h-12 w-12 md:h-16 md:w-16 bg-[#EBE4FF] rounded-2xl md:rounded-[1.5rem] flex items-center justify-center">
                            <GraduationCap className="h-7 w-7 md:h-9 md:w-9 text-[#6339AC]" />
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6 md:space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                    {/* Student Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                        <div className="space-y-3">
                            <label className="flex items-center justify-end gap-2 text-lg md:text-xl font-bold text-[#414141] mb-1">
                                <span>كود الطالب</span>
                                <Hash className="h-5 w-5 md:h-6 md:w-6 text-[#6339AC]/70" />
                            </label>
                            <input 
                                required
                                type="text" 
                                className="w-full px-6 py-4 md:py-5 rounded-2xl border-2 border-transparent focus:border-purple-400 outline-none transition-all text-right text-lg md:text-xl font-medium bg-[#F9F9F9] placeholder:text-gray-300"
                                placeholder="أدخل كود الطالب"
                                value={formData.studentCode}
                                onChange={e => setFormData({...formData, studentCode: e.target.value})}
                            />
                        </div>
                        <div className="space-y-3 relative">
                            <label className="flex items-center justify-end gap-2 text-lg md:text-xl font-bold text-[#414141] mb-1">
                                <span>اسم الطالب</span>
                                <User className="h-5 w-5 md:h-6 md:w-6 text-[#6339AC]/70" />
                            </label>
                            <div className="relative">
                                <input 
                                    readOnly
                                    type="text" 
                                    className="w-full px-6 py-4 md:py-5 rounded-2xl border-2 border-transparent outline-none transition-all text-right text-lg md:text-xl font-medium bg-[#F0F0F0] text-[#717171] cursor-not-allowed"
                                    placeholder={fetchingName ? 'جاري التحميل...' : 'سيظهر الاسم تلقائياً'}
                                    value={formData.studentName}
                                />
                                {fetchingName && (
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                        <Loader2 className="h-5 w-5 text-purple-500 animate-spin" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Exam and Score */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                        <div className="space-y-3">
                            <label className="flex items-center justify-end gap-2 text-lg md:text-xl font-bold text-[#414141] mb-1">
                                <span>اسم الامتحان</span>
                                <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-[#6339AC]/70" />
                            </label>
                            <input 
                                required
                                type="text"
                                className="w-full px-6 py-4 md:py-5 rounded-2xl border-2 border-transparent focus:border-purple-400 outline-none transition-all text-right text-lg md:text-xl font-medium bg-[#F9F9F9] placeholder:text-gray-300"
                                placeholder="أدخل اسم الامتحان"
                                value={formData.examTitle}
                                onChange={e => setFormData({...formData, examTitle: e.target.value})}
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="flex items-center justify-end gap-2 text-lg md:text-xl font-bold text-[#414141] mb-1">
                                <span>درجة الطالب</span>
                                <Award className="h-5 w-5 md:h-6 md:w-6 text-[#6339AC]/70" />
                            </label>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="flex-[3]">
                                        <input 
                                            required
                                            type="number" 
                                            min="0"
                                            className={`w-full px-6 py-4 md:py-5 rounded-2xl border-2 outline-none transition-all text-right text-lg md:text-xl font-medium ${isScoreInvalid ? 'border-red-400 bg-red-50' : 'border-transparent bg-[#F9F9F9] focus:border-purple-400'}`}
                                            placeholder="الدرجة"
                                            value={formData.score}
                                            onChange={e => setFormData({...formData, score: e.target.value})}
                                        />
                                    </div>
                                    <span className="text-2xl font-bold text-gray-300">/</span>
                                    <div className="flex-[2]">
                                        <input 
                                            required
                                            type="number" 
                                            min="1"
                                            className="w-full px-4 py-4 md:py-5 rounded-2xl border-2 border-transparent focus:border-purple-400 outline-none transition-all text-center text-lg md:text-xl font-medium bg-[#F9F9F9] placeholder:text-gray-300"
                                            placeholder="100"
                                            value={formData.fullMark}
                                            onChange={e => setFormData({...formData, fullMark: e.target.value})}
                                        />
                                    </div>
                                </div>
                                {isScoreInvalid && (
                                    <div className="flex items-center justify-end gap-2 text-red-500 text-sm font-bold animate-pulse">
                                        <span>الدرجة أكبر من الدرجة النهائية!</span>
                                        <AlertCircle className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                        <label className="flex items-center justify-end gap-2 text-lg md:text-xl font-bold text-[#414141] mb-1">
                            <span>ملاحظات</span>
                        </label>
                        <textarea 
                            className="w-full px-6 py-5 rounded-[1.5rem] border-2 border-transparent focus:border-purple-400 outline-none transition-all h-36 resize-none text-right text-lg md:text-xl font-medium bg-[#F9F9F9] placeholder:text-gray-300"
                            placeholder="أي ملاحظات إضافية..."
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                        />
                    </div>

                    <div className="pt-4 md:pt-6 flex flex-col md:flex-row gap-4 shrink-0">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex-[1.5] px-8 py-5 md:py-6 rounded-2xl font-bold text-white bg-[#6339AC] hover:bg-purple-800 transition-all shadow-xl shadow-purple-200 disabled:opacity-70 disabled:cursor-not-allowed text-xl md:text-2xl"
                        >
                            {loading ? 'جاري الحفظ...' : 'حفظ الدرجة'}
                        </button>
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 px-8 py-5 md:py-6 rounded-2xl font-bold text-[#414141] bg-[#F4F4F4] hover:bg-gray-200 transition-all text-xl md:text-2xl"
                        >
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #EBE4FF;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #D8CCFF;
                }
            `}</style>
        </div>
    );
}
