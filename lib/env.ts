export const env = {
  cloudfront: process.env.CLOUDFRONT_DOMAIN?.replace(/\/$/, ''),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  s3Bucket: process.env.S3_BUCKET_NAME,
  awsRegion: process.env.AWS_REGION ?? 'us-east-1',
  adminEmail: process.env.ADMIN_EMAIL
};
export function assetUrlFromKey(s3Key?: string | null){ if(!s3Key || !env.cloudfront) return null; return `${env.cloudfront}/${s3Key.replace(/^\//,'')}`; }
