import { Plus } from 'lucide-react';

interface PageHeaderProps {
    onCreateClick: () => void;
}

export default function PageHeader({ onCreateClick }: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="text-right">
                <h1 className="font-bold text-2xl sm:text-[40px] text-[#414141] leading-tight font-cairo">إدارة الجلسات</h1>
                <p className="text-[#A1A1A1] text-sm sm:text-lg font-cairo">أنشئ جلسة جديدة لتسجيل حضور الطلاب</p>
            </div>
            <button
                onClick={onCreateClick}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#5629A3] text-white px-4 sm:px-6 py-3 rounded-[12px] font-medium text-base sm:text-[20.07px] font-cairo hover:bg-[#4a238b] transition-all shadow-md active:scale-95"
            >
                <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>إضافة جلسة</span>
            </button>
        </div>
    );
}
