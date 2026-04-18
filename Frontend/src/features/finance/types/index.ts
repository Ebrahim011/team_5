export type PaymentStatus = 'pending' | 'paid' | 'unpaid' | 'overdue' | 'cancelled' | 'refunded';

export interface FinanceStudent {
    id: string;
    fullName: string;
    nationalId?: string;
    grade?: string;
    parentPhone?: string;
}

export interface PaymentItem {
    id: string;
    amount: number;
    status: PaymentStatus;
    type?: string;
    date: string;
    dueDate?: string;
    description?: string;
    receiptNumber?: string;
    paymentMethod?: string;
    student?: FinanceStudent | null;
}

export interface FinanceSummary {
    todayRevenue: number;
    monthRevenue: number;
    weekRevenue: number;
    paidCount: number;
    pendingCount: number;
    recentPaid: PaymentItem[];
    pendingStudents: PaymentItem[];
}

export interface PaymentsList {
    payments: PaymentItem[];
    total: number;
    page: number;
    pages: number;
    limit: number;
}

