'use client';

import AttendancePage from '@/Pages/AttendancePage/AttendancePage';

// Force dynamic rendering to prevent build-time errors with AuthProvider
export const dynamic = 'force-dynamic';

export default function Attendance() {
   return <AttendancePage />
}