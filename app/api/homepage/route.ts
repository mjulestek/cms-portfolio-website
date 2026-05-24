import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-errors';
import { mapProject, mapVideo, resolveHomepageFeaturedVideo, resolveProjectReferences } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [content, featuredProjects, featuredVideos] = await Promise.all([
      prisma.homepageContent.findUnique({ where: { id: 'singleton' } }),
      prisma.project.findMany({
        where: { status: 'PUBLISHED', featured: true },
        take: 3,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.videoAsset.findMany({ where: { featured: true }, orderBy: [{ order: 'asc' }], take: 6 }),
    ]);

    const [resolvedProjects, featuredVideo] = await Promise.all([
      resolveProjectReferences(featuredProjects),
      resolveHomepageFeaturedVideo(content?.featuredVideoId),
    ]);

    return NextResponse.json({
      content: content ? { ...content, featuredVideo } : null,
      featuredProjects: resolvedProjects.map(mapProject),
      featuredVideos: featuredVideos.map(mapVideo),
    });
  } catch (e) {
    return handleApiError(e);
  }
}
