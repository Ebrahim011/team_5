import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TOKEN_KEY, PROTECTED_ROUTES, AUTH_ROUTES, ROUTES, ASSISTANT_ROUTES } from '@/lib/constants';

// Parse JWT token in Edge runtime (no Buffer support)
function parseTokenEdge(token: string): { id: string; exp: number; role?: string; email?: string } | null {
    try {
        const base64Payload = token.split('.')[1];
        // Use atob for base64 decoding in Edge runtime
        const payload = atob(base64Payload);
        return JSON.parse(payload);
    } catch {
        return null;
    }
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get(TOKEN_KEY)?.value;

    // Check if the route is protected
    const isProtectedRoute = PROTECTED_ROUTES.some(route =>
        pathname.startsWith(route)
    );

    // Check if the route is an auth route (login, register, etc.)
    const isAuthRoute = AUTH_ROUTES.some(route =>
        pathname.startsWith(route)
    );

    // If trying to access protected route without token, redirect to login
    if (isProtectedRoute && !token) {
        const loginUrl = new URL(ROUTES.LOGIN, request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If trying to access auth route with token, redirect to dashboard (or first allowed page for assistants)
    if (isAuthRoute && token) {
        const decoded = parseTokenEdge(token);
        const userRole = decoded?.role;
        
        // Assistants should be redirected to attendance page instead of dashboard
        if (userRole === 'assistant') {
            return NextResponse.redirect(new URL(ROUTES.ATTENDANCE, request.url));
        }
        
        return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
    }

    // Role-based access control for assistants
    if (token) {
        const decoded = parseTokenEdge(token);
        const userRole = decoded?.role;

        if (userRole === 'assistant') {
            // Allow access to unauthorized page (to show the message)
            if (pathname === ROUTES.UNAUTHORIZED) {
                return NextResponse.next();
            }

            // Block assistants from accessing main dashboard
            if (pathname === '/dashboard' || (pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/sessions'))) {
                return NextResponse.redirect(new URL(ROUTES.UNAUTHORIZED, request.url));
            }

            // Block assistants from accessing routes not in ASSISTANT_ROUTES
            if (isProtectedRoute) {
                const isAllowedRoute = ASSISTANT_ROUTES.some(route =>
                    pathname.startsWith(route)
                );
                
                if (!isAllowedRoute) {
                    // Redirect to unauthorized page instead of automatic redirect
                    return NextResponse.redirect(new URL(ROUTES.UNAUTHORIZED, request.url));
                }
            }
        }
    }

    return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc.)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
    ],
};
