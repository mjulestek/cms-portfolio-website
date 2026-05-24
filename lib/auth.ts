import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { prisma } from '@/lib/prisma';

// Augment the built-in session type so TypeScript knows about id and role
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER ?? '',
      from: process.env.EMAIL_FROM ?? 'noreply@example.com',
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user }) {
      const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
      const loginEmail = (user.email ?? '').toLowerCase().trim();
      if (!adminEmail) return false;
      return loginEmail === adminEmail;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as { role?: string }).role;
      }
      return session;
    },
  },
  session: { strategy: 'database' },
};
