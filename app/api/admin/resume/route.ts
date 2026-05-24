import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { apiError, handleApiError } from '@/lib/api-errors';
import { resumeSchema } from '@/lib/validation';
import { validateResumeReferences } from '@/lib/admin-reference-checks';

export const dynamic = 'force-dynamic';

type ResumeTransaction = {
  resume: {
    updateMany: typeof prisma.resume.updateMany;
    create: typeof prisma.resume.create;
  };
};

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const resumes = await prisma.resume.findMany({ orderBy: { uploadedAt: 'desc' } });
    return NextResponse.json({ resumes });
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
    const input = resumeSchema.parse(json);
    const refs = await validateResumeReferences(input.s3Key);
    if (!refs.ok) return refs.response;

    const resume = await prisma.$transaction(async (tx: ResumeTransaction) => {
      if (input.active) await tx.resume.updateMany({ data: { active: false } });
      return tx.resume.create({ data: input });
    });
    return NextResponse.json({ resume }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
