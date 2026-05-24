import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-errors';
import { assetUrlFromKey } from '@/lib/s3';

export const dynamic = 'force-dynamic';

type TestimonialView = { avatarKey?: string | null } & Record<string, unknown>;

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({ where: { visible: true }, orderBy: [{ order: 'asc' }] });
    return NextResponse.json({
      testimonials: (testimonials as TestimonialView[]).map(testimonial => ({
        ...testimonial,
        avatarUrl: assetUrlFromKey(testimonial.avatarKey),
      })),
    });
  } catch (e) {
    return handleApiError(e);
  }
}
