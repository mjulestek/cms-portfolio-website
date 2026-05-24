import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { apiError, handleApiError } from '@/lib/api-errors';
import { videoUpdateSchema } from '@/lib/youtube';
import { mapVideo } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const json = await req.json().catch(() => null);
    if (!json) return apiError('VALIDATION_ERROR', 'Invalid JSON request body', 400);

    const input = videoUpdateSchema.parse(json);
    const video = await prisma.videoAsset.update({ where: { id: params.id }, data: input });
    return NextResponse.json({ video: mapVideo(video) });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const [project, post, homepage] = await Promise.all([
      prisma.project.findFirst({ where: { videoEntries: { some: { videoId: params.id } } }, select: { title: true } }),
      prisma.blogPost.findFirst({ where: { videoEntries: { some: { videoId: params.id } } }, select: { title: true } }),
      prisma.homepageContent.findFirst({ where: { featuredVideoId: params.id }, select: { id: true } }),
    ]);

    if (project || post || homepage) {
      return apiError('CONFLICT', 'This video is still attached to content and cannot be deleted safely', 409, [
        project && `project: ${project.title}`,
        post && `blog post: ${post.title}`,
        homepage && 'homepage featured video',
      ].filter(Boolean));
    }

    await prisma.videoAsset.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
