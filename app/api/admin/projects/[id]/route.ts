import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { apiError, handleApiError } from '@/lib/api-errors';
import { projectSchema } from '@/lib/validation';
import { mapProject, resolveProjectReferences } from '@/lib/mappers';
import { validateProjectReferences } from '@/lib/admin-reference-checks';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const project = await prisma.project.findUnique({ where: { id: params.id } });
    if (!project) return apiError('NOT_FOUND', 'Project not found', 404);

    const [resolvedProject] = await resolveProjectReferences([project]);
    return NextResponse.json({ project: mapProject(resolvedProject) });
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

    const input = projectSchema.partial().parse(json);
    const refs = await validateProjectReferences(input);
    if (!refs.ok) return refs.response;

    const { tagIds, techStackIds, videoIds, githubUrl, liveUrl, ...scalarFields } = input;

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...scalarFields,
        ...(githubUrl !== undefined && { githubUrl: githubUrl || null }),
        ...(liveUrl !== undefined && { liveUrl: liveUrl || null }),
        ...(tagIds !== undefined && { tagIds }),
        ...(techStackIds !== undefined && { techStackIds }),
        ...(videoIds !== undefined && {
          videoEntries: videoIds.map((videoId: string, order: number) => ({ videoId, order, featured: order === 0 })),
        }),
      },
    });

    const [resolvedProject] = await resolveProjectReferences([project]);
    return NextResponse.json({ project: mapProject(resolvedProject) });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const project = await prisma.project.update({
      where: { id: params.id },
      data: { status: 'ARCHIVED' },
    });

    const [resolvedProject] = await resolveProjectReferences([project]);
    return NextResponse.json({ project: mapProject(resolvedProject) });
  } catch (e) {
    return handleApiError(e);
  }
}
