import { apiError } from '@/lib/api-errors';

export async function requireAdmin() {
  if (process.env.ADMIN_AUTH_BYPASS === 'true') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_AUTH_BYPASS must never be enabled in production');
    }
    return {
      ok: true as const,
      user: { id: 'dev', email: process.env.ADMIN_EMAIL ?? 'dev@example.com', role: 'ADMIN' as const },
    };
  }

  const [{ getServerSession }, { authOptions }, { prisma }] = await Promise.all([
    import('next-auth'),
    import('@/lib/auth'),
    import('@/lib/prisma'),
  ]);

  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return { ok: false as const, response: apiError('UNAUTHORIZED', 'Authentication required', 401) };

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, role: true } });
  if (!user || user.role !== 'ADMIN') {
    return { ok: false as const, response: apiError('FORBIDDEN', 'Admin access required', 403) };
  }

  return { ok: true as const, user };
}
