'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { getSessions } from '@/features/sessions';
import type { Session } from '@/features/sessions';
import { scanAttendance } from '@/features/attendance';
import { useToast } from '@/components/ui';

type ScanState = 'idle' | 'starting' | 'scanning' | 'error';

export default function AttendanceScanPage() {
    const { showToast } = useToast();

    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [loadingSessions, setLoadingSessions] = useState(true);

    const [scanState, setScanState] = useState<ScanState>('idle');
    const [cameraError, setCameraError] = useState<string | null>(null);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lastScanRef = useRef<{ token: string; at: number } | null>(null);
    const recordingRef = useRef(false);
    const cooldownRef = useRef<number>(0);

    const regionId = 'qr-reader';

    const inProgressSessions = useMemo(() => {
        return (sessions || []).filter((s) => s.status === 'in-progress');
    }, [sessions]);

    // Load in-progress sessions
    useEffect(() => {
        const load = async () => {
            try {
                setLoadingSessions(true);
                const res = await getSessions({ status: 'in-progress' });
                setSessions(res.data || []);
                // Auto-select if there's exactly one
                if ((res.data || []).length === 1) {
                    const only = res.data[0];
                    setSelectedSessionId((only as any).id || (only as any)._id || '');
                }
            } catch (e) {
                console.error('Failed to load sessions:', e);
                showToast('فشل في تحميل الجلسات', 'error');
            } finally {
                setLoadingSessions(false);
            }
        };
        load();
    }, [showToast]);

    // Start/Stop camera scanning based on selected session
    useEffect(() => {
        const stopScanner = async () => {
            const scanner = scannerRef.current;
            if (!scanner) return;
            try {
                if (scanner.isScanning) {
                    await scanner.stop();
                }
            } catch (e) {
                // ignore stop errors
            } finally {
                try {
                    await scanner.clear();
                } catch { }
            }
        };

        const startScanner = async () => {
            setCameraError(null);
            setScanState('starting');

            const scanner = new Html5Qrcode(regionId);
            scannerRef.current = scanner;
            recordingRef.current = true;

            try {
                await scanner.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 240, height: 240 },
                        aspectRatio: 1.0,
                    },
                    async (decodedText) => {
                        // Keep camera running: do NOT stop after scan.
                        // Anti-duplicate: ignore same token within 2 seconds.
                        const trimmed = decodedText.trim();
                        if (!trimmed) return;
                        // Basic sanity: nationalId is digits only (reject noise)
                        if (!/^[0-9]{3,20}$/.test(trimmed)) return;

                        const now = Date.now();
                        // Global cooldown to avoid rapid-fire repeats even on noise
                        if (now < cooldownRef.current) return;
                        cooldownRef.current = now + 1500;
                        const last = lastScanRef.current;
                        if (last && last.token === trimmed && now - last.at < 2000) return;
                        lastScanRef.current = { token: trimmed, at: now };

                        if (!selectedSessionId) return;

                        try {
                            const res = await scanAttendance(selectedSessionId, trimmed);
                            const status = res?.data?.status;
                            const studentName = res?.data?.studentName || '';

                            if (status === 'new') {
                                showToast(`تم تسجيل حضور: ${studentName}`, 'success');
                            } else if (status === 'already') {
                                showToast(`تم تسجيل هذا الطالب بالفعل: ${studentName}`, 'warning');
                            } else {
                                showToast('استجابة غير متوقعة من السيرفر', 'error');
                            }
                        } catch (err: any) {
                            const message =
                                err?.response?.data?.message ||
                                err?.response?.data?.error ||
                                'فشل في تسجيل الحضور';
                            showToast(message, 'error');
                        }
                    },
                    // ignore decode errors (keeps scanning)
                    () => { }
                );
                setScanState('scanning');
            } catch (e: any) {
                console.error('Camera start failed:', e);
                setCameraError('تعذر تشغيل الكاميرا. تأكد من إعطاء صلاحية الكاميرا.');
                setScanState('error');
            }
        };

        (async () => {
            // Always stop previous scanner when session changes/unmounts
            await stopScanner();
            scannerRef.current = null;

            if (!selectedSessionId) {
                setScanState('idle');
                return;
            }
            await startScanner();
        })();

        return () => {
            recordingRef.current = false;
            stopScanner();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSessionId]);

    return (
        <div className="space-y-6" dir="rtl">
            <div className="bg-white rounded-2xl p-6 border-2 border-black/5 shadow-md shadow-black/10">
                <h2 className="text-xl font-extrabold text-gray-900 mb-2">مسح QR لتسجيل الحضور</h2>
                <p className="text-sm text-gray-600">اختر جلسة مفتوحة ثم ابدأ المسح بالكاميرا.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-black/5 shadow-md shadow-black/10 space-y-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-700 font-semibold">الجلسة المفتوحة (in-progress)</label>
                    <select
                        className="rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-200"
                        value={selectedSessionId}
                        onChange={(e) => setSelectedSessionId(e.target.value)}
                        disabled={loadingSessions}
                    >
                        <option value="">اختر جلسة</option>
                        {inProgressSessions.map((s) => (
                            <option key={(s as any).id || (s as any)._id} value={(s as any).id || (s as any)._id}>
                                {(s.title ? `${s.title} - ` : '')}
                                {s.grade} {s.classroom ? `(${s.classroom})` : ''} — {new Date(s.date).toLocaleDateString('ar-EG')}
                            </option>
                        ))}
                    </select>
                    {!loadingSessions && inProgressSessions.length === 0 && (
                        <p className="text-xs text-gray-500">لا توجد جلسات مفتوحة الآن. افتح جلسة من صفحة الجلسات.</p>
                    )}
                </div>

                <div className="rounded-2xl border-2 border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-700">الكاميرا</p>
                        <p className="text-xs text-gray-500">
                            الحالة: {scanState === 'scanning' ? 'يتم المسح...' : scanState === 'starting' ? 'تشغيل الكاميرا...' : scanState === 'error' ? 'خطأ' : 'متوقفة'}
                        </p>
                    </div>

                    {cameraError && (
                        <div className="rounded-xl bg-red-50 border border-red-200 text-red-900 px-4 py-3 text-sm mb-3">
                            {cameraError}
                        </div>
                    )}

                    {/* html5-qrcode will render video here */}
                    <div id={regionId} className="w-full max-w-md mx-auto" />
                </div>
            </div>
        </div>
    );
}


