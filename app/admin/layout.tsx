import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAdmin();
  if (!auth.ok) redirect('/login');
  return <main className="w-full min-w-0 overflow-x-hidden">{children}</main>;
}
