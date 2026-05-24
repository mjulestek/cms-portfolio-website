import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, handleApiError } from '@/lib/api-errors';
import { mapBlog, resolveBlogReferences } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  try {
    const post = await prisma.blogPost.findFirst({ where: { slug: params.slug, status: 'PUBLISHED' } });
    if (!post) return apiError('NOT_FOUND', 'Blog post not found', 404);

    const [resolvedPost] = await resolveBlogReferences([post]);
    return NextResponse.json({ post: mapBlog(resolvedPost) });
  } catch (e) {
    return handleApiError(e);
  }
}
