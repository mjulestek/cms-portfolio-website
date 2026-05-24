import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, handleApiError } from '@/lib/api-errors';
import { contactSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 submissions per IP per hour
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const { allowed } = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000);
    if (!allowed) return apiError('RATE_LIMITED', 'Too many requests. Please try again later.', 429);

    const json = await req.json().catch(() => null);
    if (!json) return apiError('VALIDATION_ERROR', 'Invalid JSON request body', 400);

    const input = contactSchema.parse(json);

    // Honeypot: silently succeed if the hidden company field is filled
    if (input.company) return NextResponse.json({ success: true });

    await prisma.contactMessage.create({
      data: {
        name: input.name,
        email: input.email,
        subject: input.subject,
        message: input.message,
        ipAddress: ip,
        userAgent: req.headers.get('user-agent'),
      },
    });

    await prisma.analyticsEvent.create({ data: { type: 'CONTACT_SUBMIT', path: '/contact' } }).catch(() => null);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) { return handleApiError(e); }
}
