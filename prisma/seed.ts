import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedTag = { id: string; slug: string; name: string };
type SeedSkill = { id: string; name: string; category: string; proficiency: number; order: number };

const ADMIN_EMAIL = 'mjules.tek@gmail.com';
const PROJECT_SLUG = 'aws-cicd-pipeline';
const BLOG_SLUG = 'designing-safer-cloud-deployments';
const RESUME_KEY = 'resume/Jules_Munyaneza_Resume_2026.pdf';

const thumb = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
const embed = (id: string) => `https://www.youtube.com/embed/${id}`;

async function upsertTestimonial() {
  const data = {
    name: 'Jane Doe',
    role: 'Engineering Manager',
    company: 'Acme Corp',
    avatarKey: null,
    quote: 'Jules delivered thoughtful infrastructure work with strong operational clarity.',
    visible: true,
    order: 0,
  };
  const existing = await prisma.testimonial.findFirst({ where: { name: data.name, company: data.company } });
  if (existing) return prisma.testimonial.update({ where: { id: existing.id }, data });
  return prisma.testimonial.create({ data });
}

async function upsertSocialLink(platform: string, url: string, order: number) {
  const data = { platform, url, iconKey: null, order, visible: true };
  const existing = await prisma.socialLink.findFirst({ where: { platform, url } });
  if (existing) return prisma.socialLink.update({ where: { id: existing.id }, data });
  return prisma.socialLink.create({ data });
}

