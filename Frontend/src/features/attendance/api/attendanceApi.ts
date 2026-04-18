import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';

export type ScanAttendanceStatus = 'new' | 'already';

export interface ScanAttendanceResponseData {
  status: ScanAttendanceStatus;
  studentName: string;
}

/**
 * Send scanned QR token to backend to record attendance for a session.
 */
export async function scanAttendance(sessionId: string, qrToken: string): Promise<ApiResponse<ScanAttendanceResponseData>> {
  const response = await api.post<ApiResponse<ScanAttendanceResponseData>>('/attendance/scan', {
    sessionId,
    qrToken,
  });
  return response.data;
}


















