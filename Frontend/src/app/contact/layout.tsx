export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Sidebar + auth gating now live in Root `AppShell` to prevent remount/flash.
    return <>{children}</>;
}

