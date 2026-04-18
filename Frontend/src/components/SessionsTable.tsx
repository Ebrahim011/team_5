'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import type { Session } from '@/features/sessions';
import { deleteSession } from '@/features/sessions';
import { useToast } from '@/components/ui';

interface SessionsTableProps {
    sessions: Session[];
    onSessionDeleted?: () => void;
}

export default function SessionsTable({ sessions, onSessionDeleted }: SessionsTableProps) {
    const router = useRouter();
    const { showToast } = useToast();

    const getStatusLabel = (status: string) => {
        const statusMap: Record<string, string> = {
            completed: 'مكتملة',
            'in-progress': 'جارية',
            cancelled: 'ملغية',
            scheduled: 'مجدولة',
        };
        return statusMap[status] || 'مجدولة';
    };

    const getStatusColor = (status: string) => {
        const colorMap: Record<string, string> = {
            completed: 'bg-green-50 text-[#22C55E]',
            'in-progress': 'bg-blue-50 text-[#3B82F6]',
            cancelled: 'bg-red-50 text-[#EF4444]',
            scheduled: 'bg-gray-50 text-[#A1A1A1]',
        };
        return colorMap[status] || 'bg-gray-50 text-[#A1A1A1]';
    };

    const handleSessionClick = (sessionId: string) => {
        // Allow opening temporary sessions for offline attendance tracking
        router.push(`/dashboard/sessions/${sessionId}`);
    };

    const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation(); // Prevent row click

        if (!confirm('هل أنت متأكد من حذف هذه الجلسة؟')) {
            return;
        }

        try {
            await deleteSession(sessionId);
            if (onSessionDeleted) {
                onSessionDeleted();
            }
            showToast('تم حذف الجلسة بنجاح', 'success');
        } catch (error) {
            console.error('Failed to delete session:', error);
            showToast('فشل في حذف الجلسة', 'error');
        }
    };

    return (
        <div>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
                {sessions.map((session, index) => {
                    const id = (session.id || session._id || `session-${index}`).toString();
                    const sessionId = (session.id || session._id || '').toString();
                    const isPending = sessionId.startsWith('temp_');
                    const title = session.title || `جلسة ${session.grade}`;
                    const dateLabel = new Date(session.date).toLocaleDateString('ar-EG');
                    const timeLabel = `${session.startTime}${session.endTime ? ` - ${session.endTime}` : ''}`;
                    return (
                        <div
                            key={id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSessionClick(sessionId)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') handleSessionClick(sessionId);
                            }}
                            className={`bg-white rounded-2xl border shadow-sm p-4 active:scale-[0.99] transition ${isPending
                                ? 'border-amber-200 bg-amber-50/30 cursor-pointer'
                                : 'border-gray-100 cursor-pointer'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {isPending && (
                                            <span className="px-3 py-1 rounded-full text-xs font-bold font-cairo bg-amber-100 text-amber-700">
                                                ⏳ في انتظار المزامنة
                                            </span>
                                        )}
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold font-cairo ${getStatusColor(session.status)}`}>
                                            {getStatusLabel(session.status)}
                                        </span>
                                        <span className="bg-purple-50 text-[#5629A3] px-3 py-1 rounded-full text-xs font-bold font-cairo">
                                            {session.grade}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-[#414141] font-bold font-cairo truncate">
                                        {title}
                                    </div>
                                    <div className="mt-2 flex flex-wrap justify-end gap-x-3 gap-y-1 text-sm text-[#A1A1A1] font-cairo">
                                        <span>{dateLabel}</span>
                                        <span dir="ltr">{timeLabel}</span>
                                    </div>
                                </div>
                                {!isPending && (
                                    <button
                                        onClick={(e) => handleDeleteSession(e, sessionId)}
                                        className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition-colors"
                                        title="حذف الجلسة"
                                        aria-label="حذف الجلسة"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>

                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="px-6 py-5 text-sm font-bold text-[#414141] font-cairo">العنوان</th>
                            <th className="px-6 py-5 text-sm font-bold text-[#414141] font-cairo">التاريخ</th>
                            <th className="px-6 py-5 text-sm font-bold text-[#414141] font-cairo">الوقت</th>
                            <th className="px-6 py-5 text-sm font-bold text-[#414141] font-cairo">الصف</th>
                            <th className="px-6 py-5 text-sm font-bold text-[#414141] font-cairo">الحالة</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {sessions.map((session, index) => {
                            const sessionId = (session.id || session._id || '').toString();
                            const isPending = sessionId.startsWith('temp_');
                            return (
                                <tr
                                    key={session.id || session._id || `session-${index}`}
                                    className={`group transition-colors ${isPending
                                        ? 'bg-amber-50/30 hover:bg-amber-50/50 cursor-pointer'
                                        : 'hover:bg-[#FCFCFC] cursor-pointer'
                                        }`}
                                    onClick={() => handleSessionClick(sessionId)}
                                >
                                    <td className="px-6 py-5 text-[#414141] font-bold font-cairo">
                                        {session.title || `جلسة ${session.grade}`}
                                    </td>
                                    <td className="px-6 py-5 text-[#A1A1A1] font-cairo">
                                        {new Date(session.date).toLocaleDateString('ar-EG')}
                                    </td>
                                    <td className="px-6 py-5 text-[#A1A1A1] font-cairo">
                                        <span dir="ltr">{session.startTime}{session.endTime ? ` - ${session.endTime}` : ''}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="bg-purple-50 text-[#5629A3] px-4 py-1.5 rounded-[10px] text-sm font-bold font-cairo">
                                            {session.grade}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 justify-end">
                                            {isPending && (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold font-cairo bg-amber-100 text-amber-700">
                                                    ⏳ في انتظار المزامنة
                                                </span>
                                            )}
                                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold font-cairo ${getStatusColor(session.status)}`}>
                                                {getStatusLabel(session.status)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {!isPending && (
                                            <button
                                                onClick={(e) => handleDeleteSession(e, session.id || session._id || '')}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                title="حذف الجلسة"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
