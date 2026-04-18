'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { WifiOff, ArrowRight } from 'lucide-react';
import { useToast } from './ui';

// Pages that work offline
const OFFLINE_ALLOWED_PAGES = [
  '/dashboard/attendance',
  '/attendance', // Also allow /attendance route for assistants
  '/dashboard/sessions', // Allow session pages (student registration)
];

interface OfflineGuardProps {
  children: React.ReactNode;
}

export default function OfflineGuard({ children }: OfflineGuardProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  useEffect(() => {
    // Check initial online status
    const checkOnlineStatus = () => {
      if (typeof window !== 'undefined') {
        setIsOffline(!navigator.onLine);
        setIsChecking(false);
      }
    };

    checkOnlineStatus();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isChecking || !isOffline || !pathname) return;

    // Normalize pathname (remove trailing slashes, query params, etc.)
    const normalizedPath = pathname.split('?')[0].replace(/\/$/, '') || '/';
    
    // Check if current page is allowed in offline mode
    const isAllowed = OFFLINE_ALLOWED_PAGES.some(allowed => {
      const normalizedAllowed = allowed.replace(/\/$/, '');
      return normalizedPath === normalizedAllowed || normalizedPath.startsWith(normalizedAllowed + '/');
    });

    if (!isAllowed) {
      // Show toast message when navigating to non-allowed page
      showToast('أنت في وضع offline وهذه الصفحة غير متاحة في هذا الوضع', 'warning');
      
      // Log for debugging
      console.log('🚫 OfflineGuard: Blocked access to non-allowed page:', {
        pathname,
        normalizedPath,
        allowedPages: OFFLINE_ALLOWED_PAGES,
      });
    }
  }, [isOffline, pathname, showToast, isChecking]);

  // Show loading while checking
  if (isChecking) {
    return <>{children}</>;
  }

  // If offline and page is not allowed, show blocking message
  if (isOffline && pathname) {
    // Normalize pathname (remove trailing slashes, query params, etc.)
    const normalizedPath = pathname.split('?')[0].replace(/\/$/, '') || '/';
    
    const isAllowed = OFFLINE_ALLOWED_PAGES.some(allowed => {
      // Check exact match or starts with
      const normalizedAllowed = allowed.replace(/\/$/, '');
      return normalizedPath === normalizedAllowed || normalizedPath.startsWith(normalizedAllowed + '/');
    });

    // Debug logging (always log to help diagnose issues)
    console.log('🔍 OfflineGuard check:', {
      pathname,
      normalizedPath,
      isOffline,
      isAllowed,
      allowedPages: OFFLINE_ALLOWED_PAGES,
    });

    if (!isAllowed) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md mx-4 text-center">
            <div className="bg-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <WifiOff className="h-10 w-10 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-cairo">
              وضع Offline
            </h2>
            <p className="text-gray-600 mb-6 font-cairo">
              أنت في وضع offline وهذه الصفحة غير متاحة في هذا الوضع
            </p>
            <button
              onClick={() => {
                // Use window.location to allow Service Worker to serve from cache
                // router.push tries to fetch from network which fails when offline
                if (typeof window !== 'undefined') {
                  window.location.href = '/dashboard/attendance';
                }
              }}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold font-cairo hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <span>الذهاب إلى صفحة الحضور</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

