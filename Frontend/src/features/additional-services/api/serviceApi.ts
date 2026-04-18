import api from '@/lib/api';
import { Student } from '../../students/api/studentApi';

export interface ServiceRequest {
    id: string;
    _id?: string;
    service: {
        id: string;
        name: string;
        price: number;
    } | string;
    student: Student | string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    notes?: string;
    createdAt: string;
}

export interface CreateServiceRequestData {
    studentId: string;
    serviceName: string;
    price: number;
    notes?: string;
}

export interface ServiceRequestsResponse {
    success: boolean;
    count: number;
    data: ServiceRequest[];
}

const SERVICE_ENDPOINTS = {
    REQUESTS: '/additional-services/requests'
};

export async function createServiceRequest(data: CreateServiceRequestData): Promise<{ success: boolean; data: ServiceRequest }> {
    const response = await api.post<{ success: boolean; data: ServiceRequest }>(SERVICE_ENDPOINTS.REQUESTS, data);
    return response.data;
}

export async function getServiceRequests(): Promise<ServiceRequestsResponse> {
    const response = await api.get<ServiceRequestsResponse>(SERVICE_ENDPOINTS.REQUESTS);
    return response.data;
}

export async function deleteServiceRequest(id: string): Promise<{ success: boolean; message?: string }> {
    const response = await api.delete<{ success: boolean; message?: string }>(`${SERVICE_ENDPOINTS.REQUESTS}/${id}`);
    return response.data;
}