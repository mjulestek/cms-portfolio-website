import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { apiError, handleApiError } from '@/lib/api-errors';
import { createPresignedUploadUrl } from '@/lib/s3';

export const dynamic = 'force-dynamic';

const ALLOWED_PREFIXES = ['images/', 'icons/', 'pdfs/', 'resume/'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_PDF_SIZE = 20 * 1024 * 1024;

const schema = z.object({
  key: z.string().trim().min(1),
  contentType: z.string().trim().min(1),
  size: z.number().int().min(0).optional(),
});

function isAllowedMime(contentType: string) {
  return contentType.startsWith('image/') || contentType === 'application/pdf';
}

function maxSizeFor(contentType: string) {
  return contentType === 'application/pdf' ? MAX_PDF_SIZE : MAX_IMAGE_SIZE;
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const json = await req.json().catch(() => null);
    if (!json) return apiError('VALIDATION_ERROR', 'Invalid JSON request body', 400);

    const input = schema.parse(json);

    const hasAllowedPrefix = ALLOWED_PREFIXES.some(prefix => input.key.startsWith(prefix));
    if (!hasAllowedPrefix) {
      return apiError('VALIDATION_ERROR', `S3 key must start with one of: ${ALLOWED_PREFIXES.join(', ')}`, 400);
    }

    if (input.key.includes('..') || input.key.startsWith('/') || input.key.includes('\\')) {
      return apiError('VALIDATION_ERROR', 'S3 key contains unsafe path characters', 400);
    }

    if (!isAllowedMime(input.contentType)) {
      return apiError('VALIDATION_ERROR', 'Only images and PDF files can be uploaded to S3. Videos must use YouTube.', 400);
    }

    if (input.size !== undefined && input.size > maxSizeFor(input.contentType)) {
      return apiError('VALIDATION_ERROR', 'File is too large for this upload type', 400);
    }

    const result = await createPresignedUploadUrl(input);
    return NextResponse.json(result);
  } catch (e) {
    return handleApiError(e);
  }
}
