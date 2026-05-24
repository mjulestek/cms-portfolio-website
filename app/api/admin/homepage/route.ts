import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assetUrlFromKey } from '@/lib/s3';
import { requireAdmin } from '@/lib/admin-auth';
import { apiError, handleApiError } from '@/lib/api-errors';
import { homepageSchema } from '@/lib/validation';
import { resolveHomepageFeaturedVideo } from '@/lib/mappers';
import { validateHomepageReferences } from '@/lib/admin-reference-checks';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const content = await prisma.homepageContent.findUnique({ where: { id: 'singleton' } });
    const featuredVideo = await resolveHomepageFeaturedVideo(content?.featuredVideoId);
    return NextResponse.json({ content: content ? { ...content, heroImageUrl: assetUrlFromKey(content.heroImageKey), featuredVideo } : null });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const json = await req.json().catch(() => null);
    if (!json) return apiError('VALIDATION_ERROR', 'Invalid JSON request body', 400);

    const input = homepageSchema.parse(json);
    const refs = await validateHomepageReferences({ featuredVideoId: input.featuredVideoId || null, heroImageKey: input.heroImageKey || null });
    if (!refs.ok) return refs.response;

    const data = { ...input, featuredVideoId: input.featuredVideoId || null };
    const content = await prisma.homepageContent.upsert({
      where: { id: 'singleton' },
      update: data,
      create: { id: 'singleton', ...data },
    });
    const featuredVideo = await resolveHomepageFeaturedVideo(content.featuredVideoId);
    return NextResponse.json({ content: { ...content, heroImageUrl: assetUrlFromKey(content.heroImageKey), featuredVideo } });
  } catch (e) {
    return handleApiError(e);
  }
}
