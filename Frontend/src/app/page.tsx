import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function HomePage() {
  // Redirect to dashboard page by default
  redirect(ROUTES.DASHBOARD);
}
