import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { apiError, handleApiError } from '@/lib/api-errors';
import { mediaSchema } from '@/lib/validation';
import { assetUrlFromKey } from '@/lib/env';

export const dynamic = 'force-dynamic';

type MediaAssetView = { s3Key: string } & Record<string, unknown>;

function withPublicUrl(asset: MediaAssetView) {
  return { ...asset, url: assetUrlFromKey(asset.s3Key) };
}

async function findMediaUsage(s3Key: string) {
  const [projectCover, projectPdf, blogCover, resume, skill, testimonial, socialLink] = await Promise.all([
    prisma.project.findFirst({ where: { coverImageKey: s3Key }, select: { id: true, title: true } }),
    prisma.project.findFirst({ where: { pdfKey: s3Key }, select: { id: true, title: true } }),
    prisma.blogPost.findFirst({ where: { coverImageKey: s3Key }, select: { id: true, title: true } }),
    prisma.resume.findFirst({ where: { s3Key }, select: { id: true, label: true } }),
    prisma.skill.findFirst({ where: { iconKey: s3Key }, select: { id: true, name: true } }),
    prisma.testimonial.findFirst({ where: { avatarKey: s3Key }, select: { id: true, name: true } }),
    prisma.socialLink.findFirst({ where: { iconKey: s3Key }, select: { id: true, platform: true } }),
  ]);

  return [
    projectCover && `project cover: ${projectCover.title}`,
    projectPdf && `project PDF: ${projectPdf.title}`,
    blogCover && `blog cover: ${blogCover.title}`,
    resume && `resume: ${resume.label}`,
    skill && `skill icon: ${skill.name}`,
    testimonial && `testimonial avatar: ${testimonial.name}`,
    socialLink && `social icon: ${socialLink.platform}`,
  ].filter(Boolean) as string[];
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const json = await req.json().catch(() => null);
    if (!json) return apiError('VALIDATION_ERROR', 'Invalid JSON request body', 400);

    const input = mediaSchema.partial().parse(json);
    const asset = await prisma.mediaAsset.update({ where: { id: params.id }, data: input });
    return NextResponse.json({ asset: withPublicUrl(asset as MediaAssetView) });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const asset = await prisma.mediaAsset.findUnique({ where: { id: params.id } });
    if (!asset) return apiError('NOT_FOUND', 'Media asset not found', 404);

    const usage = await findMediaUsage(asset.s3Key);
    if (usage.length > 0) {
      return apiError('CONFLICT', 'This media asset is still used and cannot be deleted safely', 409, usage);
    }

    await prisma.mediaAsset.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
