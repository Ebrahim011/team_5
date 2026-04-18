'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Mail, Phone, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';
import { createAssistant, getAssistants, updateAssistant, deleteAssistant, type CreateAssistantData, type Assistant } from '@/features/assistants';
import { useToast } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function AssistantsPage() {
    const { showToast } = useToast();
    const { user } = useAuth();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [assistants, setAssistants] = useState<Assistant[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
    });
    const [editData, setEditData] = useState({
        name: '',
        phone: '',
    });

    useEffect(() => {
        // Check if user has permission
        if (user && user.role !== 'teacher' && user.role !== 'admin') {
            const errorMsg = 'لا تملك صلاحية للوصول إلى هذه الصفحة. دورك الحالي: ' + (user.role || 'غير محدد') + '. يرجى تسجيل الخروج والدخول مرة أخرى لتحديث الدور.';
            showToast(errorMsg, 'error');
            setTimeout(() => {
                router.push(ROUTES.DASHBOARD);
            }, 3000);
            return;
        }
        
        if (user) {
            fetchAssistants();
        }
    }, [user]);

    const fetchAssistants = async () => {
        try {
            setLoading(true);
            const response = await getAssistants();
            setAssistants(response.data.assistants || []);
        } catch (error: any) {
            console.error('Failed to fetch assistants:', error);
            console.error('Error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
                userRole: user?.role,
            });
            
            // Handle different error scenarios
            let errorMessage = 'فشل في جلب قائمة المساعدين';
            
            if (error.response) {
                // Server responded with error
                const status = error.response.status;
                const data = error.response.data;
                
                if (status === 403) {
                    errorMessage = 'لا تملك صلاحية للوصول إلى هذه الصفحة. ';
                    if (user?.role) {
                        errorMessage += `دورك الحالي: ${user.role}. `;
                    }
                    errorMessage += 'يرجى التأكد من أن دورك في قاعدة البيانات هو "teacher" أو "admin"، ثم سجّل خروج ودخول مرة أخرى.';
                } else if (status === 401) {
                    errorMessage = 'يجب تسجيل الدخول للوصول إلى هذه الصفحة';
                } else if (data?.message) {
                    errorMessage = data.message;
                } else if (typeof data === 'string') {
                    errorMessage = data;
                } else if (data?.error?.message) {
                    errorMessage = data.error.message;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const assistantData: CreateAssistantData = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                phone: formData.phone?.trim() || undefined,
            };

            await createAssistant(assistantData);
            showToast('تم إنشاء حساب المساعد بنجاح', 'success');
            
            // Reset form
            setFormData({
                name: '',
                email: '',
                password: '',
                phone: '',
            });
            
            // Refresh list
            await fetchAssistants();
        } catch (error: any) {
            console.error('Failed to create assistant:', error);
            
            // Handle validation errors
            let errorMessage = 'فشل في إنشاء حساب المساعد';
            
            if (error.response?.data) {
                const data = error.response.data;
                
                // Check for validation errors array
                if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
                    // Show first error or combine all errors
                    const firstError = data.errors[0];
                    errorMessage = `${firstError.field}: ${firstError.message}`;
                    
                    // If multiple errors, show them all
                    if (data.errors.length > 1) {
                        const allErrors = data.errors.map((err: any) => `${err.field}: ${err.message}`).join(' | ');
                        errorMessage = allErrors;
                    }
                } else if (data.message) {
                    errorMessage = data.message;
                }
            }
            
            showToast(errorMessage, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (assistant: Assistant) => {
        setEditingId(assistant.id || assistant._id || '');
        setEditData({
            name: assistant.name,
            phone: assistant.phone || '',
        });
    };

    const handleUpdate = async (id: string) => {
        try {
            await updateAssistant(id, editData);
            showToast('تم تحديث بيانات المساعد بنجاح', 'success');
            setEditingId(null);
            await fetchAssistants();
        } catch (error: any) {
            console.error('Failed to update assistant:', error);
            showToast(error.response?.data?.message || 'فشل في تحديث بيانات المساعد', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المساعد؟')) {
            return;
        }

        try {
            await deleteAssistant(id);
            showToast('تم حذف حساب المساعد بنجاح', 'success');
            await fetchAssistants();
        } catch (error: any) {
            console.error('Failed to delete assistant:', error);
            showToast(error.response?.data?.message || 'فشل في حذف حساب المساعد', 'error');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Page Title */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">إدارة المساعدين</h2>
                <p className="text-gray-500 text-sm">أضف وادير حسابات المساعدين</p>
            </div>

            {/* Create Assistant Form */}
            <div className="bg-white rounded-2xl p-6 border-2 border-black/5 shadow-md shadow-black/10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100">
                        <UserPlus className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">إضافة مساعد جديد</h3>
                        <p className="text-sm text-gray-500">إنشاء حساب جديد للمساعد</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                الاسم الكامل
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="ادخل اسم المساعد"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                البريد الإلكتروني
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="example@email.com"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                كلمة المرور
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="8 أحرف على الأقل"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                required
                                minLength={8}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                رقم الهاتف (اختياري)
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="xxxxxxxxxxx"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <UserPlus className="h-5 w-5" />
                            {submitting ? 'جاري الإضافة...' : 'إضافة مساعد'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Assistants List */}
            <div className="bg-white rounded-2xl border-2 border-black/5 shadow-md shadow-black/10 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">قائمة المساعدين</h3>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
                ) : assistants.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">لا يوجد مساعدين مسجلين</div>
                ) : (
                    <>
                        {/* Mobile cards */}
                        <div className="md:hidden p-4 space-y-3">
                            {assistants.map((assistant) => {
                                const assistantId = assistant.id || assistant._id || '';
                                const isEditing = editingId === assistantId;
                                const createdLabel = assistant.createdAt
                                    ? new Date(assistant.createdAt).toLocaleDateString('ar-EG')
                                    : '—';
                                const phone = (assistant.phone || '').trim();
                                const initial = (assistant.name || 'A').trim().charAt(0).toUpperCase();

                                return (
                                    <div
                                        key={assistantId}
                                        className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden"
                                    >
                                        <div className="p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-500 text-white flex items-center justify-center font-extrabold shrink-0">
                                                        {initial}
                                                    </div>
                                                    <div className="min-w-0 text-right">
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                name="name"
                                                                value={editData.name}
                                                                onChange={handleEditInputChange}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500"
                                                            />
                                                        ) : (
                                                            <div className="text-base font-extrabold text-gray-900 truncate">
                                                                {assistant.name}
                                                            </div>
                                                        )}

                                                        <div className="mt-1 flex items-center justify-end gap-2 text-xs text-gray-500">
                                                            <span className="inline-flex items-center gap-1 truncate max-w-[220px]">
                                                                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                                                                <span className="truncate">{assistant.email}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdate(assistantId)}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-2xl transition-colors"
                                                                title="حفظ"
                                                                aria-label="حفظ"
                                                            >
                                                                <Check className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingId(null)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
                                                                title="إلغاء"
                                                                aria-label="إلغاء"
                                                            >
                                                                <X className="h-5 w-5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleEdit(assistant)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-2xl transition-colors"
                                                                title="تعديل"
                                                                aria-label="تعديل"
                                                            >
                                                                <Edit2 className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(assistantId)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
                                                                title="حذف"
                                                                aria-label="حذف"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-3 grid grid-cols-2 gap-2">
                                                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
                                                    <div className="text-[11px] text-gray-500">الهاتف</div>
                                                    {isEditing ? (
                                                        <input
                                                            type="tel"
                                                            name="phone"
                                                            value={editData.phone}
                                                            onChange={handleEditInputChange}
                                                            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 bg-white"
                                                            placeholder="xxxxxxxxxxx"
                                                        />
                                                    ) : phone ? (
                                                        <a
                                                            href={`tel:${phone}`}
                                                            className="mt-1 inline-flex items-center gap-2 text-sm font-bold text-gray-900"
                                                        >
                                                            <Phone className="h-4 w-4 text-gray-400" />
                                                            <span dir="ltr">{phone}</span>
                                                        </a>
                                                    ) : (
                                                        <div className="mt-1 text-sm font-bold text-gray-400">—</div>
                                                    )}
                                                </div>
                                                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
                                                    <div className="text-[11px] text-gray-500">تاريخ الإنشاء</div>
                                                    <div className="mt-1 text-sm font-bold text-gray-900">{createdLabel}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">الاسم</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">البريد الإلكتروني</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">الهاتف</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">تاريخ الإنشاء</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {assistants.map((assistant) => {
                                    const assistantId = assistant.id || assistant._id || '';
                                    const isEditing = editingId === assistantId;
                                    
                                    return (
                                        <tr key={assistantId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={editData.name}
                                                        onChange={handleEditInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                    />
                                                ) : (
                                                    <span className="text-gray-800 font-medium">{assistant.name}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-gray-400" />
                                                    {assistant.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {isEditing ? (
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        value={editData.phone}
                                                        onChange={handleEditInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                    />
                                                ) : (
                                                    assistant.phone ? (
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-4 w-4 text-gray-400" />
                                                            {assistant.phone}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {new Date(assistant.createdAt).toLocaleDateString('ar-EG')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdate(assistantId)}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="حفظ"
                                                            >
                                                                <Check className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingId(null)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="إلغاء"
                                                            >
                                                                <X className="h-5 w-5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleEdit(assistant)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="تعديل"
                                                            >
                                                                <Edit2 className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(assistantId)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="حذف"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

