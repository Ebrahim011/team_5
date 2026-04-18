'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getSessionStats, getRecentSessions, createSession } from '@/features/sessions';
import type { Session, SessionStats, CreateSessionData } from '@/features/sessions';
import { useToast } from '@/components/ui';
import { queueAction, syncPendingActions, getPendingSessions } from '@/lib/offline-sync';

// Page Sections
import PageHeader from './Sections/PageHeader';
import StatsSection from './Sections/StatsSection';
import RecentSessionsSection from './Sections/RecentSessionsSection';

// Components
import CreateSessionModal from '@/components/CreateSessionModal';

export default function AttendancePage() {
    const router = useRouter();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [stats, setStats] = useState<SessionStats>({
        todaySessions: 0,
        todayPresent: 0,
        todayAbsent: 0,
        todayRevenue: 0,
    });
    const [recentSessions, setRecentSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);

    // Fetch initial data
    useEffect(() => {
        // Check if offline immediately and load from cache if so
        const isOffline = typeof window !== 'undefined' && !navigator.onLine;
        if (isOffline) {
            // Load from cache immediately for faster offline experience
            try {
                const cachedStats = localStorage.getItem('attendance_stats');
                const cachedSessions = localStorage.getItem('attendance_sessions');
                
                if (cachedSessions) {
                    const sessions = JSON.parse(cachedSessions);
                    setRecentSessions(sessions);
                }
                
                if (cachedStats) {
                    setStats(JSON.parse(cachedStats));
                }
                
                // Set loading to false immediately to make page interactive
                setLoading(false);
                
                // Still call fetchData to load temp sessions, but don't block UI
                setTimeout(() => {
                    fetchData();
                }, 100);
            } catch (error) {
                console.error('Error loading initial cache:', error);
                setLoading(false);
                fetchData();
            }
        } else {
            fetchData();
        }
    }, []);

    // Auto-sync pending sessions on page load (if online)
    useEffect(() => {
        const syncOnLoad = async () => {
            const isOffline = typeof window !== 'undefined' && !navigator.onLine;
            if (isOffline) return;
            
            // Wait a bit for page to initialize
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const pendingSessions = getPendingSessions();
            if (pendingSessions.length === 0) return;
            
            console.log(`🔄 Page loaded: Found ${pendingSessions.length} pending sessions, syncing...`);
            showToast(`جارٍ مزامنة ${pendingSessions.length} جلسة محفوظة...`, 'info');
            
            const result = await syncPendingActions({
                createSession: async (data) => {
                    const response = await createSession(data);
                    
                    // After creating session, migrate attendance data from temp session
                    if (response.data && response.data.id) {
                        const newSessionId = response.data.id || response.data._id;
                        
                        // Try to find temp session ID from localStorage by matching data
                        const tempSessionId = Object.keys(localStorage)
                            .find(key => {
                                if (!key.startsWith('session_temp_')) return false;
                                try {
                                    const sessionData = JSON.parse(localStorage.getItem(key) || '{}');
                                    return sessionData.date === data.date &&
                                           sessionData.startTime === data.startTime;
                                } catch {
                                    return false;
                                }
                            });
                        
                        if (tempSessionId) {
                            const tempId = tempSessionId.replace('session_', '');
                            const tempAttendances = localStorage.getItem(`session_${tempId}_attendances`);
                            
                            if (tempAttendances) {
                                try {
                                    const attendances = JSON.parse(tempAttendances);
                                    console.log(`📦 Migrating ${attendances.length} attendances from temp session ${tempId} to ${newSessionId}`);
                                    
                                    // Update localStorage with new session ID
                                    localStorage.setItem(`session_${newSessionId}`, JSON.stringify(response.data));
                                    localStorage.setItem(`session_${newSessionId}_attendances`, tempAttendances);
                                    
                                    // Migrate attendance actions to new session ID
                                    const { getQueue } = await import('@/lib/offline-sync');
                                    const queue = getQueue();
                                    const updatedQueue = queue.map(action => {
                                        if (action.sessionId === tempId && 
                                            (action.type === 'add_attendance' || 
                                             action.type === 'remove_attendance' || 
                                             action.type === 'update_attendance_status' || 
                                             action.type === 'scan_attendance')) {
                                            return { ...action, sessionId: newSessionId };
                                        }
                                        return action;
                                    });
                                    
                                    // Save updated queue
                                    if (typeof window !== 'undefined') {
                                        localStorage.setItem('offline_actions_queue', JSON.stringify(updatedQueue));
                                    }
                                    
                                    // Clean up temp session data
                                    localStorage.removeItem(`session_${tempId}`);
                                    localStorage.removeItem(`session_${tempId}_attendances`);
                                    localStorage.removeItem(`session_${tempId}_cache_time`);
                                    localStorage.removeItem(`session_${tempId}_is_temp`);
                                } catch (migrateError) {
                                    console.error('Error migrating temp session data:', migrateError);
                                }
                            }
                        }
                    }
                    
                    return response;
                },
            });
            
            if (result.success > 0) {
                showToast(`تم مزامنة ${result.success} جلسة بنجاح`, 'success');
                
                // Remove temporary sessions from UI after successful sync
                setRecentSessions(prev => prev.filter(s => {
                    const id = (s.id || s._id || '').toString();
                    return !id.startsWith('temp_');
                }));
                
                // Refresh data to get the newly created sessions
                fetchData();
            }
            
            if (result.failed > 0) {
                showToast(`فشل في مزامنة ${result.failed} جلسة`, 'warning');
            }
        };

        syncOnLoad();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-refresh data and sync pending sessions when connection is restored
    useEffect(() => {
        const handleOnline = async () => {
            console.log('🌐 Connection restored: Refreshing data and syncing...');
            
            // Sync pending session creations
            const pendingSessions = getPendingSessions();
            if (pendingSessions.length > 0) {
                showToast(`جارٍ مزامنة ${pendingSessions.length} جلسة محفوظة...`, 'info');
                
                const result = await syncPendingActions({
                    createSession: async (data) => {
                        const response = await createSession(data);
                        
                        // After creating session, migrate attendance data from temp session
                        if (response.data && response.data.id) {
                            const newSessionId = response.data.id || response.data._id;
                            
                            // Try to find temp session ID from localStorage by matching data
                            const tempSessionId = Object.keys(localStorage)
                                .find(key => {
                                    if (!key.startsWith('session_temp_')) return false;
                                    try {
                                        const sessionData = JSON.parse(localStorage.getItem(key) || '{}');
                                        return sessionData.date === data.date &&
                                               sessionData.startTime === data.startTime;
                                    } catch {
                                        return false;
                                    }
                                });
                            
                            if (tempSessionId) {
                                const tempId = tempSessionId.replace('session_', '');
                                const tempAttendances = localStorage.getItem(`session_${tempId}_attendances`);
                                
                                if (tempAttendances) {
                                    try {
                                        const attendances = JSON.parse(tempAttendances);
                                        console.log(`📦 Migrating ${attendances.length} attendances from temp session ${tempId} to ${newSessionId}`);
                                        
                                        // Update localStorage with new session ID
                                        localStorage.setItem(`session_${newSessionId}`, JSON.stringify(response.data));
                                        localStorage.setItem(`session_${newSessionId}_attendances`, tempAttendances);
                                        
                                        // Migrate attendance actions to new session ID
                                        const { getQueue } = await import('@/lib/offline-sync');
                                        const queue = getQueue();
                                        const updatedQueue = queue.map(action => {
                                            if (action.sessionId === tempId && 
                                                (action.type === 'add_attendance' || 
                                                 action.type === 'remove_attendance' || 
                                                 action.type === 'update_attendance_status' || 
                                                 action.type === 'scan_attendance')) {
                                                return { ...action, sessionId: newSessionId };
                                            }
                                            return action;
                                        });
                                        
                                        // Save updated queue
                                        if (typeof window !== 'undefined') {
                                            localStorage.setItem('offline_actions_queue', JSON.stringify(updatedQueue));
                                        }
                                        
                                        // Clean up temp session data
                                        localStorage.removeItem(`session_${tempId}`);
                                        localStorage.removeItem(`session_${tempId}_attendances`);
                                        localStorage.removeItem(`session_${tempId}_cache_time`);
                                        localStorage.removeItem(`session_${tempId}_is_temp`);
                                    } catch (migrateError) {
                                        console.error('Error migrating temp session data:', migrateError);
                                    }
                                }
                            }
                        }
                        
                        return response;
                    },
                });
                
                if (result.success > 0) {
                    showToast(`تم مزامنة ${result.success} جلسة بنجاح`, 'success');
                    
                    // Remove temporary sessions from UI after successful sync
                    setRecentSessions(prev => prev.filter(s => {
                        const id = (s.id || s._id || '').toString();
                        return !id.startsWith('temp_');
                    }));
                }
                
                if (result.failed > 0) {
                    showToast(`فشل في مزامنة ${result.failed} جلسة`, 'warning');
                }
            }
            
            // Refresh data to get the newly created sessions
            fetchData();
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, []);

    const fetchData = async () => {
        try {
            // Check if device is offline first
            const isOffline = typeof window !== 'undefined' && !navigator.onLine;
            
            // Only set loading to true if online (to avoid blocking UI in offline mode)
            if (!isOffline) {
                setLoading(true);
            }
            
            if (isOffline) {
                // In offline mode, load cached data from localStorage
                console.log('📴 Offline mode: Loading cached data');
                
                try {
                    const cachedStats = localStorage.getItem('attendance_stats');
                    const cachedSessions = localStorage.getItem('attendance_sessions');
                    
                    // Load cached sessions
                    let sessions: Session[] = [];
                    if (cachedSessions) {
                        sessions = JSON.parse(cachedSessions);
                    }
                    
                    // Also load temporary sessions from localStorage
                    const tempSessions: Session[] = [];
                    if (typeof window !== 'undefined') {
                        // Find all temporary sessions in localStorage
                        // Look for keys that start with 'session_temp_' (session data)
                        const seenSessionIds = new Set<string>();
                        
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key && key.startsWith('session_temp_')) {
                                // Check if it's a session data key (not attendances or cache_time)
                                if (!key.includes('_attendances') && !key.includes('_cache_time') && !key.includes('_is_temp')) {
                                    const sessionId = key.replace('session_', '');
                                    const sessionData = localStorage.getItem(key);
                                    
                                    if (sessionData && !seenSessionIds.has(sessionId)) {
                                        try {
                                            const session = JSON.parse(sessionData);
                                            // Verify it's actually a session object
                                            if (session && (session.date || session.grade || session.title)) {
                                                seenSessionIds.add(sessionId);
                                                // Only add if not already in sessions list
                                                if (!sessions.find(s => {
                                                    const sId = (s.id || s._id || '').toString();
                                                    return sId === sessionId;
                                                })) {
                                                    tempSessions.push(session);
                                                }
                                            }
                                        } catch (e) {
                                            console.warn('Error parsing temp session:', e);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // Combine cached sessions with temporary sessions
                    const allSessions = [...tempSessions, ...sessions];
                    
                    // Sort by date (newest first)
                    allSessions.sort((a, b) => {
                        const dateA = new Date(a.date || a.createdAt || 0).getTime();
                        const dateB = new Date(b.date || b.createdAt || 0).getTime();
                        return dateB - dateA;
                    });
                    
                    // Limit to 10 most recent
                    const recentSessions = allSessions.slice(0, 10);
                    
                    if (cachedStats) {
                        setStats(JSON.parse(cachedStats));
                    } else {
                        // Calculate stats from sessions if no cached stats
                        const today = new Date().toISOString().split('T')[0];
                        const todaySessions = recentSessions.filter(s => {
                            const sessionDate = new Date(s.date || s.createdAt || '').toISOString().split('T')[0];
                            return sessionDate === today;
                        });
                        
                        setStats({
                            todaySessions: todaySessions.length,
                            todayPresent: 0, // Will be calculated from attendances
                            todayAbsent: 0,
                            todayRevenue: todaySessions.reduce((sum, s) => sum + (s.price || 0), 0),
                        });
                    }
                    
                    setRecentSessions(recentSessions);
                    
                    if (recentSessions.length === 0 && !cachedStats) {
                        console.log('📴 No cached data available');
                    } else {
                        console.log(`📴 Loaded ${recentSessions.length} sessions from cache (${tempSessions.length} temporary)`);
                    }
                } catch (cacheError) {
                    console.error('Error loading cached data:', cacheError);
                } finally {
                    // Always set loading to false in offline mode
                    setLoading(false);
                }
                
                return;
            }
            
            // Online mode: fetch fresh data
            const [statsRes, sessionsRes] = await Promise.all([
                getSessionStats(),
                getRecentSessions(10),
            ]);
            
            // Save to localStorage for offline use
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem('attendance_stats', JSON.stringify(statsRes.data));
                    localStorage.setItem('attendance_sessions', JSON.stringify(sessionsRes.data));
                    localStorage.setItem('attendance_cache_time', Date.now().toString());
                } catch (storageError) {
                    console.warn('Failed to save data to localStorage:', storageError);
                }
            }
            
            setStats(statsRes.data);
            setRecentSessions(sessionsRes.data);
        } catch (error: any) {
            // If online request fails, try to use cached data
            const isOffline = typeof window !== 'undefined' && !navigator.onLine;
            
            if (!isOffline) {
            console.error('Failed to fetch session data:', error);
                
                // Try to use cached data as fallback
                try {
                    const cachedStats = localStorage.getItem('attendance_stats');
                    const cachedSessions = localStorage.getItem('attendance_sessions');
                    
                    if (cachedStats) {
                        console.log('📦 Using cached data as fallback');
                        setStats(JSON.parse(cachedStats));
                    }
                    
                    if (cachedSessions) {
                        setRecentSessions(JSON.parse(cachedSessions));
                    }
                } catch (cacheError) {
                    console.error('Error loading cached fallback data:', cacheError);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSession = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        
        // Check if offline - prevent creating session in offline mode
        const isOffline = typeof window !== 'undefined' && !navigator.onLine;
        if (isOffline) {
            showToast('يرجى الاتصال بالإنترنت لإنشاء جلسة جديدة', 'warning');
            return;
        }
        
        setCreating(true);

        const formData = new FormData(form);
        const sessionData: CreateSessionData = {
            title: (formData.get('title') as string) || undefined,
            date: formData.get('date') as string,
            startTime: formData.get('startTime') as string,
            endTime: (formData.get('endTime') as string) || undefined,
            grade: formData.get('grade') as string,
            classroom: (formData.get('classroom') as string) || undefined,
            price: parseFloat((formData.get('price') as string) || '0'),
            notes: (formData.get('notes') as string) || undefined,
        };

        try {
            // Sessions can only be created when online
            const response = await createSession(sessionData);
            form.reset();
            setShowCreateModal(false);

            // Navigate to session control page
            const sessionId = response.data.id || response.data._id;
            if (sessionId && response.data) {
                // Save session to cache immediately for offline access (non-blocking)
                if (typeof window !== 'undefined') {
                    // Use requestIdleCallback for non-blocking save
                    const saveToCache = () => {
                        try {
                            const session = response.data;
                            // Save session data
                            localStorage.setItem(`session_${sessionId}`, JSON.stringify(session));
                            localStorage.setItem(`session_${sessionId}_attendances`, JSON.stringify([]));
                            localStorage.setItem(`session_${sessionId}_cache_time`, Date.now().toString());
                            
                            // Also update attendance_sessions list cache
                            const cachedSessions = localStorage.getItem('attendance_sessions');
                            if (cachedSessions) {
                                try {
                                    const sessions: Session[] = JSON.parse(cachedSessions);
                                    // Add new session to the beginning if not already there
                                    const exists = sessions.some(s => {
                                        const id = (s.id || s._id || '').toString();
                                        return id === sessionId;
                                    });
                                    if (!exists) {
                                        sessions.unshift(session);
                                        // Keep only last 50 sessions
                                        const limitedSessions = sessions.slice(0, 50);
                                        localStorage.setItem('attendance_sessions', JSON.stringify(limitedSessions));
                                    }
                                } catch (e) {
                                    // If parsing fails, just save the new session
                                    localStorage.setItem('attendance_sessions', JSON.stringify([session]));
                                }
                            } else {
                                localStorage.setItem('attendance_sessions', JSON.stringify([session]));
                            }
                            
                            console.log(`💾 Saved session ${sessionId} to cache for offline access`);
                        } catch (cacheError) {
                            console.warn('Failed to save session to cache:', cacheError);
                        }
                    };
                    
                    // Use requestIdleCallback if available, otherwise setTimeout
                    if ('requestIdleCallback' in window) {
                        requestIdleCallback(saveToCache, { timeout: 1000 });
                    } else {
                        setTimeout(saveToCache, 0);
                    }
                }
                
                router.push(`/dashboard/sessions/${sessionId}`);
            } else {
                fetchData(); // Fallback: refresh data
            }
        } catch (error: any) {
            console.error('Failed to create session:', error);
            showToast('فشل في إنشاء الجلسة', 'error');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Level Header */}
            <div className="border-b border-gray-100 pb-4 mb-4 sm:pb-6 sm:mb-8">
                <h2 className="text-xl sm:text-3xl font-extrabold text-[#414141] font-cairo">
                    لوحة الحضور
                </h2>
                <p className="text-xs sm:text-sm text-[#A1A1A1] font-cairo">
                    إدارة الجلسات وتسجيل حضور الطلاب
                </p>
            </div>

            <PageHeader 
                onCreateClick={() => {
                    // Check if offline - prevent creating session in offline mode
                    const isOffline = typeof window !== 'undefined' && !navigator.onLine;
                    if (isOffline) {
                        showToast('يرجى الاتصال بالإنترنت لإنشاء جلسة جديدة', 'warning');
                        return;
                    }
                    setShowCreateModal(true);
                }} 
            />

            <StatsSection stats={stats} />

            <RecentSessionsSection
                sessions={recentSessions}
                loading={loading}
                onCreateClick={() => {
                    // Check if offline - prevent creating session in offline mode
                    const isOffline = typeof window !== 'undefined' && !navigator.onLine;
                    if (isOffline) {
                        showToast('يرجى الاتصال بالإنترنت لإنشاء جلسة جديدة', 'warning');
                        return;
                    }
                    setShowCreateModal(true);
                }}
                onSessionDeleted={fetchData}
            />

            <CreateSessionModal
                isOpen={showCreateModal}
                isCreating={creating}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateSession}
            />
        </div>
    );
}
