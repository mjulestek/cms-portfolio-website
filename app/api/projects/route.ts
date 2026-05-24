import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-errors';
import { mapProject, resolveProjectReferences } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 12), 50);
    const offset = Number(req.nextUrl.searchParams.get('offset') ?? 0);
    const tag = req.nextUrl.searchParams.get('tag');
    const where: { status: 'PUBLISHED'; tagIds?: { has: string } } = { status: 'PUBLISHED' };

    if (tag) {
      const tagRecord = await prisma.tag.findUnique({ where: { slug: tag }, select: { id: true } });
      if (!tagRecord) return NextResponse.json({ projects: [], total: 0, limit, offset });
      where.tagIds = { has: tagRecord.id };
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({ where, take: limit, skip: offset, orderBy: { createdAt: 'desc' } }),
      prisma.project.count({ where }),
    ]);

    const resolvedProjects = await resolveProjectReferences(projects);
    return NextResponse.json({ projects: resolvedProjects.map(mapProject), total, limit, offset });
  } catch (e) {
    return handleApiError(e);
  }
}
