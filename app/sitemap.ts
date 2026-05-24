import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

type SitemapItem = { slug: string; updatedAt: Date };
export const dynamic = 'force-dynamic';

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([
    prisma.project.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true } }).catch((): SitemapItem[] => []),
    prisma.blogPost.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true } }).catch((): SitemapItem[] => [])
  ]);
  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/projects`, lastModified: new Date() },
    { url: `${base}/blog`, lastModified: new Date() },
    { url: `${base}/contact`, lastModified: new Date() },
    ...((projects as SitemapItem[]).map(p => ({ url: `${base}/projects/${p.slug}`, lastModified: p.updatedAt }))),
    ...((posts as SitemapItem[]).map(p => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updatedAt })))
  ];
}
