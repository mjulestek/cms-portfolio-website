import { assetUrlFromKey } from '@/lib/s3';
import { prisma } from '@/lib/prisma';

type Nullable<T> = T | null | undefined;

type VideoAssetRecord = {
  id: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  title: string;
  caption?: string | null;
  category: string;
  thumbnailUrl: string;
  embedUrl: string;
  featured: boolean;
  order: number;
};

type SkillRecord = {
  id: string;
  name: string;
  category: string;
  iconKey?: string | null;
  proficiency: number;
  order: number;
  resolvedIconKey?: string | null;
};

type TagRecord = {
  id: string;
  name: string;
  slug: string;
};

type BlogCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  order: number;
  visible: boolean;
};

type MediaAssetRecord = {
  id: string;
  s3Key: string;
  filename: string;
  mimeType?: string | null;
  mediaType?: string | null;
};

type ProjectImageRecord = {
  id: string;
  s3Key: string;
  alt?: string | null;
  caption?: string | null;
  order: number;
};

type VideoEntryRecord = {
  videoId: string;
  order: number;
  featured: boolean;
};

type ProjectRecord = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  status: string;
  featured: boolean;
  homepageVisible?: boolean;
  homepageOrder?: number;
  homepagePlacement?: string | null;
  readTime?: string | null;
  ctaLabel?: string | null;
  story: string;
  challenge: string;
  solution: string;
  results: string;
  metrics?: unknown;
  startDate?: Date | null;
  endDate?: Date | null;
  githubUrl?: string | null;
  liveUrl?: string | null;
  coverImageKey?: string | null;
  pdfKey?: string | null;
  images?: ProjectImageRecord[];
  videoEntries?: VideoEntryRecord[];
  tagIds?: string[];
  techStackIds?: string[];
  resolvedVideos?: VideoAssetRecord[];
  resolvedTags?: TagRecord[];
  resolvedTechStack?: SkillRecord[];
  resolvedMediaAssets?: MediaAssetRecord[];
};

type BlogRecord = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImageKey?: string | null;
  status: string;
  featured: boolean;
  homepageVisible?: boolean;
  homepageOrder?: number;
  readTime?: string | null;
  ctaLabel?: string | null;
  categoryId?: string | null;
  resolvedCategory?: BlogCategoryRecord | null;
  publishedAt?: Date | null;
  videoEntries?: VideoEntryRecord[];
  tagIds?: string[];
  resolvedVideos?: VideoAssetRecord[];
  resolvedTags?: TagRecord[];
  resolvedMediaAssets?: MediaAssetRecord[];
};

const unique = (values: Array<string | null | undefined>) =>
  Array.from(new Set(values.map(value => value?.trim()).filter(Boolean) as string[]));

const byId = <T extends { id: string }>(items: T[]) =>
  new Map(items.map(item => [item.id, item]));

const orderedEntries = (entries: VideoEntryRecord[] = []) =>
  [...entries].sort((a, b) => a.order - b.order);

const bareFilename = (key?: string | null) => {
  if (!key) return null;
  const clean = key.trim().replace(/^\/+/, '');
  if (!clean || clean.startsWith('http://') || clean.startsWith('https://')) return clean || null;
  return clean.split('/').pop() ?? clean;
};

const resolveMediaKey = (key?: string | null, assets: MediaAssetRecord[] = []) => {
  if (!key) return null;
  const clean = key.trim().replace(/^\/+/, '');
  if (!clean) return null;
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;

  const direct = assets.find(asset => asset.s3Key === clean);
  if (direct) return direct.s3Key;

  const filename = bareFilename(clean);
  const fromFilename = assets.find(asset => asset.filename === filename || bareFilename(asset.s3Key) === filename);
  if (fromFilename) return fromFilename.s3Key;

  return clean;
};

const mediaUrl = (key?: string | null, assets: MediaAssetRecord[] = []) =>
  assetUrlFromKey(resolveMediaKey(key, assets));

async function resolveMediaAssets(keys: Array<string | null | undefined>) {
  const cleanKeys = unique(keys);
  if (cleanKeys.length === 0) return [];

  const filenames = unique(cleanKeys.map(key => bareFilename(key)));

  return prisma.mediaAsset.findMany({
    where: {
      OR: [
        { s3Key: { in: cleanKeys } },
        { filename: { in: filenames } },
      ],
    },
    orderBy: { uploadedAt: 'desc' },
  });
}

export const mapVideo = (v: VideoAssetRecord) => ({
  id: v.id,
  youtubeUrl: v.youtubeUrl,
  youtubeVideoId: v.youtubeVideoId,
  title: v.title,
  caption: v.caption,
  category: v.category,
  thumbnailUrl: v.thumbnailUrl,
  embedUrl: v.embedUrl,
  featured: v.featured,
  order: v.order,
});

