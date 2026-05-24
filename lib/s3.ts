import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/lib/env';

const client = new S3Client({ region: env.awsRegion });

function isVideoMime(mime: string) {
  return mime.startsWith('video/');
}

export async function createPresignedUploadUrl(input: { key: string; contentType: string }) {
  if (!env.s3Bucket) throw new Error('S3_BUCKET_NAME is required');
  if (isVideoMime(input.contentType)) throw new Error('Videos must be uploaded to YouTube, not S3');

  const command = new PutObjectCommand({
    Bucket: env.s3Bucket,
    Key: input.key,
    ContentType: input.contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 });
  return { uploadUrl, key: input.key, expiresIn: 60 };
}

export async function createPresignedDownloadUrl(key: string) {
  if (!env.s3Bucket) throw new Error('S3_BUCKET_NAME is required');
  return getSignedUrl(client, new GetObjectCommand({ Bucket: env.s3Bucket, Key: key }), { expiresIn: 60 });
}
