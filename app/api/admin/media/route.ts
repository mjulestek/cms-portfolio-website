import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { apiError, handleApiError } from '@/lib/api-errors';
import { mediaSchema } from '@/lib/validation';
import { assetUrlFromKey } from '@/lib/s3';

export const dynamic = 'force-dynamic';

type MediaAssetView = { s3Key: string } & Record<string, unknown>;

function withPublicUrl(asset: MediaAssetView) {
  return {
    ...asset,
    url: assetUrlFromKey(asset.s3Key),
  };
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const assets = await prisma.mediaAsset.findMany({
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({
      assets: (assets as MediaAssetView[]).map(withPublicUrl),
    });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const json = await req.json().catch(() => null);
    if (!json) {
      return apiError('VALIDATION_ERROR', 'Invalid JSON request body', 400);
    }

    const input = mediaSchema.parse(json);

    if (input.mimeType.startsWith('video/')) {
      return apiError(
        'VALIDATION_ERROR',
        'Videos must be managed through YouTube VideoAsset records',
        400,
      );
    }

    const asset = await prisma.mediaAsset.upsert({
      where: { s3Key: input.s3Key },
      update: {
        filename: input.filename,
        mimeType: input.mimeType,
        mediaType: input.mediaType,
        size: input.size,
        alt: input.alt,
        usedIn: input.usedIn,
      },
      create: input,
    });

    return NextResponse.json(
      { asset: withPublicUrl(asset as MediaAssetView) },
      { status: 201 },
    );
  } catch (e) {
    return handleApiError(e);
  }
}