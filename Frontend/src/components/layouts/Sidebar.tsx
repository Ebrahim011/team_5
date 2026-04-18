'use client';

import {
    LayoutDashboard,
    UserCheck,
    Users,
    Wallet,
    FileText,
    GraduationCap,
    Gift,
    MessageCircle,
    LogOut,
    CheckSquare,
    Menu,
    X
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useMemo, memo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';

const Sidebar = memo(function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { logout, user, isLoading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    console.log('Sidebar Debug:', { user, role: user?.role, code: user?.teacherCode });

    const handleLogout = async () => {
        try {
            await logout();
            router.push(ROUTES.LOGIN);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const menuItems = useMemo(() => {
        const allItems = [
            { icon: LayoutDashboard, label: 'الرئيسية', href: ROUTES.DASHBOARD, roles: ['admin', 'teacher'] },
            { icon: UserCheck, label: 'تسجيل حضور', href: ROUTES.ATTENDANCE, roles: ['admin', 'teacher', 'assistant'] },
            { icon: Users, label: 'إضافة طلاب', href: ROUTES.STUDENTS_ADD, roles: ['admin', 'teacher', 'assistant'] },
            { icon: Wallet, label: 'الإدارة المالية', href: ROUTES.FINANCE, roles: ['admin', 'teacher'] },
            { icon: FileText, label: 'التقارير الشاملة', href: ROUTES.REPORTS, roles: ['admin', 'teacher'] },
            { icon: GraduationCap, label: 'درجات الامتحانات', href: ROUTES.GRADES, roles: ['admin', 'teacher', 'assistant'] },
            { icon: Gift, label: 'الخدمات الاضافيه', href: ROUTES.SERVICES, roles: ['admin', 'teacher'] },
            { icon: MessageCircle, label: 'التواصل', href: ROUTES.CONTACT, roles: ['admin', 'teacher', 'assistant'] },
        ];

        // Filter menu items based on user role
        // If user is not loaded or role is not set, show all items (default to teacher access)
        // This prevents menu from being empty during loading or if role is missing
        if (!user || !user.role) {
            // Show all items if user is not loaded yet (will be filtered once user loads)
            return allItems;
        }

        const userRole = user.role;

        // If role is 'parent' or unknown, default to showing teacher items
        if (userRole === 'parent' || !['admin', 'teacher', 'assistant'].includes(userRole)) {
            // Default to teacher access for unknown roles
            return allItems.filter(item => item.roles.includes('teacher') || item.roles.includes('admin'));
        }

        return allItems.filter(item => item.roles.includes(userRole));
    }, [user?.role]);

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-6 left-6 z-[60] p-2 bg-[#5629A3] text-white rounded-lg shadow-lg hover:bg-[#4a238b] transition-colors"
                aria-label="Toggle Menu"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[50]"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={`
                    fixed inset-y-0 right-0 z-[55]
                    w-[280px] bg-[#5629A3] text-white max-h-screen h-full flex flex-col overflow-hidden
                    lg:rounded-l-[30px] shadow-xl transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : 'translate-x-[280px] lg:translate-x-0'}
                `}
                style={{ willChange: 'transform' }}
            >
                {/* Content wrapper with padding */}
                <div className="flex flex-col h-full p-4 sm:p-6">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-6 sm:mb-10 px-2 mt-2 sm:mt-4 lg:mt-0 flex-shrink-0">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#5629A3] font-bold text-xl">
                            CT
                        </div>
                        <div>
                            <h1 className="font-bold text-xl leading-tight text-white">ClassTrack</h1>
                            <p className="text-xs opacity-80 text-white">نظام إدارة الحضور</p>
                        </div>
                    </div>

                    {/* User Profile */}
                    <div className="bg-[#6D3DBA] rounded-2xl p-4 mb-6 sm:mb-8 flex items-center gap-4 flex-shrink-0">
                        <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold text-lg">
                            {isLoading ? (
                                <div className="w-8 h-8 bg-purple-300 rounded-full animate-pulse" />
                            ) : (
                                user?.name?.charAt(0)?.toUpperCase() || 'U'
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs opacity-70 mb-1">مرحباً بك</p>
                            {isLoading ? (
                                <div className="space-y-1">
                                    <div className="h-3 bg-white/20 rounded animate-pulse w-20" />
                                    <div className="h-2 bg-white/20 rounded animate-pulse w-16" />
                                </div>
                            ) : (
                                <>
                                    <h3 className="font-bold text-sm truncate">{user?.name || 'مستخدم'}</h3>
                                    <div className="flex flex-col gap-0.5">
                                        {/* <p className="text-[10px] opacity-80 truncate text-purple-100">{user?.email}</p> */}
                                        <p className="text-xs opacity-70 truncate">{user?.subject || 'مدرس'}</p>
                                        {user && (
                                            <div className="mt-2 p-2 bg-white/10 rounded-lg border border-white/10">
                                                <p className="text-[9px] uppercase tracking-wider opacity-60 mb-0.5 font-bold">كود المعلم الخاص بك</p>
                                                <p className="text-sm font-bold font-mono tracking-widest text-white">{user.teacherCode || 'Loading...'}</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Navigation - scrollable area */}
                    <nav className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                        {menuItems.map((item) => {
                            const isActive = pathname?.startsWith(item.href) ?? false;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    prefetch={true}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                            ? 'bg-white/10 font-bold'
                                            : 'hover:bg-white/5 opacity-80 hover:opacity-100'
                                        }`}
                                >
                                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-purple-200 group-hover:text-white'}`} />
                                    <span className="text-sm">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout - fixed at bottom */}
                    <div className="pt-4 mt-4 border-t border-white/10 flex-shrink-0">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 opacity-80 hover:opacity-100 transition-all text-red-200 hover:text-red-100"
                        >
                            <LogOut className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">تسجيل خروج</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
});
Sidebar.displayName = 'Sidebar';
export default Sidebar;
