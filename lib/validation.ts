import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Must be a valid MongoDB ObjectId');

const optionalKeySchema = z.string().trim().optional().nullable();
const optionalUrlSchema = z.string().trim().url().optional().nullable().or(z.literal(''));
const metricsValueSchema = z.union([z.string(), z.number(), z.boolean()]).transform(String);

export const statusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(5000),
  company: z.string().max(0).optional().or(z.literal('')),
});

export const projectSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only'),
  title: z.string().trim().min(1),
  tagline: z.string().trim().min(1),
  status: statusSchema.default('DRAFT'),
  featured: z.boolean().default(false),
  story: z.string().trim().min(1),
  challenge: z.string().trim().min(1),
  solution: z.string().trim().min(1),
  results: z.string().trim().min(1),
  metrics: z.record(metricsValueSchema).optional(),
  coverImageKey: optionalKeySchema,
  pdfKey: optionalKeySchema,
  githubUrl: optionalUrlSchema,
  liveUrl: optionalUrlSchema,
  tagIds: z.array(objectIdSchema).default([]),
  techStackIds: z.array(objectIdSchema).default([]),
  videoIds: z.array(objectIdSchema).default([]),
  homepageVisible: z.boolean().default(true),
  homepageOrder: z.number().int().min(0).default(0),
  homepagePlacement: z.string().trim().optional().nullable(),
  readTime: z.string().trim().optional().nullable(),
  ctaLabel: z.string().trim().optional().nullable(),
});

export const blogSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only'),
  title: z.string().trim().min(1),
  excerpt: z.string().trim().min(1),
  body: z.string().trim().min(1),
  status: statusSchema.default('DRAFT'),
  featured: z.boolean().default(false),
  coverImageKey: optionalKeySchema,
  categoryId: objectIdSchema.optional().nullable().or(z.literal('')),
  tagIds: z.array(objectIdSchema).default([]),
  videoIds: z.array(objectIdSchema).default([]),
  homepageVisible: z.boolean().default(true),
  homepageOrder: z.number().int().min(0).default(0),
  readTime: z.string().trim().optional().nullable(),
  ctaLabel: z.string().trim().optional().nullable(),
});

export const skillSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  iconKey: optionalKeySchema,
  proficiency: z.number().int().min(1).max(100),
  order: z.number().int().min(0).default(0),
});

export const testimonialSchema = z.object({
  name: z.string().trim().min(1),
  role: z.string().trim().min(1),
  company: z.string().trim().min(1),
  avatarKey: optionalKeySchema,
  quote: z.string().trim().min(1),
  visible: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export const socialLinkSchema = z.object({
  platform: z.string().trim().min(1),
  url: z.string().trim().url(),
  iconKey: optionalKeySchema,
  visible: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
});

export const homepageSchema = z.object({
  heroHeadline: z.string().trim().min(1),
  heroSubtext: z.string().trim().min(1),
  heroImageKey: optionalKeySchema,
  ctaText: z.string().trim().min(1),
  ctaUrl: z.string().trim().min(1),
  aboutText: z.string().trim().min(1),
  metaTitle: z.string().trim().min(1),
  metaDescription: z.string().trim().min(1),
  featuredVideoId: objectIdSchema.optional().nullable().or(z.literal('')),
  timelineEyebrow: z.string().trim().optional().nullable(),
  timelineTitle: z.string().trim().optional().nullable(),
  timelineSubtitle: z.string().trim().optional().nullable(),
  writingEyebrow: z.string().trim().optional().nullable(),
  writingTitle: z.string().trim().optional().nullable(),
  writingSubtitle: z.string().trim().optional().nullable(),
  projectsEyebrow: z.string().trim().optional().nullable(),
  projectsTitle: z.string().trim().optional().nullable(),
  projectsSubtitle: z.string().trim().optional().nullable(),
  stackEyebrow: z.string().trim().optional().nullable(),
  stackTitle: z.string().trim().optional().nullable(),
  stackSubtitle: z.string().trim().optional().nullable(),
});

export const mediaSchema = z.object({
  s3Key: z.string().trim().min(1),
  filename: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  mediaType: z.enum(['IMAGE', 'ICON', 'PDF', 'RESUME', 'AVATAR']),
  size: z.number().int().min(0),
  alt: z.string().trim().optional().nullable(),
  usedIn: z.string().trim().optional().nullable(),
});

export const resumeSchema = z.object({
  s3Key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  active: z.boolean().default(false),
});

export const contactMessageUpdateSchema = z.object({
  status: z.enum(['NEW', 'READ', 'REPLIED', 'ARCHIVED']),
});


export const homepageTimelineSchema = z.object({
  year: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  imageKey: optionalKeySchema,
  externalUrl: optionalUrlSchema,
  order: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export const homepageStackSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  category: z.string().trim().min(1),
  iconKey: optionalKeySchema,
  externalUrl: optionalUrlSchema,
  order: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export const footerSettingsSchema = z.object({
  logoText: z.string().trim().min(1),
  location: z.string().trim().min(1),
  email: z.string().trim().email(),
  linkedInUrl: optionalUrlSchema,
  copyrightText: z.string().trim().min(1),
});

export const footerNavigationLinkSchema = z.object({
  column: z.string().trim().min(1),
  label: z.string().trim().min(1),
  url: z.string().trim().min(1),
  order: z.number().int().min(0).default(0),
  visible: z.boolean().default(true),
});

export const legalLinkSchema = z.object({
  label: z.string().trim().min(1),
  url: z.string().trim().min(1),
  order: z.number().int().min(0).default(0),
  visible: z.boolean().default(true),
});

export const homepageCTASettingSchema = z.object({
  section: z.string().trim().min(1),
  label: z.string().trim().min(1),
  url: z.string().trim().min(1),
  order: z.number().int().min(0).default(0),
  visible: z.boolean().default(true),
});


export const blogCategorySchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only'),
  order: z.number().int().min(0).default(0),
  visible: z.boolean().default(true),
});
