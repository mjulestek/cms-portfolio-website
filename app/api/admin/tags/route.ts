import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { apiError, handleApiError } from '@/lib/api-errors';
import { mapTag } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

const tagSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only'),
});

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ tags: tags.map(mapTag) });
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

    const input = tagSchema.parse(json);
    const tag = await prisma.tag.create({ data: input });
    return NextResponse.json({ tag: mapTag(tag) }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
