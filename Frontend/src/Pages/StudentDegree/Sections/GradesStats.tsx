import { FileText, BarChart3, Trophy } from 'lucide-react';
import { ExamStats } from '@/types/exam';

interface StatsCardsProps {
    stats: ExamStats;
    loading?: boolean;
}

export default function GradesStats({ stats, loading }: StatsCardsProps) {
    if (loading || !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-[2rem] p-8 h-40 animate-pulse border border-gray-100 shadow-sm" />
                ))}
            </div>
        );
    }

    const cards = [
        {
            label: 'إجمالي الدرجات المسجلة',
            value: stats.totalResults || 0,
            icon: <FileText className="h-7 w-7 text-purple-600" />,
            bgColor: 'bg-[#F4EFFF]',
            glowColor: 'bg-purple-100/50',
            textColor: 'text-gray-900',
            labelColor: 'text-gray-400'
        },
        {
            label: 'متوسط النسبة المئوية',
            value: `${stats.averagePercentage || 0}%`,
            icon: <BarChart3 className="h-7 w-7 text-blue-600" />,
            bgColor: 'bg-[#EBF5FF]',
            glowColor: 'bg-blue-100/50',
            textColor: 'text-gray-900',
            labelColor: 'text-gray-400'
        },
        {
            label: 'درجات ممتازة (%80+)',
            value: stats.excellentCount || 0,
            icon: <Trophy className="h-7 w-7 text-orange-500" />,
            bgColor: 'bg-[#FFF4EB]',
            glowColor: 'bg-orange-100/50',
            textColor: 'text-gray-900',
            labelColor: 'text-gray-400'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6" dir="rtl">
            {cards.map((card, idx) => (
                <div 
                    key={idx} 
                    className="relative bg-white rounded-[1.5rem] md:rounded-[1.8rem] p-5 md:p-7 border border-gray-100 shadow-sm flex items-center justify-between overflow-hidden group hover:shadow-md transition-shadow"
                >
                    {/* Decorative Glow */}
                    <div className={`absolute -top-6 -right-6 h-20 w-20 md:h-25 md:w-25 rounded-full ${card.glowColor} blur-2xl opacity-60 group-hover:opacity-80 transition-opacity`} />
                    <div className={`absolute top-0 right-0 h-20 w-20 md:h-25 md:w-25 rounded-full ${card.glowColor} -mr-8 -mt-8`} />

                    
                     {/* Content Section (Right) */}
                    <div className="text-right flex flex-col items-end relative z-10 h-full justify-between">
                        <p className={`${card.labelColor} text-sm md:text-lg font-bold mb-1 md:mb-3`}>{card.label}</p>
                        <p className={`${card.textColor} text-2xl md:text-3xl font-black`}>{card.value}</p>
                    </div>

                    {/* Icon Section (Left) */}
                    <div className={`h-[56px] w-[56px] md:h-[70px] md:w-[72px] ${card.bgColor} rounded-xl md:rounded-[1.5rem] flex items-center justify-center relative z-10`}>
                        <div className="scale-75 md:scale-100">
                            {card.icon}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
