import { z } from 'zod';

const HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);

export const videoCategorySchema = z.enum(['DEMO', 'WALKTHROUGH', 'ARCHITECTURE', 'TUTORIAL', 'TESTIMONIAL', 'INTRO']);

export function extractYouTubeVideoId(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());
    const host = url.hostname.toLowerCase();
    if (!HOSTS.has(host)) return '';
    let id = '';
    if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] ?? '';
    else if (url.pathname === '/watch') id = url.searchParams.get('v') ?? '';
    else if (url.pathname.startsWith('/embed/') || url.pathname.startsWith('/shorts/')) id = url.pathname.split('/')[2] ?? '';
    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : '';
  } catch { return ''; }
}

export const youtubeThumb = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
export const youtubeEmbed = (id: string) => `https://www.youtube.com/embed/${id}`;
export function normalizeYouTubeUrl(id: string) { return `https://www.youtube.com/watch?v=${id}`; }

// Create schema: youtubeUrl is required; transform derives all computed fields
export const videoAssetSchema = z.object({
  youtubeUrl: z.string().url(),
  title: z.string().min(1).max(200),
  caption: z.string().max(2000).optional().nullable(),
  category: videoCategorySchema,
  featured: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
}).transform((v, ctx) => {
  const id = extractYouTubeVideoId(v.youtubeUrl);
  if (!id) {
    ctx.addIssue({ code: 'custom', path: ['youtubeUrl'], message: 'Only valid youtube.com and youtu.be URLs are allowed' });
    return z.NEVER;
  }
  return { ...v, youtubeVideoId: id, youtubeUrl: normalizeYouTubeUrl(id), thumbnailUrl: youtubeThumb(id), embedUrl: youtubeEmbed(id) };
});

// Update schema: all fields optional; if youtubeUrl is provided, re-derive computed fields
export const videoUpdateSchema = z.object({
  youtubeUrl: z.string().url().optional(),
  title: z.string().min(1).max(200).optional(),
  caption: z.string().max(2000).optional().nullable(),
  category: videoCategorySchema.optional(),
  featured: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
}).transform((v, ctx) => {
  if (!v.youtubeUrl) return v;
  const id = extractYouTubeVideoId(v.youtubeUrl);
  if (!id) {
    ctx.addIssue({ code: 'custom', path: ['youtubeUrl'], message: 'Only valid youtube.com and youtu.be URLs are allowed' });
    return z.NEVER;
  }
  return { ...v, youtubeVideoId: id, youtubeUrl: normalizeYouTubeUrl(id), thumbnailUrl: youtubeThumb(id), embedUrl: youtubeEmbed(id) };
});
