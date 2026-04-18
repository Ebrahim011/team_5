import type { CreateSessionData } from '@/features/sessions';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CreateSessionModalProps {
    isOpen: boolean;
    isCreating: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function CreateSessionModal({
    isOpen,
    isCreating,
    onClose,
    onSubmit,
}: CreateSessionModalProps) {
    const [todayDate, setTodayDate] = useState('');

    // Set today's date when modal opens
    useEffect(() => {
        if (isOpen) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            setTodayDate(`${year}-${month}-${day}`);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white w-full sm:max-w-lg shadow-2xl relative rounded-t-[28px] sm:rounded-[30px] max-h-[92vh] sm:max-h-[85vh] overflow-hidden animate-in duration-300 fade-in slide-in-from-bottom-8 sm:zoom-in-95 sm:slide-in-from-bottom-0"
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 sm:top-6 sm:left-6 text-[#A1A1A1] hover:text-[#414141] transition-colors z-20"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-5 sm:p-8 pb-0">
                    <div className="sm:hidden w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
                    <h2 className="text-xl sm:text-2xl font-bold text-[#414141] mb-4 sm:mb-8 font-cairo text-right">
                        إضافة جلسة جديدة
                    </h2>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col max-h-[92vh] sm:max-h-[85vh]">
                    <div className="px-5 sm:px-8 space-y-5 sm:space-y-6 overflow-y-auto pb-28 scroll-pb-32">
                        <div>
                            <label className="block text-sm font-bold text-[#414141] mb-2 font-cairo text-right">
                                العنوان (اختياري)
                            </label>
                            <input
                                type="text"
                                name="title"
                                className="w-full px-5 py-3 bg-[#FCFCFC] border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#5629A3] focus:border-transparent outline-none transition-all font-cairo text-right"
                                placeholder="مثال: جلسة المراجعة النهائية"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-[#414141] mb-2 font-cairo text-right">
                                    التاريخ *
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={todayDate}
                                    onChange={(e) => setTodayDate(e.target.value)}
                                    required
                                    className="w-full px-5 py-3 bg-[#FCFCFC] border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#5629A3] focus:border-transparent outline-none transition-all font-cairo text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#414141] mb-2 font-cairo text-right">
                                    الصف *
                                </label>
                                <select
                                    name="grade"
                                    required
                                    defaultValue=""
                                    className="w-full px-5 py-3 bg-[#FCFCFC] border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#5629A3] focus:border-transparent outline-none transition-all font-cairo text-right"
                                >
                                    <option value="" disabled>اختر الصف</option>
                                    <option value="الصف الأول الإعدادي">الصف الأول الإعدادي</option>
                                    <option value="الصف الثاني الإعدادي">الصف الثاني الإعدادي</option>
                                    <option value="الصف الثالث الإعدادي">الصف الثالث الإعدادي</option>
                                    <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                                    <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                                    <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-[#414141] mb-2 font-cairo text-right">
                                    وقت البدء *
                                </label>
                                <input
                                    type="time"
                                    name="startTime"
                                    required
                                    className="w-full px-5 py-3 bg-[#FCFCFC] border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#5629A3] focus:border-transparent outline-none transition-all font-cairo text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#414141] mb-2 font-cairo text-right">
                                    وقت الانتهاء
                                </label>
                                <input
                                    type="time"
                                    name="endTime"
                                    className="w-full px-5 py-3 bg-[#FCFCFC] border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#5629A3] focus:border-transparent outline-none transition-all font-cairo text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#414141] mb-2 font-cairo text-right">
                                    سعر الحصة
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    min="0"
                                    placeholder="0.00"
                                    className="w-full px-5 py-3 bg-[#FCFCFC] border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#5629A3] focus:border-transparent outline-none transition-all font-cairo text-right"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#414141] mb-2 font-cairo text-right">ملاحظات</label>
                            <textarea
                                name="notes"
                                rows={3}
                                className="w-full px-5 py-3 bg-[#FCFCFC] border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#5629A3] focus:border-transparent outline-none transition-all font-cairo text-right resize-none"
                                placeholder="أي ملاحظات إضافية للجلسة..."
                            />
                        </div>
                    </div>

                    <div className="px-5 sm:px-8 py-4 bg-white border-t border-gray-100 sticky bottom-0">
                        <div className="flex gap-3 sm:gap-4">
                            <button
                                type="submit"
                                disabled={isCreating}
                                className="flex-1 bg-[#5629A3] text-white px-6 py-4 rounded-xl font-bold font-cairo hover:bg-[#4a238b] transition-all disabled:opacity-50 shadow-lg shadow-purple-200 active:scale-[0.98]"
                            >
                                {isCreating ? 'جاري الإنشاء...' : 'إنشاء جلسة جديدة'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-4 border border-gray-100 text-[#A1A1A1] rounded-xl font-bold font-cairo hover:bg-gray-50 transition-all active:scale-[0.98]"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
