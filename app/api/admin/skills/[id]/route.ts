import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { apiError, handleApiError } from '@/lib/api-errors';
import { skillSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const json = await req.json().catch(() => null);
    if (!json) return apiError('VALIDATION_ERROR', 'Invalid JSON request body', 400);

    const input = skillSchema.partial().parse(json);
    const skill = await prisma.skill.update({ where: { id: params.id }, data: input });
    return NextResponse.json({ skill });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const project = await prisma.project.findFirst({ where: { techStackIds: { has: params.id } }, select: { title: true } });
    if (project) {
      return apiError('CONFLICT', `This skill is still used by project: ${project.title}`, 409);
    }

    await prisma.skill.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
