import api from '@/lib/api';

export interface CreateAssistantData {
    name: string;
    email: string;
    password: string;
    phone?: string;
}

export interface UpdateAssistantData {
    name?: string;
    phone?: string;
    isActive?: boolean;
}

export interface Assistant {
    id: string;
    _id?: string;
    name: string;
    email: string;
    phone?: string;
    role: 'assistant';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

export interface AssistantsResponse {
    success: boolean;
    data: {
        assistants: Assistant[];
        count: number;
    };
}

const ASSISTANT_ENDPOINTS = {
    ASSISTANTS: '/assistants'
};

/**
 * Create new assistant account
 */
export async function createAssistant(data: CreateAssistantData): Promise<ApiResponse<{ assistant: Assistant }>> {
    const response = await api.post<ApiResponse<{ assistant: Assistant }>>(ASSISTANT_ENDPOINTS.ASSISTANTS, data);
    return response.data;
}

/**
 * Get all assistants
 */
export async function getAssistants(): Promise<AssistantsResponse> {
    const response = await api.get<AssistantsResponse>(ASSISTANT_ENDPOINTS.ASSISTANTS);
    return response.data;
}

/**
 * Update assistant
 */
export async function updateAssistant(id: string, data: UpdateAssistantData): Promise<ApiResponse<{ assistant: Assistant }>> {
    const response = await api.patch<ApiResponse<{ assistant: Assistant }>>(`${ASSISTANT_ENDPOINTS.ASSISTANTS}/${id}`, data);
    return response.data;
}

/**
 * Delete assistant
 */
export async function deleteAssistant(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`${ASSISTANT_ENDPOINTS.ASSISTANTS}/${id}`);
    return response.data;
}




















