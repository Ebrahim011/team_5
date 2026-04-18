import { Calendar, Users, LogOut } from 'lucide-react';
import StatCard from '@/components/StatCard';
import type { SessionStats } from '@/features/sessions';

interface StatsSectionProps {
    stats: SessionStats;
}

function MiniStatCard({
    title,
    value,
    icon: Icon,
    accent = 'purple',
}: {
    title: string;
    value: number;
    icon: typeof Calendar;
    accent?: 'purple' | 'green' | 'blue';
}) {
    const accentStyles: Record<
        NonNullable<Parameters<typeof MiniStatCard>[0]['accent']>,
        { ring: string; iconBg: string; iconColor: string; badge: string }
    > = {
        purple: {
            ring: 'ring-purple-500/10',
            iconBg: 'bg-purple-50',
            iconColor: 'text-[#5629A3]',
            badge: 'bg-purple-50 text-[#5629A3]',
        },
        green: {
            ring: 'ring-emerald-500/10',
            iconBg: 'bg-emerald-50',
            iconColor: 'text-[#22C55E]',
            badge: 'bg-emerald-50 text-[#22C55E]',
        },
        blue: {
            ring: 'ring-blue-500/10',
            iconBg: 'bg-blue-50',
            iconColor: 'text-[#3B82F6]',
            badge: 'bg-blue-50 text-[#3B82F6]',
        },
    };

    const s = accentStyles[accent];

    return (
        <div className={`rounded-3xl bg-white border border-black/5 shadow-sm ring-1 ${s.ring}`}>
            <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-12 w-12 rounded-2xl ${s.iconBg} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-6 w-6 ${s.iconColor}`} />
                    </div>
                    <div className="min-w-0 text-right">
                        <div className="text-xs text-[#A1A1A1] font-cairo truncate">{title}</div>
                        <div className="mt-1 text-2xl font-extrabold text-[#414141] font-cairo leading-none">
                            {value}
                        </div>
                    </div>
                </div>
                <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold font-cairo ${s.badge}`}>
                    اليوم
                </span>
            </div>
        </div>
    );
}

export default function StatsSection({ stats }: StatsSectionProps) {
    // During static generation, stats might be undefined
    if (!stats) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-3xl p-4 sm:p-8 h-24 sm:h-40 animate-pulse border border-gray-100 shadow-sm" />
                ))}
            </div>
        );
    }

    return (
        <>
            {/* Mobile: compact premium cards */}
            <div className="sm:hidden grid grid-cols-1 gap-3 mb-4">
                <MiniStatCard title="جلسات اليوم" value={stats.todaySessions} icon={Calendar} accent="purple" />
                <MiniStatCard title="الحاضرين اليوم" value={stats.todayPresent} icon={Users} accent="green" />
                <MiniStatCard title="المنصرفين" value={stats.todayAbsent} icon={LogOut} accent="blue" />
            </div>

            {/* Tablet/Desktop: existing larger stat cards */}
            <div className="hidden sm:grid grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="جلسات اليوم"
                    value={stats.todaySessions}
                    icon={Calendar}
                    iconBgColor="bg-purple-50"
                    iconColor="text-[#5629A3]"
                    bubbleColor="#5629A3"
                />
                <StatCard
                    title="الحاضرين اليوم"
                    value={stats.todayPresent}
                    icon={Users}
                    iconBgColor="bg-green-50"
                    iconColor="text-[#22C55E]"
                    bubbleColor="#22C55E"
                />
                <StatCard
                    title="المنصرفين"
                    value={stats.todayAbsent}
                    icon={LogOut}
                    iconBgColor="bg-blue-50"
                    iconColor="text-[#3B82F6]"
                    bubbleColor="#3B82F6"
                />
            </div>
        </>
    );
}
