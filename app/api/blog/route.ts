import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-errors';
import { mapBlog, resolveBlogReferences } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get('limit') ?? 10);
    const offset = Number(req.nextUrl.searchParams.get('offset') ?? 0);
    const tag = req.nextUrl.searchParams.get('tag');
    const category = req.nextUrl.searchParams.get('category');
    const where: { status: 'PUBLISHED'; tagIds?: { has: string }; categoryId?: string } = { status: 'PUBLISHED' };

    if (tag) {
      const tagRecord = await prisma.tag.findUnique({ where: { slug: tag }, select: { id: true } });
      if (!tagRecord) return NextResponse.json({ posts: [], total: 0, limit, offset });
      where.tagIds = { has: tagRecord.id };
    }

    if (category) {
      const categoryRecord = await prisma.blogCategory.findUnique({ where: { slug: category }, select: { id: true } });
      if (!categoryRecord) return NextResponse.json({ posts: [], total: 0, limit, offset });
      where.categoryId = categoryRecord.id;
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({ where, take: limit, skip: offset, orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }] }),
      prisma.blogPost.count({ where }),
    ]);

    const resolvedPosts = await resolveBlogReferences(posts);
    return NextResponse.json({ posts: resolvedPosts.map(mapBlog), total, limit, offset });
  } catch (e) {
    return handleApiError(e);
  }
}
