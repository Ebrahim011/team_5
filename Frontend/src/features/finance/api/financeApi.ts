import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type { FinanceSummary, PaymentsList, PaymentStatus } from '../types';

const FINANCE_ENDPOINTS = {
    SUMMARY: '/finance/summary',
    PAYMENTS: '/finance/payments',
} as const;

export interface PaymentsFilters {
    status?: PaymentStatus | 'all';
    type?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

export async function getFinanceSummary(): Promise<ApiResponse<FinanceSummary>> {
    const response = await api.get<ApiResponse<FinanceSummary>>(FINANCE_ENDPOINTS.SUMMARY);
    return response.data;
}

export async function getPayments(filters: PaymentsFilters = {}): Promise<ApiResponse<PaymentsList>> {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const query = params.toString();
    const url = query ? `${FINANCE_ENDPOINTS.PAYMENTS}?${query}` : FINANCE_ENDPOINTS.PAYMENTS;

    const response = await api.get<ApiResponse<PaymentsList>>(url);
    return response.data;
}
















