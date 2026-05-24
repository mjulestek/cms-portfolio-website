import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { apiError, handleApiError } from '@/lib/api-errors';
import { projectSchema } from '@/lib/validation';
import { mapProject, resolveProjectReferences } from '@/lib/mappers';
import { validateProjectReferences } from '@/lib/admin-reference-checks';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const projects = await prisma.project.findMany({ orderBy: { createdAt: 'desc' } });
    const resolvedProjects = await resolveProjectReferences(projects);
    return NextResponse.json({ projects: resolvedProjects.map(mapProject) });
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

    const input = projectSchema.parse(json);
    const refs = await validateProjectReferences(input);
    if (!refs.ok) return refs.response;

    const project = await prisma.project.create({
      data: {
        slug: input.slug,
        title: input.title,
        tagline: input.tagline,
        status: input.status,
        featured: input.featured,
        homepageVisible: input.homepageVisible,
        homepageOrder: input.homepageOrder,
        homepagePlacement: input.homepagePlacement,
        readTime: input.readTime,
        ctaLabel: input.ctaLabel,
        story: input.story,
        challenge: input.challenge,
        solution: input.solution,
        results: input.results,
        metrics: input.metrics,
        coverImageKey: input.coverImageKey,
        pdfKey: input.pdfKey,
        githubUrl: input.githubUrl || null,
        liveUrl: input.liveUrl || null,
        images: [],
        tagIds: input.tagIds,
        techStackIds: input.techStackIds,
        videoEntries: input.videoIds.map((videoId: string, order: number) => ({ videoId, order, featured: order === 0 })),
      },
    });

    const [resolvedProject] = await resolveProjectReferences([project]);
    return NextResponse.json({ project: mapProject(resolvedProject) }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
