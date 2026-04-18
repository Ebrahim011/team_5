export default function FinanceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Sidebar + auth gating now live in Root `AppShell` to prevent remount/flash.
    return <>{children}</>;
}

