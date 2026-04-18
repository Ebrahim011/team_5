export interface Exam {
    id: string;
    teacherId: string;
    title: string;
    date: string;
    fullMark: number;
    passingMark: number;
    subject?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ExamResult {
    id: string;
    teacherId: string;
    examId: string | Exam;
    studentId: string | { _id: string; name: string; studentCode: string };
    score: number;
    status: 'present' | 'absent';
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ExamStats {
    totalExams: number;
    averagePercentage: number;
    excellentCount: number;
    totalResults: number;
}
