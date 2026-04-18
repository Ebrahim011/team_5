import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type {
    Session,
    SessionStats,
    CreateSessionData,
    SessionResponse,
    SessionsResponse,
    SessionStatsResponse
} from '../types';

// API endpoints for sessions
const SESSION_ENDPOINTS = {
    STATS: '/sessions/stats',
    RECENT: '/sessions/recent',
    SESSIONS: '/sessions',
} as const;

// Attendance types
export interface SessionAttendance {
    id: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    checkInTime?: string;
    createdAt: string;
    student: {
        id: string;
        fullName: string;
        nationalId?: string;
        parentPhone?: string;
    };
}

/**
 * Get session statistics for today
 */
export async function getSessionStats(): Promise<SessionStatsResponse> {
    const response = await api.get<SessionStatsResponse>(SESSION_ENDPOINTS.STATS);
    return response.data;
}

/**
 * Get recent sessions
 */
export async function getRecentSessions(limit: number = 10): Promise<SessionsResponse> {
    const response = await api.get<SessionsResponse>(`${SESSION_ENDPOINTS.RECENT}?limit=${limit}`);
    return response.data;
}

/**
 * Create new session
 */
export async function createSession(data: CreateSessionData): Promise<SessionResponse> {
    const response = await api.post<SessionResponse>(SESSION_ENDPOINTS.SESSIONS, data);
    return response.data;
}

/**
 * Get all sessions with optional filters
 */
export async function getSessions(filters?: {
    status?: string;
    grade?: string;
    startDate?: string;
    endDate?: string;
}): Promise<SessionsResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.grade) params.append('grade', filters.grade);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const url = queryString ? `${SESSION_ENDPOINTS.SESSIONS}?${queryString}` : SESSION_ENDPOINTS.SESSIONS;

    const response = await api.get<SessionsResponse>(url);
    return response.data;
}

/**
 * Get session by ID
 */
export async function getSessionById(id: string): Promise<SessionResponse> {
    const response = await api.get<SessionResponse>(`${SESSION_ENDPOINTS.SESSIONS}/${id}`);
    return response.data;
}

/**
 * Update session status
 */
export async function updateSessionStatus(id: string, status: string): Promise<SessionResponse> {
    const response = await api.patch<SessionResponse>(`${SESSION_ENDPOINTS.SESSIONS}/${id}/status`, { status });
    return response.data;
}

/**
 * End session (mark as completed)
 */
export async function endSession(id: string): Promise<SessionResponse> {
    const response = await api.post<SessionResponse>(`${SESSION_ENDPOINTS.SESSIONS}/${id}/end`, {});
    return response.data;
}

/**
 * Add student attendance to a session using student code
 */
export async function addStudentToSession(
    id: string,
    studentCode: string
): Promise<ApiResponse<{ attendance: SessionAttendance; attendanceCount: number }>> {
    const response = await api.post<ApiResponse<{ attendance: SessionAttendance; attendanceCount: number }>>(
        `${SESSION_ENDPOINTS.SESSIONS}/${id}/attendance`,
        { studentCode }
    );
    return response.data;
}

/**
 * Get attendance list for a session
 */
export async function getSessionAttendance(
    id: string
): Promise<ApiResponse<{ attendances: SessionAttendance[] }>> {
    const response = await api.get<ApiResponse<{ attendances: SessionAttendance[] }>>(
        `${SESSION_ENDPOINTS.SESSIONS}/${id}/attendance`
    );
    return response.data;
}

/**
 * Remove student attendance from a session
 */
export async function removeStudentFromSession(
    sessionId: string,
    attendanceId: string
): Promise<ApiResponse<{ attendanceId: string; attendanceCount: number }>> {
    const response = await api.delete<ApiResponse<{ attendanceId: string; attendanceCount: number }>>(
        `${SESSION_ENDPOINTS.SESSIONS}/${sessionId}/attendance/${attendanceId}`
    );
    return response.data;
}

/**
 * Update attendance status (paid/unpaid)
 */
export async function updateAttendanceStatus(
    sessionId: string,
    attendanceId: string,
    status: 'paid' | 'unpaid'
): Promise<ApiResponse<{ attendance: SessionAttendance; attendanceCount: number }>> {
    const response = await api.patch<ApiResponse<{ attendance: SessionAttendance; attendanceCount: number }>>(
        `${SESSION_ENDPOINTS.SESSIONS}/${sessionId}/attendance/${attendanceId}/status`,
        { status }
    );
    return response.data;
}

/**
 * Delete session
 */
export async function deleteSession(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`${SESSION_ENDPOINTS.SESSIONS}/${id}`);
    return response.data;
}

/**
 * Get recent attendance records for dashboard
 */
export async function getRecentAttendance(limit: number = 10): Promise<ApiResponse<Array<{
    id: string;
    code: string;
    name: string;
    checkIn: string;
    checkOut: string;
    status: string;
    createdAt: string;
}>>> {
    const response = await api.get<ApiResponse<Array<{
        id: string;
        code: string;
        name: string;
        checkIn: string;
        checkOut: string;
        status: string;
        createdAt: string;
    }>>>(`${SESSION_ENDPOINTS.SESSIONS}/attendance/recent?limit=${limit}`);
    return response.data;
}
