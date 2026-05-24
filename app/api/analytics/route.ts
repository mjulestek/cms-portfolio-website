import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleApiError, apiError } from '@/lib/api-errors';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const schema = z.object({
  type: z.enum(['PAGE_VIEW', 'PROJECT_VIEW', 'BLOG_VIEW', 'VIDEO_PLAY', 'RESUME_DOWNLOAD', 'CONTACT_SUBMIT', 'OUTBOUND_CLICK', 'ADMIN_VIEW']),
  path: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 60 events per IP per minute to prevent flooding
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const { allowed } = rateLimit(`analytics:${ip}`, 60, 60 * 1000);
    if (!allowed) return apiError('RATE_LIMITED', 'Too many requests.', 429);

    const input = schema.parse(await req.json());
    await prisma.analyticsEvent.create({ data: input });
    return NextResponse.json({ success: true });
  } catch (e) { return handleApiError(e); }
}
