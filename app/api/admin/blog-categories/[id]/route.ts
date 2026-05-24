import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { apiError, handleApiError } from '@/lib/api-errors';
import { blogCategorySchema } from '@/lib/validation';
import { mapBlogCategory } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const json = await req.json().catch(() => null);
    if (!json) return apiError('VALIDATION_ERROR', 'Invalid JSON request body', 400);
    const input = blogCategorySchema.partial().parse(json);
    const category = await prisma.blogCategory.update({ where: { id: params.id }, data: input });
    return NextResponse.json({ category: mapBlogCategory(category) });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const post = await prisma.blogPost.findFirst({ where: { categoryId: params.id }, select: { title: true } });
    if (post) return apiError('CONFLICT', `This category is still used by blog post: ${post.title}`, 409);
    await prisma.blogCategory.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
