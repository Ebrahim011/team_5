import { useState } from 'react';
import { Search, Calendar, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

interface GradesTableProps {
    results: any[];
    loading?: boolean;
    onSearch?: (code: string) => void;
    onEdit?: (result: any) => void;
    onDelete?: (id: string) => void;
    pagination?: PaginationInfo;
    onPageChange?: (page: number) => void;
}

export default function GradesTable({ results, loading, onSearch, onEdit, onDelete, pagination, onPageChange }: GradesTableProps) {
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');

    // During static generation, results might be undefined
    const safeResults = results || [];
    const filteredResults = safeResults.filter(result => 
        result.studentCode?.toString().includes(searchQuery) ||
        result.studentName?.includes(searchQuery)
    );

    const handleSearchCheck = () => {
        if (searchQuery && filteredResults.length === 0) {
            showToast('لا يوجد طالب بهذا الكود او الاسم', 'error');
        }
    };

    if (loading) {
        return <div className="animate-pulse h-64 bg-white rounded-3xl border border-gray-100" />;
    }

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden" dir="rtl">
            {/* Table Header with Search */}
            <div className="px-6 py-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-50 p-2.5 rounded-2xl">
                        <Calendar className="h-6 w-6 text-purple-500" />
                    </div>
                    <h3 className="font-bold text-xl text-gray-800">سجل جميع الدرجات</h3>
                </div>
                
                <div className="relative group">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchCheck()}
                        placeholder="أدخل كود الطالب" 
                        className="w-full md:w-80 pl-4 pr-11 py-3 rounded-2xl border border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-50/50 outline-none transition-all text-right font-medium"
                    />
                    <button 
                        onClick={handleSearchCheck}
                        className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors text-gray-400 hover:text-purple-600"
                    >
                        <Search className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right border-collapse">
                    <thead className="bg-[#f8f7ff]">
                        <tr>
                            <th className="px-3 py-3 text-xs font-bold text-purple-700 whitespace-nowrap">اسم الطالب</th>
                            <th className="px-3 py-3 text-xs font-bold text-purple-700 text-center whitespace-nowrap">كود الطالب</th>
                            <th className="px-3 py-3 text-xs font-bold text-purple-700 whitespace-nowrap min-w-[120px]">اسم الامتحان</th>
                            <th className="px-3 py-3 text-xs font-bold text-purple-700 text-center whitespace-nowrap">الدرجة</th>
                            <th className="px-3 py-3 text-xs font-bold text-purple-700 text-center whitespace-nowrap">النسبة</th>
                            <th className="px-3 py-3 text-xs font-bold text-purple-700 text-center whitespace-nowrap">التاريخ</th>
                            <th className="px-3 py-3 text-xs font-bold text-purple-700 text-right whitespace-nowrap min-w-[100px]">ملاحظات</th>
                            <th className="px-3 py-3 text-xs font-bold text-purple-700 text-center whitespace-nowrap w-24">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredResults.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-400 font-medium">
                                    {searchQuery ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد درجات مسجلة حالياً'}
                                </td>
                            </tr>
                        ) : (
                            filteredResults.map((result) => (
                                <tr key={result.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-3 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">
                                        {result.studentName}
                                    </td>
                                    <td className="px-3 py-3 text-center text-xs font-mono font-medium text-purple-600 bg-purple-50/30 rounded-lg whitespace-nowrap">
                                        #{result.studentCode}
                                    </td>
                                    <td className="px-3 py-3 text-sm font-medium text-gray-600 whitespace-nowrap">
                                        {result.examName}
                                    </td>
                                    <td className="px-3 py-3 text-center text-sm font-bold text-gray-700 whitespace-nowrap">
                                        {result.score}/{result.fullMark}
                                    </td>
                                    <td className="px-3 py-3 text-center whitespace-nowrap">
                                        <span className={`text-sm font-bold ${
                                            result.percentage >= 80 ? 'text-green-500' :
                                            result.percentage >= 50 ? 'text-blue-500' :
                                            'text-red-500'
                                        }`}>
                                            {result.percentage}%
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">
                                        {new Date(result.date).toLocaleDateString('ar-EG')}
                                    </td>
                                    <td className="px-3 py-3 text-right text-xs font-medium text-gray-400 max-w-[150px] truncate" title={result.notes || ''}>
                                        {result.notes || '-'}
                                    </td>
                                    <td className="px-3 py-3 text-center whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {onEdit && (
                                                <button
                                                    onClick={() => onEdit(result)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="تعديل"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => {
                                                        if (confirm('هل أنت متأكد من حذف هذه الدرجة؟')) {
                                                            onDelete(result.id);
                                                        }
                                                    }}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="حذف"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600 font-medium">
                        عرض {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} من {pagination.total}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onPageChange && onPageChange(pagination.page - 1)}
                            disabled={!pagination.hasPrevPage}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                                pagination.hasPrevPage
                                    ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <ChevronRight className="h-4 w-4 inline" />
                            السابق
                        </button>
                        
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                let pageNum;
                                if (pagination.totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (pagination.page <= 3) {
                                    pageNum = i + 1;
                                } else if (pagination.page >= pagination.totalPages - 2) {
                                    pageNum = pagination.totalPages - 4 + i;
                                } else {
                                    pageNum = pagination.page - 2 + i;
                                }
                                
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => onPageChange && onPageChange(pageNum)}
                                        className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                                            pagination.page === pageNum
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => onPageChange && onPageChange(pagination.page + 1)}
                            disabled={!pagination.hasNextPage}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                                pagination.hasNextPage
                                    ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            التالي
                            <ChevronLeft className="h-4 w-4 inline" />
                        </button>
                    </div>
                </div>
            )}
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #c4b5fd;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #a78bfa;
                }
            `}</style>
        </div>
    );
}
