import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { apiError, handleApiError } from '@/lib/api-errors';
import { footerSettingsSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const defaults = {
  id: 'singleton',
  logoText: 'Jules Munyaneza',
  location: 'Kigali, Rwanda',
  email: 'mjules.tek@gmail.com',
  linkedInUrl: 'https://www.linkedin.com/in/mjules-tek',
  copyrightText: '© 2026 Jules Munyaneza. All rights reserved.',
};

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const settings = await prisma.footerSettings.findUnique({ where: { id: 'singleton' } });
    return NextResponse.json({ settings: settings ?? defaults });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const json = await req.json().catch(() => null);
    if (!json) return apiError('VALIDATION_ERROR', 'Invalid JSON request body', 400);
    const input = footerSettingsSchema.parse(json);
    const settings = await prisma.footerSettings.upsert({
      where: { id: 'singleton' },
      update: input,
      create: { id: 'singleton', ...input },
    });
    return NextResponse.json({ settings });
  } catch (e) {
    return handleApiError(e);
  }
}
