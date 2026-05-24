import { NextRequest, NextResponse } from 'next/server';
import { createTransport } from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { apiError, handleApiError } from '@/lib/api-errors';
import { contactSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

    const { allowed } = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000);

    if (!allowed) {
      return apiError('RATE_LIMITED', 'Too many requests. Please try again later.', 429);
    }

    const json = await req.json().catch(() => null);

    if (!json) {
      return apiError('VALIDATION_ERROR', 'Invalid JSON request body', 400);
    }

    const input = contactSchema.parse(json);

    if (input.company) {
      return NextResponse.json({ success: true });
    }

    const message = await prisma.contactMessage.create({
      data: {
        name: input.name,
        email: input.email,
        subject: input.subject,
        message: input.message,
        ipAddress: ip,
        userAgent: req.headers.get('user-agent'),
      },
    });

    await prisma.analyticsEvent
      .create({
        data: {
          type: 'CONTACT_SUBMIT',
          path: '/contact',
        },
      })
      .catch(() => null);

    if (!process.env.EMAIL_SERVER) {
      throw new Error('EMAIL_SERVER is missing');
    }

    if (!process.env.EMAIL_FROM) {
      throw new Error('EMAIL_FROM is missing');
    }

    if (!process.env.ADMIN_EMAIL) {
      throw new Error('ADMIN_EMAIL is missing');
    }

    const transporter = createTransport(process.env.EMAIL_SERVER);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.ADMIN_EMAIL,
      replyTo: input.email,
      subject: `New contact message: ${input.subject}`,
      text: `
New contact message

Name: ${input.name}
Email: ${input.email}
Subject: ${input.subject}

Message:
${input.message}

Message ID: ${message.id}
IP Address: ${ip}
      `.trim(),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>New contact message</h2>

          <p><strong>Name:</strong> ${input.name}</p>
          <p><strong>Email:</strong> ${input.email}</p>
          <p><strong>Subject:</strong> ${input.subject}</p>

          <hr />

          <p><strong>Message:</strong></p>
          <p>${input.message.replace(/\n/g, '<br />')}</p>

          <hr />

          <p><strong>Message ID:</strong> ${message.id}</p>
          <p><strong>IP Address:</strong> ${ip}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}