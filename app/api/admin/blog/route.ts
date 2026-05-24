import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { apiError, handleApiError } from '@/lib/api-errors';
import { blogSchema } from '@/lib/validation';
import { mapBlog, resolveBlogReferences } from '@/lib/mappers';
import { validateBlogReferences } from '@/lib/admin-reference-checks';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } });
    const resolvedPosts = await resolveBlogReferences(posts);
    return NextResponse.json({ posts: resolvedPosts.map(mapBlog) });
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

    const input = blogSchema.parse(json);
    const refs = await validateBlogReferences(input);
    if (!refs.ok) return refs.response;

    const post = await prisma.blogPost.create({
      data: {
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt,
        body: input.body,
        status: input.status,
        featured: input.featured,
        homepageVisible: input.homepageVisible,
        homepageOrder: input.homepageOrder,
        categoryId: input.categoryId || null,
        readTime: input.readTime,
        ctaLabel: input.ctaLabel,
        coverImageKey: input.coverImageKey,
        publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
        tagIds: input.tagIds,
        videoEntries: input.videoIds.map((videoId: string, order: number) => ({ videoId, order, featured: order === 0 })),
      },
    });

    const [resolvedPost] = await resolveBlogReferences([post]);
    return NextResponse.json({ post: mapBlog(resolvedPost) }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
