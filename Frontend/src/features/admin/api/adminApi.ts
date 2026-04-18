import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';

export interface Teacher {
    id: string;
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    lastLogin?: string;
    stats: {
        studentsCount: number;
        sessionsCount: number;
        attendanceCount: number;
    };
}

export interface TeachersResponse {
    success: boolean;
    count: number;
    data: Teacher[];
}

export interface TeacherDetailsResponse {
    success: boolean;
    data: Teacher & {
        stats: {
            studentsCount: number;
            sessionsCount: number;
            attendanceCount: number;
            recentSessions: Array<{
                id: string;
                title?: string;
                date: string;
                status: string;
                grade: string;
            }>;
        };
    };
}

// API endpoints for admin
const ADMIN_ENDPOINTS = {
    TEACHERS: '/admin/teachers',
} as const;

/**
 * Get all teachers with statistics
 */
export async function getTeachers(): Promise<TeachersResponse> {
    const response = await api.get<TeachersResponse>(ADMIN_ENDPOINTS.TEACHERS);
    return response.data;
}

/**
 * Get teacher details
 */
export async function getTeacherDetails(id: string): Promise<TeacherDetailsResponse> {
    const response = await api.get<TeacherDetailsResponse>(`${ADMIN_ENDPOINTS.TEACHERS}/${id}`);
    return response.data;
}

/**
 * Activate a teacher
 */
export async function activateTeacher(id: string): Promise<ApiResponse<Teacher>> {
    const response = await api.patch<ApiResponse<Teacher>>(`${ADMIN_ENDPOINTS.TEACHERS}/${id}/activate`);
    return response.data;
}

/**
 * Deactivate a teacher
 */
export async function deactivateTeacher(id: string): Promise<ApiResponse<Teacher>> {
    const response = await api.patch<ApiResponse<Teacher>>(`${ADMIN_ENDPOINTS.TEACHERS}/${id}/deactivate`);
    return response.data;
}

/**
 * Delete a teacher
 */
export async function deleteTeacher(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`${ADMIN_ENDPOINTS.TEACHERS}/${id}`);
    return response.data;
}




















