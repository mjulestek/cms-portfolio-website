import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { apiError, handleApiError } from '@/lib/api-errors';
import { legalLinkSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const json = await req.json().catch(() => null);
    if (!json) return apiError('VALIDATION_ERROR', 'Invalid JSON request body', 400);
    const input = legalLinkSchema.partial().parse(json);
    const item = await prisma.legalLink.update({ where: { id: params.id }, data: input });
    return NextResponse.json({ link: item });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    await prisma.legalLink.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
