'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Send, User, Loader2, ClipboardCheck, UserX, GraduationCap, Banknote, Clock } from 'lucide-react';
import { useToast, Spinner } from '@/components/ui';
import StudentSearchList from '@/components/StudentSearchList';
import type { Student, StudentSummary } from '@/features/students';
import { getStudentSummary } from '@/features/students/api/studentApi';
import { sendMessage } from '@/features/messages/api/messageApi';

import { useAuth } from '@/hooks/useAuth';
import { MessageHistoryModal } from '@/components/MessageHistoryModal';

export default function CommunicationPage() {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [summary, setSummary] = useState<StudentSummary | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    useEffect(() => {
        if (selectedStudent) {
            fetchSummary(selectedStudent.id || selectedStudent._id!);
        } else {
            setSummary(null);
            setMessage('');
        }
    }, [selectedStudent]);

    const fetchSummary = async (id: string) => {
        setLoadingSummary(true);
        try {
            const response = await getStudentSummary(id);
            if (response.success) {
                setSummary(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch student summary:', error);
            showToast('فشل في تحميل ملخص الطالب', 'error');
        } finally {
            setLoadingSummary(false);
        }
    };

    const generateTemplate = (type: 'attendance' | 'absence' | 'payment' | 'grades') => {
        if (!selectedStudent) return;
        
        const name = selectedStudent.fullName;
        const teacherName = user?.name || "أحمد محمد";
        const head = "السلام عليكم ورحمة الله وبركاته\n\n";
        const tail = `\n\nنرجو التواصل معنا.\nمستر ${teacherName}`;
        
        let body = "";
        
        switch (type) {
            case 'attendance':
                body = `نحيط سيادتكم علماً بأن الطالب/ة ${name} قد حضر حصة اليوم.`;
                break;
            case 'absence':
                body = `نحيط سيادتكم علماً بأن الطالب/ة ${name} لم يحضر/تحضر حصة اليوم.`;
                break;
            case 'payment':
                body = `نود تذكيركم بموعد سداد الاشتراك الشهري للطالب/ة ${name}.`;
                break;
            case 'grades':
                if (summary?.latestExam) {
                    body = `نحيط سيادتكم علماً بأن الطالب/ة ${name} حصل على درجة ${summary.latestExam.score} من ${summary.latestExam.fullMark} في ${summary.latestExam.title}.`;
                } else {
                    body = `نحيط سيادتكم علماً بأن الطالب/ة ${name} قد أدى الاختبار بنجاح وسيتم إرسال الدرجة قريباً.`;
                }
                break;
        }
        
        setMessage(head + body + tail);
    };

    const handleSendWhatsApp = async () => {
        if (!selectedStudent || !message) {
            showToast('من فضلك اختر طالب ونموذج رسالة', 'error');
            return;
        }

        const phone = selectedStudent.parentPhone || selectedStudent.studentPhone;
        if (!phone) {
            showToast('لا يوجد رقم هاتف مسجل', 'error');
            return;
        }

        setSending(true);
        try {
            await sendMessage({
                studentId: selectedStudent.id || selectedStudent._id!,
                content: message
            });

            const formattedPhone = phone.replace(/\D/g, '');
            const egyptianPhone = formattedPhone.startsWith('0') && formattedPhone.length === 11 
                ? `2${formattedPhone}` 
                : formattedPhone;
            
            const whatsappUrl = `https://wa.me/${egyptianPhone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
            
            showToast('تم فتح واتساب للإرسال', 'success');
        } catch (error: any) {
            showToast('فشل في تسجيل الرسالة', 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10" dir="rtl">
            <MessageHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />

            {/* Page Header */}
            <div className="text-right space-y-1 pt-2">
                <div className="flex items-center justify-start gap-2 mb-1">
                    <h3 className="text-xl font-black text-[#202020] font-cairo">لوحة التحكم</h3>
                </div>
                <p className="text-sm md:text-base text-[#A1A1A1] font-bold font-cairo">إدارة الطلاب والحضور</p>
            </div>

            <div className="h-px bg-gray-200 w-full opacity-30" />

            {/* Title & Subtitle & History Button */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                <div className="text-right space-y-2">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#202020] font-cairo leading-tight">التواصل مع أولياء الأمور</h2>
                    <p className="text-[#A1A1A1] font-cairo text-sm md:text-lg font-medium max-w-2xl ml-auto">
                        إرسال رسائل واتساب سريعة لولي الأمر - حضور، غياب، درجات، ومصاريف
                    </p>
                </div>
                <button 
                    onClick={() => setIsHistoryOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-[14px] text-[#414141] font-bold font-cairo hover:bg-gray-50 hover:border-[#6339AC] transition-all shadow-sm group"
                >
                    <Clock className="h-5 w-5 text-[#6339AC] group-hover:scale-110 transition-transform" />
                    <span>سجل المراسلات</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch pt-2">
                {/* Right Side: Student List - Order 1 on mobile, 4 cols on desktop */}
                <div className="lg:col-span-4 h-full order-1 lg:order-1">
                    <div className="lg:sticky lg:top-8">
                        <StudentSearchList 
                            onSelect={setSelectedStudent} 
                            selectedId={selectedStudent?.id || selectedStudent?._id}
                        />
                    </div>
                </div>

                {/* Left Side: Message Area - Order 2 on mobile, 8 cols on desktop */}
                <div className="lg:col-span-8 bg-white rounded-[24px] md:rounded-[32px] border border-[#E2E2E2] p-4 sm:p-8 md:p-12 shadow-sm min-h-[450px] md:min-h-[600px] flex flex-col relative overflow-hidden order-2 lg:order-2">
                    {!selectedStudent ? (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-6 md:space-y-8">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-dashed border-[#E2E2E2] flex items-center justify-center bg-gray-50">
                                <MessageCircle className="h-12 w-12 md:h-16 md:h-16 text-[#D1D1D1]" strokeWidth={1} />
                            </div>
                            <div className="text-center space-y-2">
                                <h4 className="text-[#A1A1A1] text-lg md:text-xl font-bold font-cairo">بانتظار اختيار طالب</h4>
                                <p className="text-[#CCC] text-xs md:text-sm font-medium font-cairo">اختر طالب من القائمة الجانبية للبدء</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 flex flex-col h-full">
                            {/* Student Header Card */}
                            <div className="bg-[#F8F8FD] rounded-[20px] md:rounded-[28px] p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between border border-purple-50 gap-4 sm:gap-8">
                                <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8 text-center sm:text-right">
                                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-[16px] md:rounded-[22px] bg-white flex items-center justify-center border-2 md:border-4 border-purple-50 shadow-sm shrink-0">
                                        <User className="h-8 w-8 md:h-12 md:h-12 text-[#6339AC]" />
                                    </div>
                                    <div className="space-y-1 md:space-y-2">
                                        <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-[#202020] font-cairo">{selectedStudent.fullName}</h3>
                                        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 md:gap-3">
                                            <span className="bg-purple-100 text-[#6339AC] px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs md:text-sm font-black font-cairo">
                                                {selectedStudent.grade}
                                            </span>
                                            <span className="text-[#717171] font-bold font-cairo text-sm md:text-base">
                                                {selectedStudent.classroom || 'سنتر النور'}
                                            </span>
                                        </div>
                                        <p className="text-xs md:text-sm text-[#A1A1A1] font-bold font-cairo">
                                            الأحد والأربعاء - 6:00 م
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Templates Grid */}
                            <div className="space-y-4 md:space-y-6">
                                <div className="flex items-center justify-end gap-3 mr-2">
                                    <h5 className="text-base md:text-lg font-black text-[#202020] font-cairo">اختر نموذج رسالة</h5>
                                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
                                    {[
                                        { id: 'attendance', label: 'إشعار حضور', icon: ClipboardCheck, color: 'text-emerald-500', bg: 'hover:bg-emerald-50' },
                                        { id: 'absence', label: 'إشعار غياب', icon: UserX, color: 'text-red-500', bg: 'hover:bg-red-50' },
                                        { id: 'grades', label: 'إشعار درجات', icon: GraduationCap, color: 'text-purple-500', bg: 'hover:bg-purple-50' },
                                        { id: 'payment', label: 'تذكير بالدفع', icon: Banknote, color: 'text-amber-500', bg: 'hover:bg-amber-50' }
                                    ].map((tpl) => (
                                        <button 
                                            key={tpl.id}
                                            onClick={() => generateTemplate(tpl.id as any)}
                                            className={`flex items-center justify-between px-6 md:px-8 bg-white border-2 border-gray-50 py-4 md:py-6 rounded-[16px] md:rounded-[20px] font-black text-[#414141] font-cairo transition-all hover:scale-[1.01] sm:hover:scale-[1.02] hover:shadow-md hover:border-transparent ${tpl.bg}`}
                                        >
                                            <span className="text-sm md:text-base lg:text-lg">{tpl.label}</span>
                                            <tpl.icon className={`h-5 w-5 md:h-7 md:w-7 ${tpl.color}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message Preview Area */}
                            {message && (
                                <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-4 duration-400">
                                    <div className="flex items-center justify-end gap-3 mb-3 md:mb-4 mr-2">
                                        <h5 className="text-base md:text-lg font-black text-[#202020] font-cairo">معاينة الرسالة</h5>
                                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                    </div>
                                    <div className="bg-[#D1F7E2]/30 border-2 border-[#62D996]/20 rounded-[20px] md:rounded-[28px] p-5 sm:p-6 md:p-8 text-right whitespace-pre-wrap font-cairo text-[#065F46] text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed shadow-sm relative group">
                                        {message}
                                        <div className="absolute top-3 left-3 md:top-4 md:left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-white/80 backdrop-blur-sm p-1.5 md:p-2 rounded-full cursor-pointer hover:bg-white transition-colors border border-green-100 shadow-sm">
                                                <ClipboardCheck className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8 md:mt-10 flex justify-center">
                                        <button
                                            onClick={handleSendWhatsApp}
                                            disabled={sending}
                                            className="w-full bg-[#2CC97D] hover:bg-[#25b570] text-white py-4 md:py-6 rounded-[16px] md:rounded-[24px] font-black font-cairo text-lg md:text-xl lg:text-2xl flex items-center justify-center gap-3 md:gap-5 shadow-xl md:shadow-2xl shadow-green-200/50 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {sending ? <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin" /> : <MessageCircle className="h-6 w-6 md:h-8 md:w-8 text-white" fill="currentColor" />}
                                            <span>إرسال لولي الأمر عبر واتساب</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            <style jsx>{`
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
                .font-cairo {
                    font-family: 'Cairo', sans-serif;
                }
            `}</style>
        </div>
    );
}
