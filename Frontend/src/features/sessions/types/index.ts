// Session API types
export interface Session {
    id: string;
    _id?: string; // MongoDB ID
    title?: string;
    date: string;
    startTime: string;
    endTime?: string;
    teacher?: {
        id: string;
        name: string;
        email: string;
    };
    grade: string;
    classroom?: string;
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
    price: number;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface SessionStats {
    todaySessions: number;
    todayPresent: number;
    todayAbsent: number;
    todayRevenue: number;
}

export interface CreateSessionData {
    title?: string;
    date: string;
    startTime: string;
    endTime?: string;
    grade: string;
    classroom?: string;
    price: number;
    notes?: string;
}

export interface SessionResponse {
    success: boolean;
    data: Session;
}

export interface SessionsResponse {
    success: boolean;
    count: number;
    data: Session[];
}

export interface SessionStatsResponse {
    success: boolean;
    data: SessionStats;
}
