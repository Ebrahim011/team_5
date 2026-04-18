'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    getSessionById,
    updateSessionStatus,
    endSession,
    addStudentToSession,
    getSessionAttendance,
    removeStudentFromSession,
    updateAttendanceStatus,
} from '@/features/sessions';
import type { Session } from '@/features/sessions';
import type { SessionAttendance } from '@/features/sessions';
import { Spinner, useToast } from '@/components/ui';
import { Users, DollarSign, ChevronRight, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { scanAttendance } from '@/features/attendance';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { queueAction, syncPendingActions, getSessionPendingActions } from '@/lib/offline-sync';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function SessionControlPage() {
    const router = useRouter();
    const params = useParams();
    const sessionId = (params?.sessionId as string) || '';
    const { showToast } = useToast();
    const { user } = useAuth();
    const isAssistant = user?.role === 'assistant';
    const isMobile = useIsMobile();

    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [studentSearch, setStudentSearch] = useState('');
    const [attendanceCount, setAttendanceCount] = useState(0);
    const [attendances, setAttendances] = useState<SessionAttendance[]>([]);
    const [addingStudent, setAddingStudent] = useState(false);
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [scanState, setScanState] = useState<'idle' | 'starting' | 'scanning' | 'error'>('idle');
    const [selectedAttendance, setSelectedAttendance] = useState<SessionAttendance | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lastScanRef = useRef<{ token: string; at: number } | null>(null);
    const cooldownRef = useRef<number>(0);
    const regionId = 'qr-reader-session';

    // Helper function to save attendances to localStorage (especially for temp sessions)
    const saveAttendancesToCache = (attendancesList: SessionAttendance[]) => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(`session_${sessionId}_attendances`, JSON.stringify(attendancesList));
            localStorage.setItem(`session_${sessionId}_cache_time`, Date.now().toString());
        } catch (storageError) {
            console.warn('Failed to save attendances to cache:', storageError);
        }
    };

    // Helper function to save session data to localStorage (for mobile offline support)
    const saveSessionToCache = (sessionData: Session | null) => {
        if (typeof window === 'undefined' || !sessionData) return;
        try {
            localStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionData));
            localStorage.setItem(`session_${sessionId}_cache_time`, Date.now().toString());
        } catch (storageError) {
            console.warn('Failed to save session to cache:', storageError);
        }
    };

    // Optimized cache save (using requestIdleCallback for better performance)
    // Works for all devices to ensure data is available when going offline
    const saveCacheTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const saveToCacheOptimized = (attendancesList: SessionAttendance[], sessionData?: Session | null) => {
        if (typeof window === 'undefined') return;
        
        // Clear previous timeout
        if (saveCacheTimeoutRef.current) {
            clearTimeout(saveCacheTimeoutRef.current);
        }
        
        // Use requestIdleCallback if available (better performance), otherwise use setTimeout
        const saveToCache = () => {
            try {
                // Use requestIdleCallback for non-blocking save
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(() => {
                        try {
                            if (attendancesList) {
                                localStorage.setItem(`session_${sessionId}_attendances`, JSON.stringify(attendancesList));
                            }
                            if (sessionData) {
                                localStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionData));
                            }
                            localStorage.setItem(`session_${sessionId}_cache_time`, Date.now().toString());
                        } catch (storageError) {
                            console.warn('Failed to save to cache:', storageError);
                        }
                    }, { timeout: 1000 });
                } else {
                    // Fallback: use setTimeout with minimal delay
                    setTimeout(() => {
                        try {
                            if (attendancesList) {
                                localStorage.setItem(`session_${sessionId}_attendances`, JSON.stringify(attendancesList));
                            }
                            if (sessionData) {
                                localStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionData));
                            }
                            localStorage.setItem(`session_${sessionId}_cache_time`, Date.now().toString());
                        } catch (storageError) {
                            console.warn('Failed to save to cache:', storageError);
                        }
                    }, 0);
                }
            } catch (error) {
                // Silent fail - don't block UI
            }
        };
        
        // Debounce: wait 300ms before saving (reduced from 500ms for better responsiveness)
        saveCacheTimeoutRef.current = setTimeout(saveToCache, 300);
    };

    // Auto-save to cache when data changes (works for all devices)
    // This ensures data is always available when going offline
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!sessionId || !session) return;

        // Save session and attendances when they change (optimized with debouncing)
        // Save in both online and offline modes to keep cache up-to-date
        saveToCacheOptimized(attendances, session);

        // Cleanup timeout on unmount or when dependencies change
        return () => {
            if (saveCacheTimeoutRef.current) {
                clearTimeout(saveCacheTimeoutRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attendances, session, sessionId]);

    useEffect(() => {
        if (sessionId) {
            fetchSession();
        }
    }, [sessionId]);

    // Auto-sync pending actions on page load (if online)
    useEffect(() => {
        const syncOnLoad = async () => {
            if (!sessionId) return;
            
            const isOffline = typeof window !== 'undefined' && !navigator.onLine;
            if (isOffline) return;
            
            // Wait a bit for page to initialize
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const pendingCount = getSessionPendingActions(sessionId).length;
            if (pendingCount === 0) return;
            
            console.log(`🔄 Page loaded: Found ${pendingCount} pending actions for session ${sessionId}, syncing...`);
            showToast(`جارٍ مزامنة ${pendingCount} إجراء محفوظ...`, 'info');
            
            const result = await syncPendingActions({
                addAttendance: async (sid, data) => {
                    // Validate studentCode before sending
                    if (!data.studentCode || !data.studentCode.trim()) {
                        console.warn('⚠️ Skipping sync: Invalid studentCode', data);
                        throw new Error('Invalid student code');
                    }
                    
                    try {
                        const response = await addStudentToSession(sid, data.studentCode.trim());
                        return response;
                    } catch (error: any) {
                        // If student already exists (400) or not found (404), silently skip
                        if (error?.response?.status === 400) {
                            const message = error?.response?.data?.message || 'Student already added';
                            console.log(`ℹ️ Skipping sync (already exists): ${message}`, { sessionId: sid, studentCode: data.studentCode });
                            return { success: true, message, data: null };
                        }
                        if (error?.response?.status === 404) {
                            const message = error?.response?.data?.message || 'Student or session not found';
                            console.log(`ℹ️ Skipping sync (not found): ${message}`, { sessionId: sid, studentCode: data.studentCode });
                            return { success: true, message, data: null };
                        }
                        throw error;
                    }
                },
                removeAttendance: async (sid, attendanceId) => {
                    const response = await removeStudentFromSession(sid, attendanceId);
                    return response;
                },
                updateAttendanceStatus: async (sid, attendanceId, status) => {
                    const response = await updateAttendanceStatus(sid, attendanceId, status);
                    return response;
                },
                scanAttendance: async (sid, qrToken) => {
                    const response = await scanAttendance(sid, qrToken);
                    return response;
                },
            });
            
            if (result.success > 0) {
                showToast(`تم مزامنة ${result.success} إجراء بنجاح`, 'success');
                // Refresh session data
                fetchSession();
            }
            
            if (result.failed > 0) {
                showToast(`فشل في مزامنة ${result.failed} إجراء`, 'warning');
            }
        };

        syncOnLoad();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    // Auto-sync pending actions when connection is restored
    useEffect(() => {
        const handleOnline = async () => {
            if (!sessionId) return;
            
            console.log('🌐 Connection restored: Syncing pending actions...');
            const pendingCount = getSessionPendingActions(sessionId).length;
            
            if (pendingCount > 0) {
                showToast(`جارٍ مزامنة ${pendingCount} إجراء محفوظ...`, 'info');
                
                const result = await syncPendingActions({
                    addAttendance: async (sid, data) => {
                        // Validate studentCode before sending
                        if (!data.studentCode || !data.studentCode.trim()) {
                            console.warn('⚠️ Skipping sync: Invalid studentCode', data);
                            throw new Error('Invalid student code');
                        }
                        
                        try {
                            const response = await addStudentToSession(sid, data.studentCode.trim());
                            return response;
                        } catch (error: any) {
                            // If student already exists (400) or not found (404), silently skip
                            if (error?.response?.status === 400) {
                                const message = error?.response?.data?.message || 'Student already added';
                                console.log(`ℹ️ Skipping sync (already exists): ${message}`, { sessionId: sid, studentCode: data.studentCode });
                                // Return success to mark as handled (no need to retry)
                                return { success: true, message, data: null };
                            }
                            if (error?.response?.status === 404) {
                                const message = error?.response?.data?.message || 'Student or session not found';
                                console.log(`ℹ️ Skipping sync (not found): ${message}`, { sessionId: sid, studentCode: data.studentCode });
                                // Return success to mark as handled (no need to retry)
                                return { success: true, message, data: null };
                            }
                            throw error;
                        }
                    },
                    removeAttendance: async (sid, attendanceId) => {
                        const response = await removeStudentFromSession(sid, attendanceId);
                        return response;
                    },
                    updateAttendanceStatus: async (sid, attendanceId, status) => {
                        const response = await updateAttendanceStatus(sid, attendanceId, status);
                        return response;
                    },
                    scanAttendance: async (sid, qrToken) => {
                        const response = await scanAttendance(sid, qrToken);
                        return response;
                    },
                });
                
                if (result.success > 0) {
                    showToast(`تم مزامنة ${result.success} إجراء بنجاح`, 'success');
                    // Refresh session data
                    fetchSession();
                }
                
                if (result.failed > 0) {
                    showToast(`فشل في مزامنة ${result.failed} إجراء`, 'warning');
                }
            }
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, showToast]);

    const fetchSession = async () => {
        try {
            setLoading(true);
            
            // Check if device is offline
            const isOffline = typeof window !== 'undefined' && !navigator.onLine;
            
            // Check if this is a temporary session
            const isTempSession = sessionId.startsWith('temp_');
            
            if (isOffline || isTempSession) {
                // Load cached data from localStorage (for offline or temp sessions)
                console.log(isTempSession ? '📦 Loading temporary session data' : '📴 Offline mode: Loading cached session data');
                try {
                    const cachedSession = localStorage.getItem(`session_${sessionId}`);
                    const cachedAttendances = localStorage.getItem(`session_${sessionId}_attendances`);
                    
                    if (cachedSession) {
                        const sessionData = JSON.parse(cachedSession);
                        setSession(sessionData);
                        setAttendanceCount((sessionData as any).attendanceCount || 0);
                        
                        // Show info message for temp sessions
                        if (isTempSession) {
                            showToast('جلسة مؤقتة - سيتم مزامنة البيانات عند عودة الاتصال', 'info');
                        }
                    } else if (isTempSession) {
                        // If temp session not found, redirect back
                        showToast('الجلسة المؤقتة غير موجودة', 'error');
                        router.push('/dashboard/attendance');
                        return;
                    }
                    
                    if (cachedAttendances) {
                        const attendancesList = JSON.parse(cachedAttendances);
                        setAttendances(attendancesList);
                        setAttendanceCount(attendancesList.length);
                    } else {
                        setAttendances([]);
                        setAttendanceCount(0);
                    }
                } catch (cacheError) {
                    console.error('Error loading cached session:', cacheError);
                    if (isTempSession) {
                        showToast('خطأ في تحميل بيانات الجلسة المؤقتة', 'error');
                        router.push('/dashboard/attendance');
                    } else {
                        showToast('لا توجد بيانات محفوظة لهذه الجلسة', 'info');
                    }
                }
                
                // For temp sessions, don't try to fetch from server
                if (isTempSession) {
                    setLoading(false);
                    return;
                }
                
                // For offline mode with real sessions, return early
                if (isOffline) {
                    return;
                }
            }
            
            const response = await getSessionById(sessionId);
            setSession(response.data);
            setAttendanceCount((response.data as any).attendanceCount || 0);

            // Load existing attendance list
            const attendanceRes = await getSessionAttendance(sessionId);
            const attendancesList = attendanceRes.data?.attendances || [];
            console.log('📋 Loaded attendances:', attendancesList);
            setAttendances(attendancesList);

            // Save to localStorage for offline use
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem(`session_${sessionId}`, JSON.stringify(response.data));
                    localStorage.setItem(`session_${sessionId}_attendances`, JSON.stringify(attendancesList));
                    localStorage.setItem(`session_${sessionId}_cache_time`, Date.now().toString());
                } catch (storageError) {
                    console.warn('Failed to save session to localStorage:', storageError);
                }
            }

            // Auto-update status to in-progress if it's scheduled
            if (response.data.status === 'scheduled') {
                await updateSessionStatus(sessionId, 'in-progress');
                setSession(prev => prev ? { ...prev, status: 'in-progress' } : null);
            }
        } catch (error: any) {
            // If online request fails, try to use cached data
            const isOffline = typeof window !== 'undefined' && !navigator.onLine;
            
            if (!isOffline) {
            console.error('Failed to fetch session:', error);
                
                // Check if it's a 500 error
                if (error.response?.status === 500) {
                    showToast('حدث خطأ في الخادم. جارٍ استخدام البيانات المحفوظة...', 'warning');
                } else {
            showToast('فشل في تحميل بيانات الجلسة', 'error');
                }
                
                // Try to use cached data as fallback
                try {
                    const cachedSession = localStorage.getItem(`session_${sessionId}`);
                    const cachedAttendances = localStorage.getItem(`session_${sessionId}_attendances`);
                    
                    if (cachedSession) {
                        console.log('📦 Using cached session data as fallback');
                        const sessionData = JSON.parse(cachedSession);
                        setSession(sessionData);
                        setAttendanceCount((sessionData as any).attendanceCount || 0);
                    }
                    
                    if (cachedAttendances) {
                        const attendancesList = JSON.parse(cachedAttendances);
                        setAttendances(attendancesList);
                        setAttendanceCount(attendancesList.length);
                    }
                } catch (cacheError) {
                    console.error('Error loading cached fallback session:', cacheError);
                }
            } else {
                // Silent fail in offline mode
                console.log('📴 Offline mode: Session fetch failed (expected)');
            }
        } finally {
            setLoading(false);
        }
    };

    // Lightweight refresh that avoids toggling the full-page loader (prevents spinner flashes while scanning)
    const refreshAttendanceOnly = async () => {
        try {
            // Check if device is offline
            const isOffline = typeof window !== 'undefined' && !navigator.onLine;
            
            if (isOffline) {
                // Use cached data
                const cachedAttendances = localStorage.getItem(`session_${sessionId}_attendances`);
                if (cachedAttendances) {
                    const list = JSON.parse(cachedAttendances);
                    setAttendances(list);
                    setAttendanceCount(list.length);
                }
                return;
            }
            
            const attendanceRes = await getSessionAttendance(sessionId);
            const list = attendanceRes.data?.attendances || [];
            console.log('🔄 Refreshed attendances:', list);
            setAttendances(list);
            setAttendanceCount(list.length);
            
            // Update cache
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem(`session_${sessionId}_attendances`, JSON.stringify(list));
                } catch (storageError) {
                    console.warn('Failed to update cached attendances:', storageError);
                }
            }
        } catch (error: any) {
            // Keep scanning UX stable; don't interrupt user with loader
            const isOffline = typeof window !== 'undefined' && !navigator.onLine;
            
            if (!isOffline) {
            console.error('Failed to refresh attendance list:', error);
                
                // Try to use cached data as fallback
                try {
                    const cachedAttendances = localStorage.getItem(`session_${sessionId}_attendances`);
                    if (cachedAttendances) {
                        const list = JSON.parse(cachedAttendances);
                        setAttendances(list);
                        setAttendanceCount(list.length);
                    }
                } catch (cacheError) {
                    console.error('Error loading cached attendances:', cacheError);
                }
            }
        }
    };

    const handleEndSession = async () => {
        if (!confirm('هل أنت متأكد من إنهاء الجلسة؟')) {
            return;
        }

        try {
            await endSession(sessionId);
            router.push('/dashboard/attendance');
        } catch (error) {
            console.error('Failed to end session:', error);
            showToast('فشل في إنهاء الجلسة', 'error');
        }
    };

    const handleRemoveAttendance = async (attendanceId: string) => {
        if (!confirm('هل أنت متأكد من إلغاء حضور هذا الطالب؟')) {
            return;
        }

        const isOffline = typeof window !== 'undefined' && !navigator.onLine;

        try {
            // If attendance ID is temporary (starts with temp_), it was created offline
            // and hasn't been synced yet, so we can just remove it locally
            if (attendanceId.startsWith('temp_')) {
                // Remove from local state and cache
                const updatedAttendances = attendances.filter(a => a.id !== attendanceId);
                setAttendances(updatedAttendances);
                setAttendanceCount(prev => Math.max(0, prev - 1));
                // Save optimized - always save to keep cache up-to-date
                saveToCacheOptimized(updatedAttendances, session);
                
                // Remove from queue if it exists
                const { getQueue, removeAction } = await import('@/lib/offline-sync');
                const queue = getQueue();
                const pendingAction = queue.find(a => 
                    a.type === 'add_attendance' && 
                    a.sessionId === sessionId &&
                    a.data?.studentCode && 
                    attendances.find(att => att.id === attendanceId && att.student.nationalId === a.data.studentCode)
                );
                if (pendingAction) {
                    removeAction(pendingAction.id);
                }
                
                showToast('تم إلغاء حضور الطالب', 'success');
                return;
            }

            if (isOffline) {
                // Queue action for offline
                queueAction({
                    type: 'remove_attendance',
                    sessionId,
                    data: { attendanceId },
                });
                
                // Update UI optimistically
                const updatedAttendances = attendances.filter(a => a.id !== attendanceId);
                setAttendances(updatedAttendances);
                setAttendanceCount(prev => Math.max(0, prev - 1));

                // Save to cache optimized (offline mode) - non-blocking
                // Always save to keep cache up-to-date
                saveToCacheOptimized(updatedAttendances, session);
                
                showToast('تم حفظ الإجراء. سيتم رفعه عند عودة الاتصال', 'info');
                return;
            }

            const response = await removeStudentFromSession(sessionId, attendanceId);

            // Update attendance count and list
            if (response.data?.attendanceCount !== undefined) {
                setAttendanceCount(response.data.attendanceCount);
            }

            const updatedAttendances = attendances.filter(a => a.id !== attendanceId);
            setAttendances(updatedAttendances);

                // Save to cache optimized (online mode) - non-blocking
                // Always save to ensure data is available when going offline
                if (navigator.onLine) {
                    saveToCacheOptimized(updatedAttendances, session);
                }

            showToast(response.message || 'تم إلغاء حضور الطالب بنجاح', 'success');
        } catch (error: any) {
            const isOffline = typeof window !== 'undefined' && !navigator.onLine;
            
            // If attendance ID is temporary, don't queue it (already handled above)
            if (attendanceId.startsWith('temp_')) {
                console.log('⚠️ Attempted to remove temp attendance, already handled locally');
                return;
            }
            
            if (isOffline) {
                // Queue action for offline
                queueAction({
                    type: 'remove_attendance',
                    sessionId,
                    data: { attendanceId },
                });
                
                // Update UI optimistically
                setAttendances(prev => prev.filter(a => a.id !== attendanceId));
                setAttendanceCount(prev => Math.max(0, prev - 1));
                
                showToast('تم حفظ الإجراء. سيتم رفعه عند عودة الاتصال', 'info');
            } else {
            console.error('Failed to remove student from session:', error);
            const message =
                error?.response?.data?.message ||
                'فشل في إلغاء حضور الطالب، حاول مرة أخرى';
            showToast(message, 'error');
            }
        }
    };

    const handleTogglePaid = async (attendanceId: string, currentStatus: SessionAttendance['status']) => {
        const isOffline = typeof window !== 'undefined' && !navigator.onLine;
        const nextStatus = currentStatus === 'present' ? 'unpaid' : 'paid';
        // Map the API status ('paid' | 'unpaid') to the internal model status ('present' | 'absent')
        // Based on backend logic: 'paid' -> 'present', 'unpaid' -> 'absent'
        const nextLocalStatus: SessionAttendance['status'] = nextStatus === 'paid' ? 'present' : 'absent';

        try {
            setUpdatingStatus(true);
            
            if (isOffline) {
                // Queue action for offline
                queueAction({
                    type: 'update_attendance_status',
                    sessionId,
                    data: { attendanceId, status: nextStatus },
                });
                
                // Update UI optimistically
                const updatedAttendances = attendances.map((a) =>
                    a.id === attendanceId
                        ? { ...a, status: nextLocalStatus }
                        : a
                );
                setAttendances(updatedAttendances);
                if (selectedAttendance?.id === attendanceId) {
                    setSelectedAttendance({ ...selectedAttendance, status: nextLocalStatus });
                }

                // Save to cache optimized (offline mode) - non-blocking
                // Always save to keep cache up-to-date
                saveToCacheOptimized(updatedAttendances, session);
                
                showToast('تم حفظ التغيير. سيتم رفعه عند عودة الاتصال', 'info');
                return;
            }

            const response = await updateAttendanceStatus(sessionId, attendanceId, nextStatus as 'paid' | 'unpaid');
            const updated = response.data?.attendance;
            if (response.data?.attendanceCount !== undefined) {
                setAttendanceCount(response.data.attendanceCount);
            }
            if (updated) {
                const updatedAttendances = attendances.map((a) =>
                        a.id === attendanceId
                            ? { ...a, status: updated.status as SessionAttendance['status'] }
                            : a
                );
                setAttendances(updatedAttendances);
                
                // Update selected attendance if modal is open
                if (selectedAttendance?.id === attendanceId) {
                    setSelectedAttendance({ ...selectedAttendance, status: updated.status as SessionAttendance['status'] });
                }

                // Save to cache optimized (online mode) - non-blocking
                // Always save to ensure data is available when going offline
                if (navigator.onLine) {
                    saveToCacheOptimized(updatedAttendances, session);
                }
            }
            showToast('تم تحديث حالة الطالب', 'success');
        } catch (error: any) {
            const isOffline = typeof window !== 'undefined' && !navigator.onLine;
            
            if (isOffline) {
                // Queue action for offline
                queueAction({
                    type: 'update_attendance_status',
                    sessionId,
                    data: { attendanceId, status: nextStatus },
                });
                
                // Update UI optimistically
                const updatedAttendances = attendances.map((a) =>
                    a.id === attendanceId
                        ? { ...a, status: nextLocalStatus }
                        : a
                );
                setAttendances(updatedAttendances);
                if (selectedAttendance?.id === attendanceId) {
                    setSelectedAttendance({ ...selectedAttendance, status: nextLocalStatus });
                }

                // Save to cache optimized (offline mode) - non-blocking
                // Always save to keep cache up-to-date
                saveToCacheOptimized(updatedAttendances, session);
                
                showToast('تم حفظ التغيير. سيتم رفعه عند عودة الاتصال', 'info');
            } else {
                console.error('Failed to update attendance status:', error);
                const message =
                    error?.response?.data?.message ||
                    'فشل في تحديث حالة الطالب، حاول مرة أخرى';
                showToast(message, 'error');
            }
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleAddStudent = async (
        e: React.FormEvent | React.KeyboardEvent<HTMLInputElement>
    ) => {
        e.preventDefault();

        const trimmedCode = studentSearch.trim();
        if (!trimmedCode) {
            return;
        }

        const isOffline = typeof window !== 'undefined' && !navigator.onLine;

        try {
            setAddingStudent(true);
            
            // Always check student in local cache first (for both online and offline)
            const { searchStudentsInCache } = await import('@/lib/students-cache');
            const cachedStudents = searchStudentsInCache(trimmedCode);
            const foundStudent = cachedStudents.find(s => 
                s.nationalId === trimmedCode || 
                s.studentCode === trimmedCode ||
                s.nationalId?.endsWith(trimmedCode) ||
                s.studentCode?.endsWith(trimmedCode)
            );
            
            // Validate: Student must exist in cache (same as online validation)
            if (!foundStudent) {
                showToast('لم يتم العثور على طالب بهذا الكود', 'error');
                setStudentSearch('');
                return;
            }
            
            // Check if already exists in attendance list
            const exists = attendances.some(a => 
                a.student.nationalId === trimmedCode ||
                a.student.nationalId === foundStudent.nationalId
            );
            
            if (exists) {
                showToast('تم تسجيل هذا الطالب بالفعل', 'warning');
                setStudentSearch('');
                return;
            }
            
            if (isOffline) {
                // Queue action for offline
                queueAction({
                    type: 'add_attendance',
                    sessionId,
                    data: { studentCode: trimmedCode },
                });
                
                // Create attendance with real student data
                const tempAttendance: SessionAttendance = {
                    id: `temp_${Date.now()}`,
                    status: 'present',
                    createdAt: new Date().toISOString(),
                    student: {
                        id: foundStudent.id || foundStudent._id || 'temp',
                        fullName: foundStudent.fullName,
                        nationalId: foundStudent.nationalId || trimmedCode,
                    },
                };
                
                const updatedAttendances = [tempAttendance, ...attendances];
                setAttendances(updatedAttendances);
                setAttendanceCount(updatedAttendances.length);
                // Save optimized - always save to keep cache up-to-date
                saveToCacheOptimized(updatedAttendances, session);
                setStudentSearch('');
                
                showToast(`تم تسجيل حضور: ${foundStudent.fullName}`, 'success');
                return;
            }

            // Online mode: send to server (validation already done above)
            const response = await addStudentToSession(sessionId, trimmedCode);

            if (response.data?.attendanceCount !== undefined) {
                setAttendanceCount(response.data.attendanceCount);
            }

            if (response.data?.attendance) {
                const updatedAttendances = [
                    response.data!.attendance,
                    ...attendances.filter(a => a.id !== response.data!.attendance.id),
                ];
                setAttendances(updatedAttendances);

                // Save to cache optimized (online mode) - non-blocking
                // Always save to ensure data is available when going offline
                if (navigator.onLine) {
                    saveToCacheOptimized(updatedAttendances, session);
                }
            }

            setStudentSearch('');
            showToast(response.message || 'تم تسجيل حضور الطالب بنجاح', 'success');
        } catch (error: any) {
            console.error('Failed to add student to session:', error);
            const message =
                error?.response?.data?.message ||
                'فشل في إضافة الطالب، تأكد من كود الطالب وحاول مرة أخرى';
            showToast(message, 'error');
        } finally {
            setAddingStudent(false);
        }
    };

    // Camera scanning for this session
    useEffect(() => {
        const stopScanner = async () => {
            const scanner = scannerRef.current;
            if (!scanner) return;
            try {
                if (scanner.isScanning) {
                    await scanner.stop();
                }
            } catch {
                // ignore stop errors
            } finally {
                try {
                    await scanner.clear();
                } catch {
                    // ignore clear errors
                }
            }
            scannerRef.current = null;
            setScanState('idle');
        };

        if (!cameraEnabled) {
            void stopScanner();
            return;
        }

        const startScanner = async () => {
            setCameraError(null);
            setScanState('starting');
            const scanner = new Html5Qrcode(regionId);
            scannerRef.current = scanner;

            try {
                await scanner.start(
                    { facingMode: 'environment' },
                    // Larger scan box since we're going full-bleed on this page
                    { fps: 10, qrbox: { width: 320, height: 320 }, aspectRatio: 1 },
                    async (decodedText) => {
                        // anti-duplicate within 2s
                        const trimmed = decodedText.trim();
                        if (!trimmed) return;
                        // Accept only numeric codes to avoid random noise reads
                        if (!/^[0-9]{3,20}$/.test(trimmed)) return;
                        const now = Date.now();
                        // Global cooldown to avoid rapid repeated toasts
                        if (now < cooldownRef.current) return;
                        cooldownRef.current = now + 1500;
                        const last = lastScanRef.current;
                        if (last && last.token === trimmed && now - last.at < 2000) return;
                        lastScanRef.current = { token: trimmed, at: now };

                        try {
                            const isOffline = typeof window !== 'undefined' && !navigator.onLine;
                            
                            // Always check student in local cache first (for both online and offline)
                            const { searchStudentsInCache } = await import('@/lib/students-cache');
                            const cachedStudents = searchStudentsInCache(trimmed);
                            const foundStudent = cachedStudents.find(s => 
                                s.qrToken === trimmed ||
                                s.nationalId === trimmed ||
                                s.studentCode === trimmed ||
                                s.qrToken?.endsWith(trimmed) ||
                                s.nationalId?.endsWith(trimmed)
                            );
                            
                            // Validate: Student must exist in cache (same as online validation)
                            if (!foundStudent) {
                                showToast('لم يتم العثور على طالب بهذا الكود', 'error');
                                return;
                            }
                            
                            // Check if already exists in attendance list
                            const exists = attendances.some(a => 
                                a.student.nationalId === trimmed ||
                                a.student.nationalId === foundStudent.nationalId
                            );
                            
                            if (exists) {
                                showToast('تم تسجيل هذا الطالب بالفعل', 'warning');
                                return;
                            }
                            
                            if (isOffline) {
                                // Queue action for offline
                                queueAction({
                                    type: 'scan_attendance',
                                    sessionId,
                                    data: { qrToken: trimmed },
                                });
                                
                                // Create attendance with real student data
                                const tempAttendance: SessionAttendance = {
                                    id: `temp_${Date.now()}`,
                                    status: 'present',
                                    createdAt: new Date().toISOString(),
                                    student: {
                                        id: foundStudent.id || foundStudent._id || 'temp',
                                        fullName: foundStudent.fullName,
                                        nationalId: foundStudent.nationalId || trimmed,
                                    },
                                };
                                
                                const updatedAttendances = [tempAttendance, ...attendances];
                                setAttendances(updatedAttendances);
                                setAttendanceCount(updatedAttendances.length);
                                // Save optimized - always save to keep cache up-to-date
                                saveToCacheOptimized(updatedAttendances, session);
                                
                                showToast(`تم تسجيل حضور: ${foundStudent.fullName}`, 'success');
                                return;
                            }
                            
                            const res = await scanAttendance(sessionId, trimmed);
                            const status = res?.data?.status;
                            const studentName = res?.data?.studentName || '';
                            if (status === 'new') {
                                showToast(`تم تسجيل حضور: ${studentName}`, 'success');
                                // Update count optimistically (avoid full reload spinner)
                                setAttendanceCount((c) => c + 1);
                            } else if (status === 'already') {
                                showToast(`تم تسجيل هذا الطالب بالفعل: ${studentName}`, 'warning');
                            } else {
                                showToast('استجابة غير متوقعة من السيرفر', 'error');
                            }
                            // Lightweight refresh attendance list (no full-page loading spinner)
                            refreshAttendanceOnly().then(() => {
                                // Save to cache after refresh (online mode)
                                // Note: attendances state will be updated by refreshAttendanceOnly
                                if (navigator.onLine && session) {
                                    // Wait a bit for state to update, then save
                                    setTimeout(() => {
                                        // Get fresh attendances from state (will be updated by refreshAttendanceOnly)
                                        const cachedAttendances = localStorage.getItem(`session_${sessionId}_attendances`);
                                        if (cachedAttendances) {
                                            try {
                                                const parsed = JSON.parse(cachedAttendances);
                                                // Save optimized - always save to keep cache up-to-date
                                                saveToCacheOptimized(parsed, session);
                                            } catch {
                                                // Ignore parse errors
                                            }
                                        }
                                    }, 200);
                                }
                            });
                        } catch (err: any) {
                            const isOffline = typeof window !== 'undefined' && !navigator.onLine;
                            
                            // Try to find student in local cache as fallback
                            try {
                                const { searchStudentsInCache } = await import('@/lib/students-cache');
                                const cachedStudents = searchStudentsInCache(trimmed);
                                const foundStudent = cachedStudents.find(s => 
                                    s.qrToken === trimmed ||
                                    s.nationalId === trimmed ||
                                    s.studentCode === trimmed ||
                                    s.qrToken?.endsWith(trimmed) ||
                                    s.nationalId?.endsWith(trimmed)
                                );
                                
                                // Validate: Student must exist in cache (same as online validation)
                                if (!foundStudent) {
                                    const message = isOffline 
                                        ? 'الطالب غير موجود في البيانات المحلية'
                                        : (err?.response?.data?.message || 'لم يتم العثور على طالب بهذا الكود');
                                    showToast(message, 'error');
                                    return;
                                }
                                
                                // Check if already exists
                                const exists = attendances.some(a => 
                                    a.student.nationalId === trimmed ||
                                    a.student.nationalId === foundStudent.nationalId
                                );
                                
                                if (exists) {
                                    showToast('تم تسجيل هذا الطالب بالفعل', 'warning');
                                    return;
                                }
                                
                                // Queue action for offline
                                queueAction({
                                    type: 'scan_attendance',
                                    sessionId,
                                    data: { qrToken: trimmed },
                                });
                                
                                // Create attendance with real student data
                                const tempAttendance: SessionAttendance = {
                                    id: `temp_${Date.now()}`,
                                    status: 'present',
                                    createdAt: new Date().toISOString(),
                                    student: {
                                        id: foundStudent.id || foundStudent._id || 'temp',
                                        fullName: foundStudent.fullName,
                                        nationalId: foundStudent.nationalId || trimmed,
                                    },
                                };
                                
                                const updatedAttendances = [tempAttendance, ...attendances];
                                setAttendances(updatedAttendances);
                                setAttendanceCount(updatedAttendances.length);
                                // Save optimized - always save to keep cache up-to-date
                                saveToCacheOptimized(updatedAttendances, session);
                                
                                showToast(`تم تسجيل حضور: ${foundStudent.fullName}`, 'success');
                            } catch (cacheError) {
                                // If cache lookup fails, show original error
                            const message =
                                err?.response?.data?.message ||
                                err?.response?.data?.error ||
                                'فشل في تسجيل الحضور';
                            showToast(message, 'error');
                            }
                        }
                    },
                    () => {
                        // ignore decode errors
                    }
                );
                setScanState('scanning');
            } catch (e: any) {
                console.error('Camera start failed:', e);
                setCameraError('تعذر تشغيل الكاميرا. تأكد من منح الصلاحيات.');
                setScanState('error');
            }
        };

        void startScanner();

        return () => {
            void stopScanner();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cameraEnabled, sessionId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <p className="text-gray-500">الجلسة غير موجودة</p>
            </div>
        );
    }

    const sessionDate = new Date(session.date);
    const formattedDate = sessionDate.toLocaleDateString('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#FBFAFF] via-white to-white" dir="rtl">
            {/* Main Content */}
            <div className="w-full px-4 pb-24 pt-4 sm:px-6 sm:pb-10 sm:pt-6 space-y-4 sm:space-y-6">
                {/* Compact top header (full bleed horizontally) */}
                <div className="-mx-4 sm:-mx-6 rounded-3xl bg-white/90 backdrop-blur border border-black/5 shadow-sm">
                    <div className="p-4 sm:p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => router.push(isAssistant ? ROUTES.ATTENDANCE : '/dashboard/attendance')}
                                        className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                        <span className="hidden sm:inline">رجوع</span>
                                    </button>
                                    <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                                        جلسة مباشرة
                                    </span>
                                </div>
                                <h1 className="mt-3 text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 truncate">
                                    {(session as any)?.title || 'جلسة'}
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    {formattedDate}
                                </p>
                            </div>

                            <button
                                onClick={handleEndSession}
                                className="shrink-0 rounded-2xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-600 active:scale-[0.99] transition"
                            >
                                إنهاء
                            </button>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-gray-100 bg-gradient-to-l from-white to-purple-50/60 p-3 sm:p-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-500">الحضور</div>
                                    <Users className="h-4 w-4 text-purple-600" />
                                </div>
                                <div className="mt-1 text-lg sm:text-xl font-extrabold text-gray-900">
                                    {attendanceCount}
                                    <span className="mr-1 text-sm font-semibold text-gray-600">طالب</span>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-gray-100 bg-gradient-to-l from-white to-purple-50/60 p-3 sm:p-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-500">السعر</div>
                                    <DollarSign className="h-4 w-4 text-purple-600" />
                                </div>
                                <div className="mt-1 text-lg sm:text-xl font-extrabold text-gray-900">
                                    {session.price}
                                    <span className="mr-1 text-sm font-semibold text-gray-600">د.م</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Student by Attendance (no outer container card) */}
                <div className="mt-3 sm:mt-5 px-0 sm:px-0 pt-2 sm:pt-3 pb-3 sm:pb-4 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                            <h2 className="text-base sm:text-lg font-extrabold text-gray-900">إضافة طالب بالكود</h2>
                            <p className="mt-1 text-xs sm:text-sm text-gray-600">
                                اكتب كود الطالب ثم اضغط إضافة
                            </p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
                            سريع
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            inputMode="numeric"
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            placeholder="ادخل كود الطالب"
                            className="flex-1 py-3 px-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right text-gray-900 placeholder:text-gray-400 transition-all duration-200"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    void handleAddStudent(e);
                                }
                            }}
                            disabled={addingStudent}
                        />
                        <button
                            onClick={(e) => void handleAddStudent(e as unknown as React.FormEvent)}
                            disabled={addingStudent}
                            className="shrink-0 bg-purple-600 text-white px-5 py-3 rounded-2xl font-bold hover:bg-purple-700 active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {addingStudent ? '...' : 'إضافة'}
                        </button>
                    </div>
                </div>

                {/* QR Scan inline for this session (no outer container card) */}
                <div className="px-0 sm:px-0 pt-3 sm:pt-4 pb-4 sm:pb-5 border-b border-gray-100 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-base sm:text-lg font-extrabold text-gray-900">المسح بالكاميرا (QR)</h2>
                            <p className="mt-1 text-xs sm:text-sm text-gray-600">
                                شغّل الكاميرا ووجّهها للكود — ستستمر بعد كل مسح.
                            </p>
                        </div>
                        <button
                            onClick={() => setCameraEnabled((v) => !v)}
                            className={`shrink-0 px-4 py-2.5 rounded-2xl font-bold shadow-sm transition-colors ${cameraEnabled
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                                }`}
                        >
                            {cameraEnabled ? 'إيقاف' : 'تشغيل'}
                        </button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                            الحالة:{' '}
                            {scanState === 'scanning'
                                ? 'يتم المسح...'
                                : scanState === 'starting'
                                    ? 'تشغيل الكاميرا...'
                                    : scanState === 'error'
                                        ? 'خطأ'
                                        : 'متوقفة'}
                        </span>
                        <span className="truncate max-w-[45%]">
                            {(session as any)?.title || ''}
                        </span>
                    </div>

                    {cameraError && (
                        <div className="rounded-2xl bg-red-50 border border-red-200 text-red-900 px-4 py-3 text-sm">
                            {cameraError}
                        </div>
                    )}

                    <div className="rounded-3xl border border-gray-100 bg-gradient-to-b from-gray-50 to-white p-3 sm:p-4">
                        <div id={regionId} className="w-full max-w-md mx-auto" />
                    </div>
                </div>

                {/* Students in this session (no outer container card) */}
                <div className="px-0 sm:px-0 pt-4 sm:pt-6 pb-8 sm:pb-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="h-9 w-9 rounded-2xl bg-purple-50 flex items-center justify-center">
                                <Users className="h-5 w-5 text-purple-600" />
                            </div>
                            <h2 className="text-base sm:text-lg font-extrabold text-gray-900 truncate">
                                الطلاب ({attendances.length})
                            </h2>
                        </div>
                    </div>

                    {attendances.length === 0 ? (
                        <div className="-mx-4 sm:mx-0">
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center text-sm text-gray-500">
                                لم يتم تسجيل حضور أي طالب بعد
                            </div>
                        </div>
                    ) : (
                        <div className="-mx-4 sm:mx-0 space-y-2 sm:space-y-3">
                            {attendances.map((attendance) => (
                                <div
                                    key={attendance.id}
                                    onClick={() => setSelectedAttendance(attendance)}
                                    className="animate-slide-in-up rounded-2xl border border-gray-100 bg-gradient-to-l from-white to-purple-50/40 px-4 py-3 flex items-start justify-between gap-3 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-gray-900 truncate">
                                            {attendance.student?.fullName || attendance.studentCode || 'طالب غير معروف'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            كود: {attendance.student?.nationalId || attendance.studentCode || 'غير متوفر'} •{' '}
                                            {' '}
                                            {new Date(attendance.createdAt).toLocaleTimeString('ar-EG', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}{' '}
                                            م
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${attendance.status === 'present'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-amber-50 text-amber-700'
                                                }`}
                                        >
                                            {attendance.status === 'present' ? 'مسدد' : 'غير مسدد'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile sticky quick actions */}
            <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/90 backdrop-blur">
                <div className="w-full px-4 py-3 flex items-center justify-between gap-3">
                    <button
                        onClick={() => setCameraEnabled((v) => !v)}
                        className={`flex-1 rounded-2xl px-4 py-3 text-sm font-extrabold transition-colors ${cameraEnabled
                            ? 'bg-red-100 text-red-700'
                            : 'bg-purple-600 text-white'
                            }`}
                    >
                        {cameraEnabled ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
                    </button>
                    <button
                        onClick={handleEndSession}
                        className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-extrabold text-white shadow-sm"
                    >
                        إنهاء
                    </button>
                </div>
            </div>

            {/* Student Details Modal */}
            {selectedAttendance && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setSelectedAttendance(null)}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-3xl">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">تفاصيل الطالب</h3>
                            <button
                                onClick={() => setSelectedAttendance(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content - scrollable */}
                        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
                            {/* Student Name */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">الاسم الكامل</label>
                                <p className="mt-1 text-lg font-bold text-gray-900">{selectedAttendance.student?.fullName || 'طالب محذوف'}</p>
                            </div>

                            {/* Student Code */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">كود الطالب</label>
                                <p className="mt-1 text-base text-gray-700">{selectedAttendance.student?.nationalId || 'غير متوفر'}</p>
                            </div>

                            {/* Parent Phone */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">رقم ولي الأمر</label>
                                <p className="mt-1 text-base text-gray-700">
                                    {selectedAttendance.student?.parentPhone || 'غير متوفر'}
                                </p>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">الحالة</label>
                                <div className="mt-1">
                                    <span
                                        className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${selectedAttendance.status === 'present'
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-amber-50 text-amber-700'
                                            }`}
                                    >
                                        {selectedAttendance.status === 'present' ? 'مسدد' : 'غير مسدد'}
                                    </span>
                                </div>
                            </div>

                            {/* Attendance Time */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">وقت التسجيل</label>
                                <p className="mt-1 text-base text-gray-700">
                                    {new Date(selectedAttendance.createdAt).toLocaleString('ar-EG', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>

                            {/* Session Info */}
                            {session && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">الجلسة</label>
                                    <p className="mt-1 text-base text-gray-700">
                                        {(session as any)?.title || 'جلسة'} • {session.price} ج.م
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions - fixed at bottom */}
                        <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-4 rounded-b-3xl space-y-2">
                            <button
                                onClick={() => {
                                    void handleTogglePaid(selectedAttendance.id, selectedAttendance.status);
                                }}
                                disabled={updatingStatus}
                                className="w-full rounded-2xl bg-purple-600 text-white px-4 py-3 font-bold hover:bg-purple-700 active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {updatingStatus ? 'جاري التحديث...' : selectedAttendance.status === 'present' ? 'تعيين كغير مسدد' : 'تعيين كمسدد'}
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm('هل أنت متأكد من إلغاء حضور هذا الطالب؟')) {
                                        void handleRemoveAttendance(selectedAttendance.id);
                                        setSelectedAttendance(null);
                                    }
                                }}
                                className="w-full rounded-2xl border border-red-200 bg-red-50 text-red-600 px-4 py-3 font-bold hover:bg-red-100 hover:border-red-300 transition-colors"
                            >
                                إلغاء الحضور
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
