import api from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { Exam, ExamResult, ExamStats } from '@/types/exam';

export const examService = {
    // Stats
    getStats: async (): Promise<ApiResponse<ExamStats>> => {
        const response = await api.get('/exams/stats/overview');
        return response.data;
    },

    // Recent Results
    getRecentResults: async (): Promise<ApiResponse<any[]>> => {
        const response = await api.get('/exams/results/recent');
        return response.data;
    },

    // Results
    getAllResults: async (params?: { studentCode?: string, search?: string, page?: number, limit?: number }): Promise<ApiResponse<any[]>> => {
        const response = await api.get('/exams/results/all', { params });
        return response.data;
    },

    // Exams
    getExams: async (): Promise<ApiResponse<Exam[]>> => {
        const response = await api.get('/exams');
        return response.data;
    },

    createExam: async (data: Partial<Exam>): Promise<ApiResponse<Exam>> => {
        const response = await api.post('/exams', data);
        return response.data;
    },

    getExamById: async (id: string): Promise<ApiResponse<Exam>> => {
        const response = await api.get(`/exams/${id}`);
        return response.data;
    },

    // Results
    getExamResults: async (id: string): Promise<ApiResponse<ExamResult[]>> => {
        const response = await api.get(`/exams/${id}/results`);
        return response.data;
    },

    addExamResults: async (id: string, results: any[]): Promise<ApiResponse<ExamResult[]>> => {
        const response = await api.post(`/exams/${id}/results`, { results });
        return response.data;
    },

    addSingleResult: async (data: { studentName?: string, studentCode?: string, examId?: string, examTitle?: string, fullMark?: number, score: number, status?: string }): Promise<ApiResponse<any>> => {
        const response = await api.post('/exams/results/single', data);
        return response.data;
    },

    // Update a single result
    updateResult: async (id: string, data: { score?: number, status?: string, notes?: string }): Promise<ApiResponse<any>> => {
        const response = await api.put(`/exams/results/${id}`, data);
        return response.data;
    },

    // Delete a single result
    deleteResult: async (id: string): Promise<ApiResponse<void>> => {
        const response = await api.delete(`/exams/results/${id}`);
        return response.data;
    }
};
