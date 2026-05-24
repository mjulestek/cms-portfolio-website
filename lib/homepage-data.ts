import { prisma } from '@/lib/prisma';
import { assetUrlFromKey } from '@/lib/s3';
import {
  mapBlog,
  mapBlogCategory,
  mapProject,
  mapVideo,
  resolveBlogReferences,
  resolveHomepageFeaturedVideo,
  resolveProjectReferences,
  type MappedBlog,
  type MappedBlogCategory,
  type MappedProject,
  type MappedVideo,
} from '@/lib/mappers';

export type HomepageTimelineItemView = {
  id: string;
  year: string;
  title: string;
  description: string;
  imageKey?: string | null;
  imageUrl: string | null;
  externalUrl?: string | null;
  order: number;
};

export type HomepageStackItemView = {
  id: string;
  title: string;
  description: string;
  category: string;
  iconKey?: string | null;
  iconUrl: string | null;
  externalUrl?: string | null;
  order: number;
};

export type FooterSettingsView = {
  logoText: string;
  location: string;
  email: string;
  linkedInUrl?: string | null;
  copyrightText: string;
};

export type SimpleLink = {
  id: string;
  label: string;
  url: string;
  column?: string;
  platform?: string;
  iconKey?: string | null;
  iconUrl?: string | null;
  order: number;
};

export type HomepageCTAView = {
  id: string;
  section: string;
  label: string;
  url: string;
  order: number;
};

export type HomepageContentView = {
  id?: string;
  heroHeadline?: string;
  heroSubtext?: string;
  heroImageKey?: string | null;
  heroImageUrl?: string | null;
  ctaText?: string;
  ctaUrl?: string;
  aboutText?: string;
  metaTitle?: string;
  metaDescription?: string;
  featuredVideoId?: string | null;
  featuredVideo?: MappedVideo | null;
  timelineEyebrow?: string | null;
  timelineTitle?: string | null;
  timelineSubtitle?: string | null;
  writingEyebrow?: string | null;
  writingTitle?: string | null;
  writingSubtitle?: string | null;
  projectsEyebrow?: string | null;
  projectsTitle?: string | null;
  projectsSubtitle?: string | null;
  stackEyebrow?: string | null;
  stackTitle?: string | null;
  stackSubtitle?: string | null;
};

export type HomepageData = {
  content: HomepageContentView | null;
  timeline: HomepageTimelineItemView[];
  posts: MappedBlog[];
  blogCategories: MappedBlogCategory[];
  projects: MappedProject[];
  stack: HomepageStackItemView[];
  featuredVideos: MappedVideo[];
  footer: FooterSettingsView;
  footerNav: SimpleLink[];
  legalLinks: SimpleLink[];
  socials: SimpleLink[];
  ctas: HomepageCTAView[];
};

const defaultFooter: FooterSettingsView = {
  logoText: 'Jules Munyaneza',
  location: 'Kigali, Rwanda',
  email: 'mjules.tek@gmail.com',
  linkedInUrl: 'https://www.linkedin.com/in/mjules-tek',
  copyrightText: '© 2026 Jules Munyaneza. All rights reserved.',
};

const emptyHomeData = (): HomepageData => ({
  content: null,
  timeline: [],
  posts: [],
  blogCategories: [],
  projects: [],
  stack: [],
  featuredVideos: [],
  footer: defaultFooter,
  footerNav: [],
  legalLinks: [],
  socials: [],
  ctas: [],
});

export async function getHomepageData(): Promise<HomepageData> {
  try {
    const [
      content,
      timeline,
      rawPosts,
      rawProjects,
      blogCategories,
      stack,
      featuredVideos,
      footer,
      footerNav,
      legalLinks,
      socials,
      ctas,
    ] = await Promise.all([
      prisma.homepageContent.findUnique({ where: { id: 'singleton' } }),
      prisma.homepageTimelineItem.findMany({ where: { active: true }, orderBy: [{ order: 'asc' }, { year: 'desc' }] }),
      prisma.blogPost.findMany({
        where: { status: 'PUBLISHED', featured: true, homepageVisible: true },
        orderBy: [{ homepageOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: 8,
      }),
      prisma.project.findMany({
        where: { status: 'PUBLISHED', homepageVisible: true },
        orderBy: [{ homepageOrder: 'asc' }, { featured: 'desc' }, { createdAt: 'desc' }],
        take: 12,
      }),
      prisma.blogCategory.findMany({ where: { visible: true }, orderBy: [{ order: 'asc' }, { name: 'asc' }] }),
      prisma.homepageStackItem.findMany({ where: { active: true }, orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] }),
      prisma.videoAsset.findMany({ where: { featured: true }, orderBy: [{ order: 'asc' }], take: 6 }),
      prisma.footerSettings.findUnique({ where: { id: 'singleton' } }),
      prisma.footerNavigationLink.findMany({ where: { visible: true }, orderBy: [{ column: 'asc' }, { order: 'asc' }] }),
      prisma.legalLink.findMany({ where: { visible: true }, orderBy: [{ order: 'asc' }] }),
      prisma.socialLink.findMany({ where: { visible: true }, orderBy: [{ order: 'asc' }] }),
      prisma.homepageCTASetting.findMany({ where: { visible: true }, orderBy: [{ section: 'asc' }, { order: 'asc' }] }),
    ]);

    const [resolvedPosts, resolvedProjects, featuredVideo] = await Promise.all([
      resolveBlogReferences(rawPosts),
      resolveProjectReferences(rawProjects),
      resolveHomepageFeaturedVideo(content?.featuredVideoId),
    ]);

    return {
      content: content
        ? {
            ...content,
            heroImageUrl: assetUrlFromKey(content.heroImageKey),
            featuredVideo: featuredVideo ? mapVideo(featuredVideo) : null,
          }
        : null,
      timeline: (timeline as Array<Omit<HomepageTimelineItemView, 'imageUrl'>>).map(item => ({ ...item, imageUrl: assetUrlFromKey(item.imageKey) })),
      posts: resolvedPosts.map(mapBlog),
      blogCategories: blogCategories.map(mapBlogCategory),
      projects: resolvedProjects.map(mapProject),
      stack: (stack as Array<Omit<HomepageStackItemView, 'iconUrl'>>).map(item => ({ ...item, iconUrl: assetUrlFromKey(item.iconKey) })),
      featuredVideos: featuredVideos.map(mapVideo),
      footer: footer ?? defaultFooter,
      footerNav: (footerNav as Array<{ id: string; label: string; url: string; column: string; order: number }>).map(link => ({ id: link.id, label: link.label, url: link.url, column: link.column, order: link.order })),
      legalLinks: (legalLinks as Array<{ id: string; label: string; url: string; order: number }>).map(link => ({ id: link.id, label: link.label, url: link.url, order: link.order })),
      socials: (socials as Array<{ id: string; platform: string; url: string; iconKey?: string | null; order: number }>).map(link => ({
        id: link.id,
        label: link.platform,
        platform: link.platform,
        url: link.url,
        iconKey: link.iconKey,
        iconUrl: assetUrlFromKey(link.iconKey),
        order: link.order,
      })),
      ctas,
    };
  } catch (error) {
    console.error('Failed to load homepage data', error);
    return emptyHomeData();
  }
}