async function upsertContactMessage() {
  const data = {
    name: 'Local Test Visitor',
    email: 'visitor@example.com',
    subject: 'Seeded local contact message',
    message: 'This sample message verifies the ContactMessage collection in local MongoDB.',
    status: 'NEW' as const,
    ipAddress: '127.0.0.1',
    userAgent: 'seed-script',
  };
  const existing = await prisma.contactMessage.findFirst({ where: { email: data.email, subject: data.subject } });
  if (existing) return prisma.contactMessage.update({ where: { id: existing.id }, data });
  return prisma.contactMessage.create({ data });
}

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { name: 'Jules Munyaneza', role: 'ADMIN' },
    create: { email: ADMIN_EMAIL, name: 'Jules Munyaneza', role: 'ADMIN' },
  });

  const tags: SeedTag[] = await Promise.all(
    [
      { slug: 'devops', name: 'DEVOPS' },
      { slug: 'cloud', name: 'CLOUD' },
      { slug: 'iac', name: 'IAC' },
      { slug: 'sre', name: 'SRE' },
      { slug: 'security', name: 'SECURITY' },
      { slug: 'automation', name: 'AUTOMATION' },
    ].map(tag =>
      prisma.tag.upsert({
        where: { slug: tag.slug },
        update: { name: tag.name },
        create: tag,
      }),
    ),
  );

  const skills: SeedSkill[] = await Promise.all(
    [
      { name: 'AWS', category: 'Cloud', proficiency: 92, order: 0 },
      { name: 'Terraform', category: 'IaC', proficiency: 88, order: 1 },
      { name: 'GitHub Actions', category: 'DevOps', proficiency: 90, order: 2 },
      { name: 'CloudFront', category: 'Cloud', proficiency: 86, order: 3 },
      { name: 'Grafana', category: 'Monitoring', proficiency: 82, order: 4 },
      { name: 'Docker', category: 'DevOps', proficiency: 85, order: 5 },
    ].map(skill =>
      prisma.skill.upsert({
        where: { name: skill.name },
        update: {
          category: skill.category,
          proficiency: skill.proficiency,
          order: skill.order,
          iconKey: `icons/${skill.name.toLowerCase().replaceAll(' ', '-')}.svg`,
        },
        create: {
          ...skill,
          iconKey: `icons/${skill.name.toLowerCase().replaceAll(' ', '-')}.svg`,
        },
      }),
    ),
  );

  const videos = await Promise.all(
    [
      {
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeVideoId: 'dQw4w9WgXcQ',
        title: 'AWS CI/CD Pipeline Demo',
        caption: 'Deployment workflow walkthrough.',
        category: 'DEMO' as const,
        featured: true,
        order: 0,
      },
      {
        youtubeUrl: 'https://youtu.be/ysz5S6PUM-U',
        youtubeVideoId: 'ysz5S6PUM-U',
        title: 'Portfolio Infrastructure Walkthrough',
        caption: 'High-level infrastructure overview.',
        category: 'WALKTHROUGH' as const,
        featured: true,
        order: 1,
      },
    ].map(video =>
      prisma.videoAsset.upsert({
        where: { youtubeVideoId: video.youtubeVideoId },
        update: {
          youtubeUrl: video.youtubeUrl,
          title: video.title,
          caption: video.caption,
          category: video.category,
          thumbnailUrl: thumb(video.youtubeVideoId),
          embedUrl: embed(video.youtubeVideoId),
          featured: video.featured,
          order: video.order,
        },
        create: {
          ...video,
          thumbnailUrl: thumb(video.youtubeVideoId),
          embedUrl: embed(video.youtubeVideoId),
        },
      }),
    ),
  );

  const [demoVideo, walkthroughVideo] = videos;

  const mediaAssets = await Promise.all(
    [
      {
        s3Key: 'images/projects/aws-cicd-cover.webp',
        filename: 'aws-cicd-cover.webp',
        mimeType: 'image/webp',
        mediaType: 'IMAGE' as const,
        size: 862208,
        alt: 'AWS CI/CD project cover image',
        usedIn: `project:${PROJECT_SLUG}`,
      },
      {
        s3Key: RESUME_KEY,
        filename: 'Jules_Munyaneza_Resume_2026.pdf',
        mimeType: 'application/pdf',
        mediaType: 'RESUME' as const,
        size: 512000,
        alt: 'Jules Munyaneza resume PDF',
        usedIn: 'resume:active',
      },
    ].map(asset =>
      prisma.mediaAsset.upsert({
        where: { s3Key: asset.s3Key },
        update: asset,
        create: asset,
      }),
    ),
  );

  const project = await prisma.project.upsert({
    where: { slug: PROJECT_SLUG },
    update: {
      title: 'AWS CI/CD Pipeline',
      tagline: 'Zero-downtime deployments with GitHub Actions, S3, CloudFront, and IaC.',
      status: 'PUBLISHED',
      featured: true,
      story: 'Designed a production-ready deployment workflow with immutable assets, fast CDN delivery, and controlled release gates.',
      challenge: 'Manual releases created unnecessary risk.',
      solution: 'Automated release gates, preview builds, CDN invalidation and rollback workflows.',
      results: 'Faster deployments, safer rollbacks and improved delivery confidence.',
      metrics: { 'Deploy time': '3 min', Uptime: '99.9%', Rollback: '<60s' },
      coverImageKey: 'images/projects/aws-cicd-cover.webp',
      pdfKey: 'pdfs/aws-cicd-case-study.pdf',
      githubUrl: 'https://github.com/mjules-tek/aws-cicd-pipeline',
      liveUrl: 'https://portfolio-jules.com',
      tagIds: tags.slice(0, 3).map(tag => tag.id),
      techStackIds: skills.slice(0, 4).map(skill => skill.id),
      videoEntries: [
        { videoId: demoVideo.id, featured: true, order: 0 },
        { videoId: walkthroughVideo.id, featured: false, order: 1 },
      ],
    },
    create: {
      slug: PROJECT_SLUG,
      title: 'AWS CI/CD Pipeline',
      tagline: 'Zero-downtime deployments with GitHub Actions, S3, CloudFront, and IaC.',
      status: 'PUBLISHED',
      featured: true,
      story: 'Designed a production-ready deployment workflow with immutable assets, fast CDN delivery, and controlled release gates.',
      challenge: 'Manual releases created unnecessary risk.',
      solution: 'Automated release gates, preview builds, CDN invalidation and rollback workflows.',
      results: 'Faster deployments, safer rollbacks and improved delivery confidence.',
      metrics: { 'Deploy time': '3 min', Uptime: '99.9%', Rollback: '<60s' },
      coverImageKey: 'images/projects/aws-cicd-cover.webp',
      pdfKey: 'pdfs/aws-cicd-case-study.pdf',
      githubUrl: 'https://github.com/mjules-tek/aws-cicd-pipeline',
      liveUrl: 'https://portfolio-jules.com',
      images: [],
      tagIds: tags.slice(0, 3).map(tag => tag.id),
      techStackIds: skills.slice(0, 4).map(skill => skill.id),
      videoEntries: [
        { videoId: demoVideo.id, featured: true, order: 0 },
        { videoId: walkthroughVideo.id, featured: false, order: 1 },
      ],
    },
  });

  const blogPost = await prisma.blogPost.upsert({
    where: { slug: BLOG_SLUG },
    update: {
      title: 'Designing Safer Cloud Deployments',
      excerpt: 'How release gates, previews, and rollback design reduce operational risk.',
      body: 'Cloud deployments become safer when teams design for reversibility, visibility, and repeatability from the beginning.',
      status: 'PUBLISHED',
      featured: true,
      publishedAt: new Date('2026-01-10T12:00:00.000Z'),
      coverImageKey: null,
      tagIds: tags.slice(0, 2).map(tag => tag.id),
      videoEntries: [{ videoId: demoVideo.id, featured: true, order: 0 }],
    },
    create: {
      slug: BLOG_SLUG,
      title: 'Designing Safer Cloud Deployments',
      excerpt: 'How release gates, previews, and rollback design reduce operational risk.',
      body: 'Cloud deployments become safer when teams design for reversibility, visibility, and repeatability from the beginning.',
      status: 'PUBLISHED',
      featured: true,
      publishedAt: new Date('2026-01-10T12:00:00.000Z'),
      coverImageKey: null,
      tagIds: tags.slice(0, 2).map(tag => tag.id),
      videoEntries: [{ videoId: demoVideo.id, featured: true, order: 0 }],
    },
  });

  await prisma.resume.updateMany({ data: { active: false } });
  const resume = await prisma.resume.upsert({
    where: { s3Key: RESUME_KEY },
    update: { label: 'Jules_Munyaneza_Resume_2026.pdf', active: true },
    create: { s3Key: RESUME_KEY, label: 'Jules_Munyaneza_Resume_2026.pdf', active: true },
  });

  const homepage = await prisma.homepageContent.upsert({
    where: { id: 'singleton' },
    update: {
      heroHeadline: 'Reliable cloud platforms, deployment systems, and observability that feel effortless.',
      heroSubtext: 'Jules Munyaneza designs practical infrastructure, deployment pipelines and portfolio systems with a production-first mindset.',
      ctaText: 'View My Work',
      ctaUrl: '/projects',
      aboutText: 'Cloud & DevOps engineer focused on secure infrastructure, release automation and operational clarity.',
      metaTitle: 'Jules Munyaneza — Cloud & DevOps Engineer',
      metaDescription: 'Cloud & DevOps portfolio, projects, writing and videos.',
      featuredVideoId: walkthroughVideo.id,
    },
    create: {
      id: 'singleton',
      heroHeadline: 'Reliable cloud platforms, deployment systems, and observability that feel effortless.',
      heroSubtext: 'Jules Munyaneza designs practical infrastructure, deployment pipelines and portfolio systems with a production-first mindset.',
      ctaText: 'View My Work',
      ctaUrl: '/projects',
      aboutText: 'Cloud & DevOps engineer focused on secure infrastructure, release automation and operational clarity.',
      metaTitle: 'Jules Munyaneza — Cloud & DevOps Engineer',
      metaDescription: 'Cloud & DevOps portfolio, projects, writing and videos.',
      featuredVideoId: walkthroughVideo.id,
    },
  });

  const testimonial = await upsertTestimonial();
  const socialLinks = await Promise.all([
    upsertSocialLink('GitHub', 'https://github.com/mjules-tek', 0),
    upsertSocialLink('YouTube', 'https://www.youtube.com/@mjules-tek', 1),
    upsertSocialLink('LinkedIn', 'https://www.linkedin.com/in/mjules-tek', 2),
  ]);
  const contactMessage = await upsertContactMessage();

  console.log('Seed complete');
  console.table({
    admin: admin.email,
    tags: tags.length,
    skills: skills.length,
    videos: videos.length,
    mediaAssets: mediaAssets.length,
    project: project.slug,
    blogPost: blogPost.slug,
    resume: resume.label,
    homepage: homepage.id,
    testimonial: testimonial.name,
    socialLinks: socialLinks.length,
    contactMessage: contactMessage.subject,
  });
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
