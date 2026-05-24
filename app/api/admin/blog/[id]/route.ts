import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { apiError, handleApiError } from '@/lib/api-errors';
import { blogSchema } from '@/lib/validation';
import { mapBlog, resolveBlogReferences } from '@/lib/mappers';
import { validateBlogReferences } from '@/lib/admin-reference-checks';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const post = await prisma.blogPost.findUnique({ where: { id: params.id } });
    if (!post) return apiError('NOT_FOUND', 'Blog post not found', 404);

    const [resolvedPost] = await resolveBlogReferences([post]);
    return NextResponse.json({ post: mapBlog(resolvedPost) });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const json = await req.json().catch(() => null);
    if (!json) return apiError('VALIDATION_ERROR', 'Invalid JSON request body', 400);

    const input = blogSchema.partial().parse(json);
    const refs = await validateBlogReferences(input);
    if (!refs.ok) return refs.response;

    const { tagIds, videoIds, ...scalarFields } = input;

    const publishedAtUpdate =
      scalarFields.status === 'PUBLISHED'
        ? {
            publishedAt:
              (await prisma.blogPost.findUnique({ where: { id: params.id }, select: { publishedAt: true } }))?.publishedAt ??
              new Date(),
          }
        : {};

    const post = await prisma.blogPost.update({
      where: { id: params.id },
      data: {
        ...scalarFields,
        ...publishedAtUpdate,
        ...(tagIds !== undefined && { tagIds }),
        ...(videoIds !== undefined && {
          videoEntries: videoIds.map((videoId: string, order: number) => ({ videoId, order, featured: order === 0 })),
        }),
      },
    });

    const [resolvedPost] = await resolveBlogReferences([post]);
    return NextResponse.json({ post: mapBlog(resolvedPost) });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const post = await prisma.blogPost.update({ where: { id: params.id }, data: { status: 'ARCHIVED' } });
    const [resolvedPost] = await resolveBlogReferences([post]);
    return NextResponse.json({ post: mapBlog(resolvedPost) });
  } catch (e) {
    return handleApiError(e);
  }
}
