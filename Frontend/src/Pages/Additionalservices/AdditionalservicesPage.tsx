'use client';

import { useState, useEffect } from 'react';
import { Gift, Plus, Search, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui';
import { Spinner } from '@/components/ui';
import EmptyState from '@/components/EmptyState';
import { createServiceRequest, getServiceRequests, deleteServiceRequest, type ServiceRequest } from '@/features/additional-services/api/serviceApi';
import { getStudents, type Student } from '@/features/students';

export default function AdditionalservicesPage() {
    const { showToast } = useToast();
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [serviceName, setServiceName] = useState('');
    const [price, setPrice] = useState<string>('');
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    
    // Student search state
    const [search, setSearch] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [studentsLoading, setStudentsLoading] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (search && !selectedStudent) fetchStudents();
            else setStudents([]);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search, selectedStudent]);

    const fetchRequests = async () => {
        try {
            const res = await getServiceRequests();
            setRequests(res.data);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        setStudentsLoading(true);
        try {
            const res = await getStudents(search);
            setStudents(res.data);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setStudentsLoading(false);
        }
    };

    const handleAddService = async () => {
        if (!selectedStudent) {
            showToast('من فضلك اختر طالب أولاً', 'error');
            return;
        }
        if (!serviceName || !price) {
            showToast('من فضلك أدخل نوع الخدمة والسعر', 'error');
            return;
        }

        setSubmitting(true);
        try {
            await createServiceRequest({
                studentId: selectedStudent.id || selectedStudent._id!,
                serviceName,
                price: parseFloat(price),
            });
            showToast('تم إضافة الخدمة بنجاح', 'success');
            setServiceName('');
            setPrice('');
            setSelectedStudent(null);
            setSearch('');
            setStudents([]);
            fetchRequests();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'فشل في إضافة الخدمة', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteService = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
            return;
        }

        setDeletingId(id);
        try {
            await deleteServiceRequest(id);
            showToast('تم حذف الخدمة بنجاح', 'success');
            fetchRequests();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'فشل في حذف الخدمة', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10" dir="rtl">
            {/* Page Header */}
            <div className="text-right space-y-1">
                <h3 className="text-2xl font-bold text-[#202020] font-cairo">لوحة التحكم</h3>
                <p className="text-sm text-[#A1A1A1] font-cairo">إدارة الطلاب والحضور</p>
            </div>
            <div className="h-[1px] bg-[#E2E2E2] w-full" />

            {/* Title & Subtitle */}
            <div className="text-right">
                <h2 className="text-3xl font-bold text-[#202020] font-cairo mb-2">الخدمات الإضافية</h2>
                <p className="text-[#A1A1A1] font-cairo text-sm">إضافة مراجعات، ملازم، وخدمات إضافية للطلاب</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Right Side: Add Form (Swapped for RTL consistency) */}
                <div className="lg:col-span-4 lg:order-1">
                    <div className="bg-white rounded-[12px] border border-[#E2E2E2] p-8 shadow-none">
                        <div className="flex items-center gap-2 mb-6">
                            <Plus className="h-5 w-5 text-[#5629A3]" />
                            <h3 className="text-xl font-bold text-[#202020] font-cairo">إضافة خدمة جديدة</h3>
                        </div>

                        <div className="space-y-6">
                            {/* Student Search */}
                            <div>
                                <label className="block text-right text-sm font-bold text-[#202020] font-cairo mb-2">بحث عن طالب</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="أدخل كود الطالب"
                                        className="w-full bg-white border border-[#E2E2E2] rounded-[8px] py-3 pl-10 pr-4 text-right font-cairo text-sm focus:outline-none focus:border-[#5629A3] transition-all"
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            if (selectedStudent) setSelectedStudent(null);
                                        }}
                                    />
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-[#B8B8B8]" />
                                    </div>
                                </div>
                                
                                {/* Student Search Results */}
                                {search && !selectedStudent && (
                                    <div className="mt-2 bg-white border border-[#E2E2E2] rounded-[8px] overflow-hidden shadow-lg max-h-[200px] overflow-y-auto z-10">
                                        {studentsLoading ? (
                                            <div className="p-4 flex justify-center"><Spinner /></div>
                                        ) : students.length > 0 ? (
                                            students.map((student) => (
                                                <button
                                                    key={student.id || student._id}
                                                    onClick={() => {
                                                        setSelectedStudent(student);
                                                        setSearch(student.fullName);
                                                        setStudents([]);
                                                    }}
                                                    className="w-full text-right p-3 hover:bg-[#F2EEFF] transition-all border-b border-[#F5F5F5] last:border-none"
                                                >
                                                    <div className="font-bold text-[#414141] font-cairo text-sm">{student.fullName}</div>
                                                    <div className="text-[11px] text-[#A1A1A1] font-cairo">{student.grade}</div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-sm text-[#A1A1A1] font-cairo">لا توجد نتائج</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Service Name */}
                            <div>
                                <label className="block text-right text-sm font-bold text-[#202020] font-cairo mb-2">نوع الخدمة</label>
                                <input
                                    type="text"
                                    placeholder="أدخل الخدمة"
                                    className="w-full bg-white border border-[#E2E2E2] rounded-[8px] py-3 px-4 text-right font-cairo text-sm focus:outline-none focus:border-[#5629A3] transition-all"
                                    value={serviceName}
                                    onChange={(e) => setServiceName(e.target.value)}
                                />
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block text-right text-sm font-bold text-[#202020] font-cairo mb-2">السعر</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full bg-white border border-[#E2E2E2] rounded-[8px] py-3 pr-4 pl-12 text-right font-cairo text-sm focus:outline-none focus:border-[#5629A3] transition-all"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                    />
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#A1A1A1] font-cairo text-sm">
                                        ج.م
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleAddService}
                                disabled={submitting}
                                className="w-full bg-[#5629A3] text-white py-3 rounded-[8px] font-bold font-cairo hover:bg-[#4a238b] transition-all shadow-none active:scale-95 disabled:opacity-50 disabled:scale-100 mt-4"
                            >
                                {submitting ? 'جاري الإضافة...' : 'إضافة الخدمة'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Left Side: Services List */}
                <div className="lg:col-span-8 lg:order-2 bg-white rounded-[12px] border border-[#E2E2E2] p-8 shadow-none min-h-[500px] flex flex-col">
                    {requests.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <EmptyState
                                icon={Gift}
                                title="لا توجد خدمات مسجلة"
                                description="أضف خدمة جديدة للبدء في تتبع الخدمات الإضافية للطلاب"
                            />
                        </div>
                    ) : (
                        
                         <div className="w-full h-full flex flex-col">
                             <div className="flex items-center gap-3 mb-6">
                                <Gift className="h-5 w-5 text-[#5629A3]" />
                                <h3 className="text-xl font-bold text-[#202020] font-cairo">الخدمات المسجلة حديثاً</h3>
                            </div>
                            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1 custom-scrollbar">
                                {requests.map((request) => (
                                    <div key={request.id || request._id} className="flex items-center justify-between p-4 bg-[#F5F5F5] rounded-[8px] border border-transparent hover:border-[#F2EEFF] transition-all">
                                        <div className="text-right flex-1">
                                            <div className="font-bold text-[#414141] font-cairo text-sm">{(request.student as any)?.fullName || 'طالب محذوف'}</div>
                                            <div className="text-xs text-[#A1A1A1] font-cairo">{(request.service as any)?.name || 'خدمة غير محددة'}</div>
                                        </div>
                                        <div className="text-left flex items-center gap-3">
                                            <div>
                                                <div className="font-bold text-[#5629A3] font-cairo text-sm">{(request.service as any)?.price || 0} ج.م</div>
                                                <div className="text-[10px] text-[#A1A1A1] font-cairo">{new Date(request.createdAt).toLocaleDateString('ar-EG')}</div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteService(request.id || request._id!)}
                                                disabled={deletingId === (request.id || request._id!)}
                                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-[8px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="حذف الخدمة"
                                            >
                                                {deletingId === (request.id || request._id!) ? (
                                                    <Spinner size="sm" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
}