export const mapSkill = (s: SkillRecord) => ({
  id: s.id,
  name: s.name,
  category: s.category,
  iconKey: s.iconKey,
  iconUrl: assetUrlFromKey(s.resolvedIconKey ?? s.iconKey),
  proficiency: s.proficiency,
  order: s.order,
});

export const mapTag = (t: TagRecord) => ({
  id: t.id,
  name: t.name,
  slug: t.slug,
});

export const mapBlogCategory = (c: BlogCategoryRecord) => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  order: c.order,
  visible: c.visible,
});

export type MappedVideo = ReturnType<typeof mapVideo>;
export type MappedSkill = ReturnType<typeof mapSkill>;
export type MappedTag = ReturnType<typeof mapTag>;
export type MappedBlogCategory = ReturnType<typeof mapBlogCategory>;

export type MappedProject = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  status: string;
  featured: boolean;
  homepageVisible?: boolean;
  homepageOrder?: number;
  homepagePlacement?: string | null;
  readTime?: string | null;
  ctaLabel?: string | null;
  story: string;
  challenge: string;
  solution: string;
  results: string;
  metrics: Record<string, string> | null;
  coverImageKey?: string | null;
  coverImageUrl: string | null;
  pdfKey?: string | null;
  pdfUrl: string | null;
  githubUrl?: string | null;
  liveUrl?: string | null;
  images: Array<ProjectImageRecord & { s3Key: string; url: string | null }>;
  videos: Array<{
    id: string;
    order: number;
    featured: boolean;
    video: MappedVideo;
  }>;
  techStack: MappedSkill[];
  tags: MappedTag[];
};

export type MappedBlog = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  status: string;
  featured: boolean;
  homepageVisible?: boolean;
  homepageOrder?: number;
  readTime?: string | null;
  ctaLabel?: string | null;
  categoryId?: string | null;
  category: MappedBlogCategory | null;
  coverImageKey?: string | null;
  coverImageUrl: string | null;
  publishedAt?: Date | null;
  videos: Array<{
    id: string;
    order: number;
    featured: boolean;
    video: MappedVideo;
  }>;
  tags: MappedTag[];
};

export function mapProject(p: ProjectRecord): MappedProject {
  const videoMap = byId(p.resolvedVideos ?? []);
  const techMap = byId(p.resolvedTechStack ?? []);
  const tagMap = byId(p.resolvedTags ?? []);
  const mediaAssets = p.resolvedMediaAssets ?? [];
  const coverImageKey = resolveMediaKey(p.coverImageKey, mediaAssets);
  const pdfKey = resolveMediaKey(p.pdfKey, mediaAssets);

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    tagline: p.tagline,
    status: p.status,
    featured: p.featured,
    homepageVisible: p.homepageVisible,
    homepageOrder: p.homepageOrder,
    homepagePlacement: p.homepagePlacement,
    readTime: p.readTime,
    ctaLabel: p.ctaLabel,
    story: p.story,
    challenge: p.challenge,
    solution: p.solution,
    results: p.results,
    metrics: (p.metrics ?? null) as Record<string, string> | null,
    coverImageKey,
    coverImageUrl: assetUrlFromKey(coverImageKey),
    pdfKey,
    pdfUrl: assetUrlFromKey(pdfKey),
    githubUrl: p.githubUrl,
    liveUrl: p.liveUrl,
    images: [...(p.images ?? [])]
      .sort((a, b) => a.order - b.order)
      .map(image => {
        const s3Key = resolveMediaKey(image.s3Key, mediaAssets) ?? image.s3Key;
        return { ...image, s3Key, url: assetUrlFromKey(s3Key) };
      }),
    videos: orderedEntries(p.videoEntries).flatMap(entry => {
      const video = videoMap.get(entry.videoId);
      if (!video) return [];

      return [
        {
          id: entry.videoId,
          order: entry.order,
          featured: entry.featured,
          video: mapVideo(video),
        },
      ];
    }),
    techStack: (p.techStackIds ?? []).flatMap(skillId => {
      const skill = techMap.get(skillId);
      return skill ? [mapSkill(skill)] : [];
    }),
    tags: (p.tagIds ?? []).flatMap(tagId => {
      const tag = tagMap.get(tagId);
      return tag ? [mapTag(tag)] : [];
    }),
  };
}

