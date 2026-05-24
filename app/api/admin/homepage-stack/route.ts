import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { apiError, handleApiError } from '@/lib/api-errors';
import { homepageStackSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const items = await prisma.homepageStackItem.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });
    return NextResponse.json({ stackItems: items });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const json = await req.json().catch(() => null);
    if (!json) return apiError('VALIDATION_ERROR', 'Invalid JSON request body', 400);
    const input = homepageStackSchema.parse(json);
    const item = await prisma.homepageStackItem.create({ data: input });
    return NextResponse.json({ stackItem: item }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
