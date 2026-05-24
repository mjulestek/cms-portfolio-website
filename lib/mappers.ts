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
};

type TagRecord = {
  id: string;
  name: string;
  slug: string;
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
  publishedAt?: Date | null;
  videoEntries?: VideoEntryRecord[];
  tagIds?: string[];
  resolvedVideos?: VideoAssetRecord[];
  resolvedTags?: TagRecord[];
};

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const byId = <T extends { id: string }>(items: T[]) =>
  new Map(items.map(item => [item.id, item]));

const orderedEntries = (entries: VideoEntryRecord[] = []) =>
  [...entries].sort((a, b) => a.order - b.order);

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
  iconUrl: assetUrlFromKey(s.iconKey),
  proficiency: s.proficiency,
  order: s.order,
});

export const mapTag = (t: TagRecord) => ({
  id: t.id,
  name: t.name,
  slug: t.slug,
});

export type MappedVideo = ReturnType<typeof mapVideo>;
export type MappedSkill = ReturnType<typeof mapSkill>;
export type MappedTag = ReturnType<typeof mapTag>;

export type MappedProject = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  status: string;
  featured: boolean;
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
  images: Array<ProjectImageRecord & { url: string | null }>;
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

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    tagline: p.tagline,
    status: p.status,
    featured: p.featured,
    story: p.story,
    challenge: p.challenge,
    solution: p.solution,
    results: p.results,
    metrics: (p.metrics ?? null) as Record<string, string> | null,
    coverImageKey: p.coverImageKey,
    coverImageUrl: assetUrlFromKey(p.coverImageKey),
    pdfKey: p.pdfKey,
    pdfUrl: assetUrlFromKey(p.pdfKey),
    githubUrl: p.githubUrl,
    liveUrl: p.liveUrl,
    images: [...(p.images ?? [])]
      .sort((a, b) => a.order - b.order)
      .map(image => ({
        ...image,
        url: assetUrlFromKey(image.s3Key),
      })),
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

  return {
    id: b.id,
    slug: b.slug,
    title: b.title,
    excerpt: b.excerpt,
    body: b.body,
    status: b.status,
    featured: b.featured,
    coverImageKey: b.coverImageKey,
    coverImageUrl: assetUrlFromKey(b.coverImageKey),
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

export async function resolveProjectReferences<T extends ProjectRecord>(
  projects: T[],
) {
  if (projects.length === 0) return [];

  const tagIds = unique(projects.flatMap(project => project.tagIds ?? []));
  const techStackIds = unique(
    projects.flatMap(project => project.techStackIds ?? []),
  );
  const videoIds = unique(
    projects.flatMap(project =>
      (project.videoEntries ?? []).map(entry => entry.videoId),
    ),
  );

  const [tags, skills, videos] = await Promise.all([
    tagIds.length
      ? prisma.tag.findMany({ where: { id: { in: tagIds } } })
      : Promise.resolve([]),
    techStackIds.length
      ? prisma.skill.findMany({ where: { id: { in: techStackIds } } })
      : Promise.resolve([]),
    videoIds.length
      ? prisma.videoAsset.findMany({ where: { id: { in: videoIds } } })
      : Promise.resolve([]),
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
  }));
}

export async function resolveBlogReferences<T extends BlogRecord>(
  posts: T[],
) {
  if (posts.length === 0) return [];

  const tagIds = unique(posts.flatMap(post => post.tagIds ?? []));
  const videoIds = unique(
    posts.flatMap(post =>
      (post.videoEntries ?? []).map(entry => entry.videoId),
    ),
  );

  const [tags, videos] = await Promise.all([
    tagIds.length
      ? prisma.tag.findMany({ where: { id: { in: tagIds } } })
      : Promise.resolve([]),
    videoIds.length
      ? prisma.videoAsset.findMany({ where: { id: { in: videoIds } } })
      : Promise.resolve([]),
  ]);

  const tagMap = byId(tags);
  const videoMap = byId(videos);

  return posts.map(post => ({
    ...post,
    resolvedTags: (post.tagIds ?? []).flatMap(tagId => {
      const tag = tagMap.get(tagId);
      return tag ? [tag] : [];
    }),
    resolvedVideos: orderedEntries(post.videoEntries).flatMap(entry => {
      const video = videoMap.get(entry.videoId);
      return video ? [video] : [];
    }),
  }));
}

export async function resolveHomepageFeaturedVideo(
  featuredVideoId: Nullable<string>,
) {
  if (!featuredVideoId) return null;

  return prisma.videoAsset.findUnique({
    where: { id: featuredVideoId },
  });
}