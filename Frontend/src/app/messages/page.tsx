'use client';

import CommunicationPage from '@/Pages/Communication/CommunicationPage';

// Force dynamic rendering to prevent build-time errors with AuthProvider
export const dynamic = 'force-dynamic';

export default function MessagesPage() {
    return <CommunicationPage />;
}
