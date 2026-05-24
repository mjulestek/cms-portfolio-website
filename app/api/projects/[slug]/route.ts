import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, handleApiError } from '@/lib/api-errors';
import { mapProject, resolveProjectReferences } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  try {
    const project = await prisma.project.findFirst({ where: { slug: params.slug, status: 'PUBLISHED' } });
    if (!project) return apiError('NOT_FOUND', 'Project not found', 404);

    const [resolvedProject] = await resolveProjectReferences([project]);
    return NextResponse.json({ project: mapProject(resolvedProject) });
  } catch (e) {
    return handleApiError(e);
  }
}
