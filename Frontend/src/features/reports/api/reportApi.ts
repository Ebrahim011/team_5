import api from '@/lib/api';

export interface StudentReport {
    student: {
        id: string;
        fullName: string;
        nationalId: string;
        grade: string;
        classroom?: string;
        studentPhone?: string;
        parentPhone?: string;
        monthlyFee?: number;
        notes?: string;
        status: string;
    };
    statistics: {
        totalAttendance: number;
        presentCount: number;
        absentCount: number;
        attendanceRate: number;
        totalPaid: number;
        totalPending: number;
        totalExams: number;
        totalAdditionalServices: number;
        averageGrade: number | null;
    };
    attendances: Array<{
        id: string;
        date: string;
        checkInTime?: string;
        checkOutTime?: string;
        status: string;
        session?: any;
        amount: number;
    }>;
    payments: Array<{
        id: string;
        type: string;
        amount: number;
        status: string;
        date: string;
        description?: string;
    }>;
    grades: Array<{
        id: string;
        exam?: any;
        score: number;
        maxScore: number | null;
        status?: string;
        createdAt: string;
    }>;
    additionalServices: Array<{
        id: string;
        service?: any;
        status: string;
        notes?: string;
        createdAt: string;
    }>;
}

export interface ReportResponse {
    success: boolean;
    data: StudentReport;
    message?: string;
}

const REPORT_ENDPOINTS = {
    STUDENT_BY_CODE: '/reports/student',
    STUDENT_BY_ID: '/reports/student-id',
};

/**
 * Get comprehensive report for a student by code
 */
export async function getStudentReportByCode(code: string): Promise<ReportResponse> {
    const response = await api.get<ReportResponse>(`${REPORT_ENDPOINTS.STUDENT_BY_CODE}/${code}`);
    return response.data;
}

/**
 * Get comprehensive report for a student by ID
 */
export async function getStudentReportById(id: string): Promise<ReportResponse> {
    const response = await api.get<ReportResponse>(`${REPORT_ENDPOINTS.STUDENT_BY_ID}/${id}`);
    return response.data;
}

