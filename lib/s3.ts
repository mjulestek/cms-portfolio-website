import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/lib/env';

const client = new S3Client({ region: env.awsRegion });

const IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

const PDF_MIME_TYPES = new Set(['application/pdf']);

function isAllowedUploadMime(mime: string) {
  return IMAGE_MIME_TYPES.has(mime) || PDF_MIME_TYPES.has(mime);
}

function normalizeKey(key: string) {
  return key.replace(/^\/+/, '').trim();
}

function isSafeKey(key: string) {
  if (!key) return false;
  if (key.includes('..')) return false;
  if (key.includes('\\')) return false;
  if (key.startsWith('/')) return false;

  return (
    key.startsWith('images/') ||
    key.startsWith('icons/') ||
    key.startsWith('pdfs/') ||
    key.startsWith('resume/')
  );
}

export function assetUrlFromKey(key?: string | null) {
  if (!key) return null;

  const cleanKey = normalizeKey(key);

  if (cleanKey.startsWith('http://') || cleanKey.startsWith('https://')) {
    return cleanKey;
  }

  const cloudfront = env.cloudfront?.replace(/\/+$/, '');

  if (cloudfront) {
    return `${cloudfront}/${cleanKey}`;
  }

  if (env.s3Bucket && env.awsRegion) {
    return `https://${env.s3Bucket}.s3.${env.awsRegion}.amazonaws.com/${cleanKey}`;
  }

  return null;
}

export async function createPresignedUploadUrl(input: {
  key: string;
  contentType: string;
  size?: number;
}) {
  if (!env.s3Bucket) throw new Error('S3_BUCKET_NAME is required');

  const key = normalizeKey(input.key);
  const contentType = input.contentType || 'application/octet-stream';

  if (!isSafeKey(key)) {
    throw new Error('Invalid upload key. Use images/, icons/, pdfs/, or resume/.');
  }

  if (!isAllowedUploadMime(contentType)) {
    throw new Error(
      'Only PNG, JPG, JPEG, WebP, and PDF files can be uploaded. Videos must be added with YouTube links.',
    );
  }

  if (input.size) {
    const isPdf = contentType === 'application/pdf';
    const maxSize = isPdf ? 20 * 1024 * 1024 : 10 * 1024 * 1024;

    if (input.size > maxSize) {
      throw new Error(
        isPdf ? 'PDF files must be 20 MB or smaller.' : 'Images must be 10 MB or smaller.',
      );
    }
  }

  const command = new PutObjectCommand({
    Bucket: env.s3Bucket,
    Key: key,
    ContentType: contentType,
  });

  const expiresIn = 300;
  const uploadUrl = await getSignedUrl(client, command, { expiresIn });

  return { uploadUrl, key, expiresIn };
}

export async function createPresignedDownloadUrl(key: string) {
  if (!env.s3Bucket) throw new Error('S3_BUCKET_NAME is required');

  const cleanKey = normalizeKey(key);

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: env.s3Bucket,
      Key: cleanKey,
    }),
    { expiresIn: 300 },
  );
}