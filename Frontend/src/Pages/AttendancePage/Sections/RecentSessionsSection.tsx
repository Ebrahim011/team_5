import { Calendar, Clock } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import SessionsTable from '@/components/SessionsTable';
import type { Session } from '@/features/sessions';

interface RecentSessionsSectionProps {
    sessions: Session[];
    loading: boolean;
    onCreateClick: () => void;
    onSessionDeleted?: () => void;
}

export default function RecentSessionsSection({
    sessions,
    loading,
    onCreateClick,
    onSessionDeleted,
}: RecentSessionsSectionProps) {
    // During static generation, sessions might be undefined
    const safeSessions = sessions || [];
    
    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-base sm:text-xl font-extrabold text-[#414141] flex items-center gap-2 font-cairo justify-end">
                    <span>الجلسات الحديثة</span>
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-[#5629A3]" />
                </h3>
            </div>

            {loading ? (
                <div className="bg-white rounded-[20px] p-6 sm:p-12 text-center border border-gray-100 min-h-[260px] sm:min-h-[400px] flex items-center justify-center">
                    <p className="text-[#A1A1A1] font-cairo text-base sm:text-lg">جاري التحميل...</p>
                </div>
            ) : safeSessions.length === 0 ? (
                <div className="bg-white rounded-[20px] p-6 sm:p-12 border border-gray-100 min-h-[260px] sm:min-h-[420px] flex items-center justify-center shadow-sm">
                    <EmptyState
                        icon={Calendar}
                        title="لا توجد جلسات بعد"
                        description="أنشئ جلسة جديدة لتسجيل حضور الطلاب"
                        actionLabel="إنشاء أول جلسة"
                        onAction={onCreateClick}
                    />
                </div>
            ) : (
                <div className="bg-white rounded-[20px] p-4 sm:p-6 border border-gray-100 shadow-sm overflow-hidden">
                    <SessionsTable sessions={safeSessions} onSessionDeleted={onSessionDeleted} />
                </div>
            )}
        </div>
    );
}
