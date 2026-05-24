import { apiError } from '@/lib/api-errors';
import { prisma } from '@/lib/prisma';

type ReferenceCheck = { ok: true } | { ok: false; response: ReturnType<typeof apiError> };

type MediaTypeName = 'IMAGE' | 'ICON' | 'PDF' | 'RESUME' | 'AVATAR';

async function missingIds(model: 'tag' | 'skill' | 'videoAsset', ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const rows =
    model === 'tag'
      ? await prisma.tag.findMany({ where: { id: { in: uniqueIds } }, select: { id: true } })
      : model === 'skill'
        ? await prisma.skill.findMany({ where: { id: { in: uniqueIds } }, select: { id: true } })
        : await prisma.videoAsset.findMany({ where: { id: { in: uniqueIds } }, select: { id: true } });

  const found = new Set((rows as Array<{ id: string }>).map(row => row.id));
  return uniqueIds.filter(id => !found.has(id));
}

async function ensureIdsExist(model: 'tag' | 'skill' | 'videoAsset', field: string, ids?: string[]): Promise<ReferenceCheck> {
  if (!ids || ids.length === 0) return { ok: true };
  const missing = await missingIds(model, ids);
  if (missing.length === 0) return { ok: true };
  return {
    ok: false,
    response: apiError('VALIDATION_ERROR', `${field} contains records that do not exist`, 400, [
      { field, message: `Invalid IDs: ${missing.join(', ')}` },
    ]),
  };
}

async function ensureMediaKeyExists(field: string, key: string | null | undefined, allowedTypes: MediaTypeName[]): Promise<ReferenceCheck> {
  if (!key) return { ok: true };

  const asset = await prisma.mediaAsset.findUnique({ where: { s3Key: key }, select: { id: true, mediaType: true } });
  if (!asset) {
    return {
      ok: false,
      response: apiError('VALIDATION_ERROR', `${field} references a media file that does not exist`, 400, [
        { field, message: `No media asset found for key: ${key}` },
      ]),
    };
  }

  if (!allowedTypes.includes(asset.mediaType as MediaTypeName)) {
    return {
      ok: false,
      response: apiError('VALIDATION_ERROR', `${field} has the wrong media type`, 400, [
        { field, message: `Expected ${allowedTypes.join(' or ')}, got ${asset.mediaType}` },
      ]),
    };
  }

  return { ok: true };
}

export async function validateProjectReferences(input: {
  tagIds?: string[];
  techStackIds?: string[];
  videoIds?: string[];
  coverImageKey?: string | null;
  pdfKey?: string | null;
}): Promise<ReferenceCheck> {
  for (const check of [
    await ensureIdsExist('tag', 'tagIds', input.tagIds),
    await ensureIdsExist('skill', 'techStackIds', input.techStackIds),
    await ensureIdsExist('videoAsset', 'videoIds', input.videoIds),
    await ensureMediaKeyExists('coverImageKey', input.coverImageKey, ['IMAGE', 'ICON', 'AVATAR']),
    await ensureMediaKeyExists('pdfKey', input.pdfKey, ['PDF', 'RESUME']),
  ]) {
    if (!check.ok) return check;
  }
  return { ok: true };
}

export async function validateBlogReferences(input: {
  tagIds?: string[];
  videoIds?: string[];
  coverImageKey?: string | null;
}): Promise<ReferenceCheck> {
  for (const check of [
    await ensureIdsExist('tag', 'tagIds', input.tagIds),
    await ensureIdsExist('videoAsset', 'videoIds', input.videoIds),
    await ensureMediaKeyExists('coverImageKey', input.coverImageKey, ['IMAGE', 'ICON', 'AVATAR']),
  ]) {
    if (!check.ok) return check;
  }
  return { ok: true };
}

export async function validateHomepageReferences(featuredVideoId?: string | null): Promise<ReferenceCheck> {
  return ensureIdsExist('videoAsset', 'featuredVideoId', featuredVideoId ? [featuredVideoId] : []);
}

export async function validateResumeReferences(s3Key?: string | null): Promise<ReferenceCheck> {
  return ensureMediaKeyExists('s3Key', s3Key, ['PDF', 'RESUME']);
}
