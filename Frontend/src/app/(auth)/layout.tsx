export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // AuthProvider now lives in Root `AppShell` so it doesn't remount per-route.
    return children;
}
