import api from '@/lib/api';

export interface Message {
    id: string;
    sender: any;
    student: any;
    content: string;
    createdAt: string;
}

export interface SendMessageData {
    studentId: string;
    content: string;
}

export async function sendMessage(data: SendMessageData): Promise<{ success: boolean; data: Message }> {
    const response = await api.post<{ success: boolean; data: Message }>('/messages', data);
    return response.data;
}

export async function getMessages(studentId?: string): Promise<{ success: boolean; count: number; data: Message[] }> {
    const params = studentId ? { studentId } : {};
    const response = await api.get<{ success: boolean; count: number; data: Message[] }>('/messages', { params });
    return response.data;
}
