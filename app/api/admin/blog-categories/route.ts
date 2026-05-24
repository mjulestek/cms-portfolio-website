import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { apiError, handleApiError } from '@/lib/api-errors';
import { blogCategorySchema } from '@/lib/validation';
import { mapBlogCategory } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const categories = await prisma.blogCategory.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] });
    return NextResponse.json({ categories: categories.map(mapBlogCategory) });
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
    const input = blogCategorySchema.parse(json);
    const category = await prisma.blogCategory.create({ data: input });
    return NextResponse.json({ category: mapBlogCategory(category) }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