export function mapBlog(b: BlogRecord): MappedBlog {
  const videoMap = byId(b.resolvedVideos ?? []);
  const tagMap = byId(b.resolvedTags ?? []);
  const mediaAssets = b.resolvedMediaAssets ?? [];
  const coverImageKey = resolveMediaKey(b.coverImageKey, mediaAssets);
  const category = b.resolvedCategory ? mapBlogCategory(b.resolvedCategory) : null;

  return {
    id: b.id,
    slug: b.slug,
    title: b.title,
    excerpt: b.excerpt,
    body: b.body,
    status: b.status,
    featured: b.featured,
    homepageVisible: b.homepageVisible,
    homepageOrder: b.homepageOrder,
    readTime: b.readTime,
    ctaLabel: b.ctaLabel,
    categoryId: b.categoryId,
    category,
    coverImageKey,
    coverImageUrl: assetUrlFromKey(coverImageKey),
    publishedAt: b.publishedAt,
    videos: orderedEntries(b.videoEntries).flatMap(entry => {
      const video = videoMap.get(entry.videoId);
      if (!video) return [];

      return [
        {
          id: entry.videoId,
          order: entry.order,
          featured: entry.featured,
          video: mapVideo(video),
        },
      ];
    }),
    tags: (b.tagIds ?? []).flatMap(tagId => {
      const tag = tagMap.get(tagId);
      return tag ? [mapTag(tag)] : [];
    }),
  };
}

export async function resolveProjectReferences<T extends ProjectRecord>(projects: T[]) {
  if (projects.length === 0) return [];

  const tagIds = unique(projects.flatMap(project => project.tagIds ?? []));
  const techStackIds = unique(projects.flatMap(project => project.techStackIds ?? []));
  const videoIds = unique(
    projects.flatMap(project => (project.videoEntries ?? []).map(entry => entry.videoId)),
  );
  const mediaKeys = projects.flatMap(project => [
    project.coverImageKey,
    project.pdfKey,
    ...(project.images ?? []).map(image => image.s3Key),
  ]);

  const [tags, skills, videos, mediaAssets] = await Promise.all([
    tagIds.length ? prisma.tag.findMany({ where: { id: { in: tagIds } } }) : Promise.resolve([]),
    techStackIds.length ? prisma.skill.findMany({ where: { id: { in: techStackIds } } }) : Promise.resolve([]),
    videoIds.length ? prisma.videoAsset.findMany({ where: { id: { in: videoIds } } }) : Promise.resolve([]),
    resolveMediaAssets(mediaKeys),
  ]);

  const tagMap = byId(tags);
  const skillMap = byId(skills);
  const videoMap = byId(videos);

  return projects.map(project => ({
    ...project,
    resolvedTags: (project.tagIds ?? []).flatMap(tagId => {
      const tag = tagMap.get(tagId);
      return tag ? [tag] : [];
    }),
    resolvedTechStack: (project.techStackIds ?? []).flatMap(skillId => {
      const skill = skillMap.get(skillId);
      return skill ? [skill] : [];
    }),
    resolvedVideos: orderedEntries(project.videoEntries).flatMap(entry => {
      const video = videoMap.get(entry.videoId);
      return video ? [video] : [];
    }),
    resolvedMediaAssets: mediaAssets,
  }));
}

export async function resolveBlogReferences<T extends BlogRecord>(posts: T[]) {
  if (posts.length === 0) return [];

  const tagIds = unique(posts.flatMap(post => post.tagIds ?? []));
  const videoIds = unique(
    posts.flatMap(post => (post.videoEntries ?? []).map(entry => entry.videoId)),
  );
  const categoryIds = unique(posts.map(post => post.categoryId));
  const mediaKeys = posts.map(post => post.coverImageKey);

  const [tags, videos, categories, mediaAssets] = await Promise.all([
    tagIds.length ? prisma.tag.findMany({ where: { id: { in: tagIds } } }) : Promise.resolve([]),
    videoIds.length ? prisma.videoAsset.findMany({ where: { id: { in: videoIds } } }) : Promise.resolve([]),
    categoryIds.length ? prisma.blogCategory.findMany({ where: { id: { in: categoryIds } } }) : Promise.resolve([]),
    resolveMediaAssets(mediaKeys),
  ]);

  const tagMap = byId(tags);
  const videoMap = byId(videos);
  const categoryMap = byId(categories);

  return posts.map(post => ({
    ...post,
    resolvedTags: (post.tagIds ?? []).flatMap(tagId => {
      const tag = tagMap.get(tagId);
      return tag ? [tag] : [];
    }),
    resolvedCategory: post.categoryId ? categoryMap.get(post.categoryId) ?? null : null,
    resolvedVideos: orderedEntries(post.videoEntries).flatMap(entry => {
      const video = videoMap.get(entry.videoId);
      return video ? [video] : [];
    }),
    resolvedMediaAssets: mediaAssets,
  }));
}

export async function resolveHomepageFeaturedVideo(featuredVideoId: Nullable<string>) {
  if (!featuredVideoId) return null;

  return prisma.videoAsset.findUnique({
    where: { id: featuredVideoId },
  });
}
