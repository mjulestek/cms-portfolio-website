import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'mjules.tek@gmail.com';
const RESUME_KEY = 'resume/Jules_Munyaneza_Resume_2026.pdf';

const thumb = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
const embed = (id: string) => `https://www.youtube.com/embed/${id}`;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function upsertSocialLink(platform: string, url: string, order: number, iconKey: string | null = null) {
  const data = { platform, url, iconKey, order, visible: true };
  const existing = await prisma.socialLink.findFirst({ where: { platform } });
  if (existing) return prisma.socialLink.update({ where: { id: existing.id }, data });
  return prisma.socialLink.create({ data });
}

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { name: 'Jules Munyaneza', role: 'ADMIN' },
    create: { email: ADMIN_EMAIL, name: 'Jules Munyaneza', role: 'ADMIN' },
  });

  const tags: Array<{ id: string; slug: string; name: string }> = await Promise.all(
    [
      ['cloud', 'Cloud'],
      ['kubernetes', 'Kubernetes'],
      ['terraform', 'Terraform'],
      ['ci-cd', 'CI/CD'],
      ['monitoring', 'Monitoring'],
      ['devops', 'DevOps'],
      ['architecture', 'Architecture'],
      ['automation', 'Automation'],
    ].map(([slug, name]) =>
      prisma.tag.upsert({
        where: { slug },
        update: { name },
        create: { slug, name },
      }),
    ),
  );

  const tagBySlug = new Map(tags.map(tag => [tag.slug, tag]));

  const blogCategories: Array<{ id: string; slug: string; name: string; order: number; visible: boolean }> = await Promise.all(
    [
      { name: 'Kubernetes', slug: 'kubernetes', order: 0 },
      { name: 'Terraform', slug: 'terraform', order: 1 },
      { name: 'CI/CD', slug: 'ci-cd', order: 2 },
      { name: 'Monitoring', slug: 'monitoring', order: 3 },
    ].map(category =>
      prisma.blogCategory.upsert({
        where: { slug: category.slug },
        update: { ...category, visible: true },
        create: { ...category, visible: true },
      }),
    ),
  );

  const categoryBySlug = new Map(blogCategories.map(category => [category.slug, category]));

  const skills: Array<{ id: string; name: string; category: string; proficiency: number; order: number }> = await Promise.all(
    [
      { name: 'AWS', category: 'Cloud', proficiency: 92, order: 0 },
      { name: 'Terraform', category: 'Infrastructure as Code', proficiency: 90, order: 1 },
      { name: 'Kubernetes', category: 'Container orchestration', proficiency: 86, order: 2 },
      { name: 'Docker', category: 'Containers', proficiency: 88, order: 3 },
      { name: 'GitHub Actions', category: 'CI/CD', proficiency: 90, order: 4 },
      { name: 'Prometheus', category: 'Monitoring', proficiency: 82, order: 5 },
      { name: 'Grafana', category: 'Monitoring', proficiency: 84, order: 6 },
      { name: 'CloudFront', category: 'Edge delivery', proficiency: 86, order: 7 },
    ].map(skill =>
      prisma.skill.upsert({
        where: { name: skill.name },
        update: { ...skill, iconKey: null },
        create: { ...skill, iconKey: null },
      }),
    ),
  );

  const videos: Array<{ id: string; youtubeVideoId: string }> = await Promise.all(
    [
      {
        youtubeUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
        youtubeVideoId: 'ysz5S6PUM-U',
        title: 'Infrastructure Walkthrough',
        caption: 'A sample embed-friendly infrastructure walkthrough.',
        category: 'WALKTHROUGH' as const,
        featured: true,
        order: 0,
      },
      {
        youtubeUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
        youtubeVideoId: 'jfKfPfyJRdk',
        title: 'Deployment Pipeline Demo',
        caption: 'A demo video for deployment workflows.',
        category: 'DEMO' as const,
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

  await prisma.mediaAsset.upsert({
    where: { s3Key: RESUME_KEY },
    update: {
      filename: 'Jules_Munyaneza_Resume_2026.pdf',
      mimeType: 'application/pdf',
      mediaType: 'RESUME',
      size: 512000,
      alt: 'Jules Munyaneza resume PDF',
      usedIn: 'resume:active',
    },
    create: {
      s3Key: RESUME_KEY,
      filename: 'Jules_Munyaneza_Resume_2026.pdf',
      mimeType: 'application/pdf',
      mediaType: 'RESUME',
      size: 512000,
      alt: 'Jules Munyaneza resume PDF',
      usedIn: 'resume:active',
    },
  });

  const projectSeeds = [
    { title: 'Multi-region AWS deployment pipeline', tag: 'cloud', placement: 'large', order: 0, read: '8 min read', tagline: 'Orchestrating infrastructure across availability zones with Terraform.' },
    { title: 'Kubernetes cluster migration and scaling', tag: 'devops', placement: 'side', order: 1, read: '6 min read', tagline: 'Migrating workloads to a scalable Kubernetes platform with minimal downtime.' },
    { title: 'CI/CD pipeline optimization for speed', tag: 'architecture', placement: 'side', order: 2, read: '7 min read', tagline: 'Reducing deployment time while keeping release controls reliable.' },
    { title: 'Infrastructure monitoring with Prometheus', tag: 'automation', placement: 'side', order: 3, read: '5 min read', tagline: 'Designing metrics, alerts, and dashboards for production visibility.' },
    { title: 'Multi-region deployment at scale', tag: 'cloud', placement: 'grid', order: 4, read: '12 min read', tagline: 'Moving workloads to production-grade regions with zero downtime.' },
    { title: 'Zero-downtime cluster migration', tag: 'kubernetes', placement: 'grid', order: 5, read: '10 min read', tagline: 'Reducing deployment time from hours to minutes with GitHub Actions.' },
    { title: 'Pipeline optimization for speed', tag: 'devops', placement: 'grid', order: 6, read: '8 min read', tagline: 'Building observability into systems that demand reliability.' },
    { title: 'Infrastructure as code at enterprise', tag: 'terraform', placement: 'grid', order: 7, read: '11 min read', tagline: 'Orchestrating infrastructure across availability zones with precision.' },
    { title: 'Designing resilient cloud systems', tag: 'architecture', placement: 'grid', order: 8, read: '13 min read', tagline: 'Systems built to handle what production throws at them.' },
  ];

  const projects = await Promise.all(
    projectSeeds.map(seed => {
      const tag = tagBySlug.get(seed.tag);
      return prisma.project.upsert({
        where: { slug: slugify(seed.title) },
        update: {
          title: seed.title,
          tagline: seed.tagline,
          status: 'PUBLISHED',
          featured: seed.order < 4,
          homepageVisible: true,
          homepageOrder: seed.order,
          homepagePlacement: seed.placement,
          readTime: seed.read,
          ctaLabel: seed.order === 0 ? 'Read more' : 'View case',
          story: `${seed.title} is a production-style case study focused on practical infrastructure decisions.`,
          challenge: 'The environment needed reliable deployment, safe rollback, clear ownership, and useful visibility.',
          solution: 'The work combined automation, reusable infrastructure patterns, monitoring, and release discipline.',
          results: 'The result was a cleaner delivery path, reduced operational risk, and a stronger foundation for scaling.',
          metrics: { Reliability: 'Improved', Delivery: 'Faster', Visibility: 'Clearer' },
          coverImageKey: null,
          pdfKey: null,
          githubUrl: 'https://github.com/mjules-tek',
          liveUrl: 'https://example.com',
          images: [],
          tagIds: tag ? [tag.id] : [],
          techStackIds: skills.slice(0, 4).map(skill => skill.id),
          videoEntries: [{ videoId: videos[0].id, featured: true, order: 0 }],
        },
        create: {
          slug: slugify(seed.title),
          title: seed.title,
          tagline: seed.tagline,
          status: 'PUBLISHED',
          featured: seed.order < 4,
          homepageVisible: true,
          homepageOrder: seed.order,
          homepagePlacement: seed.placement,
          readTime: seed.read,
          ctaLabel: seed.order === 0 ? 'Read more' : 'View case',
          story: `${seed.title} is a production-style case study focused on practical infrastructure decisions.`,
          challenge: 'The environment needed reliable deployment, safe rollback, clear ownership, and useful visibility.',
          solution: 'The work combined automation, reusable infrastructure patterns, monitoring, and release discipline.',
          results: 'The result was a cleaner delivery path, reduced operational risk, and a stronger foundation for scaling.',
          metrics: { Reliability: 'Improved', Delivery: 'Faster', Visibility: 'Clearer' },
          coverImageKey: null,
          pdfKey: null,
          githubUrl: 'https://github.com/mjules-tek',
          liveUrl: 'https://example.com',
          images: [],
          tagIds: tag ? [tag.id] : [],
          techStackIds: skills.slice(0, 4).map(skill => skill.id),
          videoEntries: [{ videoId: videos[0].id, featured: true, order: 0 }],
        },
      });
    }),
  );

  const blogSeeds = [
    { title: 'Stateful workloads in Kubernetes clusters', category: 'kubernetes', read: '7 min read', excerpt: 'Patterns and practices for running databases and stateful services.' },
    { title: 'Infrastructure as code best practices', category: 'terraform', read: '9 min read', excerpt: 'Writing Terraform that scales, maintains, and documents itself.' },
    { title: 'GitHub Actions for production deployments', category: 'ci-cd', read: '6 min read', excerpt: 'Building reliable pipelines that developers trust and understand.' },
    { title: 'Observability without the noise', category: 'monitoring', read: '8 min read', excerpt: 'Designing monitoring systems that alert on what matters.' },
  ];

  const posts = await Promise.all(
    blogSeeds.map((seed, index) => {
      const category = categoryBySlug.get(seed.category);
      const tag = tagBySlug.get(seed.category);
      return prisma.blogPost.upsert({
        where: { slug: slugify(seed.title) },
        update: {
          title: seed.title,
          excerpt: seed.excerpt,
          body: `${seed.excerpt}\n\nThis seeded article gives the homepage enough realistic content to test filtering, spacing, and card layout.`,
          status: 'PUBLISHED',
          featured: true,
          homepageVisible: true,
          homepageOrder: index,
          readTime: seed.read,
          ctaLabel: 'Read more',
          categoryId: category?.id ?? null,
          publishedAt: new Date(`2026-02-${String(index + 1).padStart(2, '0')}T12:00:00.000Z`),
          coverImageKey: null,
          tagIds: tag ? [tag.id] : [],
          videoEntries: [],
        },
        create: {
          slug: slugify(seed.title),
          title: seed.title,
          excerpt: seed.excerpt,
          body: `${seed.excerpt}\n\nThis seeded article gives the homepage enough realistic content to test filtering, spacing, and card layout.`,
          status: 'PUBLISHED',
          featured: true,
          homepageVisible: true,
          homepageOrder: index,
          readTime: seed.read,
          ctaLabel: 'Read more',
          categoryId: category?.id ?? null,
          publishedAt: new Date(`2026-02-${String(index + 1).padStart(2, '0')}T12:00:00.000Z`),
          coverImageKey: null,
          tagIds: tag ? [tag.id] : [],
          videoEntries: [],
        },
      });
    }),
  );

  await prisma.resume.updateMany({ data: { active: false } });
  const resume = await prisma.resume.upsert({
    where: { s3Key: RESUME_KEY },
    update: { label: 'Jules_Munyaneza_Resume_2026.pdf', active: true },
    create: { s3Key: RESUME_KEY, label: 'Jules_Munyaneza_Resume_2026.pdf', active: true },
  });

  const homepage = await prisma.homepageContent.upsert({
    where: { id: 'singleton' },
    update: {
      heroHeadline: 'Infrastructure that scales from idea to production',
      heroSubtext: 'Cloud, DevOps, deployment systems, and infrastructure stories built for reliability.',
      heroImageKey: null,
      ctaText: 'View projects',
      ctaUrl: '/projects',
      aboutText: 'Cloud and DevOps engineer focused on secure infrastructure, release automation, and operational clarity.',
      metaTitle: 'Jules Munyaneza — Cloud & DevOps Engineer',
      metaDescription: 'Cloud & DevOps portfolio, projects, writing and videos.',
      featuredVideoId: videos[0].id,
      timelineEyebrow: 'Timeline',
      timelineTitle: 'Experience and certifications',
      timelineSubtitle: 'Years of building, learning, and shipping infrastructure that matters.',
      writingEyebrow: 'Writing',
      writingTitle: 'Knowledge worth sharing',
      writingSubtitle: 'Technical insights from the field.',
      projectsEyebrow: 'Projects',
      projectsTitle: 'Work that scales',
      projectsSubtitle: 'Infrastructure built for production demands.',
      stackEyebrow: 'Stack',
      stackTitle: 'Tools that power production infrastructure',
      stackSubtitle: 'Built with technologies that handle real scale. Each tool chosen for reliability, not hype. The stack that runs the internet.',
    },
    create: {
      id: 'singleton',
      heroHeadline: 'Infrastructure that scales from idea to production',
      heroSubtext: 'Cloud, DevOps, deployment systems, and infrastructure stories built for reliability.',
      heroImageKey: null,
      ctaText: 'View projects',
      ctaUrl: '/projects',
      aboutText: 'Cloud and DevOps engineer focused on secure infrastructure, release automation, and operational clarity.',
      metaTitle: 'Jules Munyaneza — Cloud & DevOps Engineer',
      metaDescription: 'Cloud & DevOps portfolio, projects, writing and videos.',
      featuredVideoId: videos[0].id,
      timelineEyebrow: 'Timeline',
      timelineTitle: 'Experience and certifications',
      timelineSubtitle: 'Years of building, learning, and shipping infrastructure that matters.',
      writingEyebrow: 'Writing',
      writingTitle: 'Knowledge worth sharing',
      writingSubtitle: 'Technical insights from the field.',
      projectsEyebrow: 'Projects',
      projectsTitle: 'Work that scales',
      projectsSubtitle: 'Infrastructure built for production demands.',
      stackEyebrow: 'Stack',
      stackTitle: 'Tools that power production infrastructure',
      stackSubtitle: 'Built with technologies that handle real scale. Each tool chosen for reliability, not hype. The stack that runs the internet.',
    },
  });

  await Promise.all(
    [
      { year: '2024', title: 'AWS Solutions Architect Professional', description: 'AWS Solutions Architect Professional certification earned and validated.', externalUrl: 'https://aws.amazon.com/certification/', order: 0 },
      { year: '2023', title: 'Infrastructure modernization', description: 'Led infrastructure modernization for enterprise-scale Kubernetes deployments.', externalUrl: null, order: 1 },
      { year: '2022', title: 'Cloud engineering transition', description: 'Transitioned from civil engineering to cloud infrastructure engineering.', externalUrl: null, order: 2 },
      { year: '2021', title: 'AWS Solutions Architect Associate', description: 'Completed AWS Solutions Architect Associate certification program.', externalUrl: 'https://aws.amazon.com/certification/', order: 3 },
      { year: '2020', title: 'DevOps journey started', description: 'Started journey into cloud infrastructure and DevOps practices.', externalUrl: null, order: 4 },
    ].map(async item => {
      const existing = await prisma.homepageTimelineItem.findFirst({ where: { year: item.year, title: item.title } });
      const data = { ...item, imageKey: null, active: true };
      if (existing) return prisma.homepageTimelineItem.update({ where: { id: existing.id }, data });
      return prisma.homepageTimelineItem.create({ data });
    }),
  );

  await Promise.all(
    [
      { title: 'Container orchestration and scaling', description: 'Docker for consistency. Kubernetes for orchestration. Running workloads that demand precision.', category: 'Kubernetes', order: 0 },
      { title: 'Infrastructure as code automation', description: 'Terraform for reproducible infrastructure. Every resource versioned, every change tracked.', category: 'Terraform', order: 1 },
      { title: 'Continuous integration and deployment', description: 'GitHub Actions and Jenkins pipelines. Automating the path from code to production.', category: 'CI/CD', order: 2 },
      { title: 'Observability and system monitoring', description: 'Prometheus and Grafana for visibility. Knowing what happens before it becomes a problem.', category: 'Monitoring', order: 3 },
      { title: 'Cloud delivery and edge performance', description: 'S3 and CloudFront patterns for fast, resilient delivery of static and media assets.', category: 'Cloud', order: 4 },
      { title: 'Release safety and rollback design', description: 'Deployment systems designed around reversibility, audit trails, and repeatable recovery.', category: 'Delivery', order: 5 },
    ].map(async item => {
      const existing = await prisma.homepageStackItem.findFirst({ where: { title: item.title } });
      const data = { ...item, iconKey: null, externalUrl: null, active: true };
      if (existing) return prisma.homepageStackItem.update({ where: { id: existing.id }, data });
      return prisma.homepageStackItem.create({ data });
    }),
  );

  await prisma.footerSettings.upsert({
    where: { id: 'singleton' },
    update: {
      logoText: 'Jules Munyaneza',
      location: 'Kigali, Rwanda',
      email: 'mjules.tek@gmail.com',
      linkedInUrl: 'https://www.linkedin.com/in/mjules-tek',
      copyrightText: '© 2026 Jules Munyaneza. All rights reserved.',
    },
    create: {
      id: 'singleton',
      logoText: 'Jules Munyaneza',
      location: 'Kigali, Rwanda',
      email: 'mjules.tek@gmail.com',
      linkedInUrl: 'https://www.linkedin.com/in/mjules-tek',
      copyrightText: '© 2026 Jules Munyaneza. All rights reserved.',
    },
  });

  await Promise.all(
    [
      { column: 'Work', label: 'About', url: '/', order: 0 },
      { column: 'Work', label: 'Writing', url: '/blog', order: 1 },
      { column: 'Work', label: 'Contact', url: '/contact', order: 2 },
      { column: 'Work', label: 'GitHub', url: 'https://github.com/mjules-tek', order: 3 },
      { column: 'Home', label: 'Home', url: '/', order: 0 },
      { column: 'Home', label: 'Projects', url: '/projects', order: 1 },
      { column: 'Home', label: 'Blog', url: '/blog', order: 2 },
      { column: 'Home', label: 'Contact', url: '/contact', order: 3 },
      { column: 'Home', label: 'GitHub', url: 'https://github.com/mjules-tek', order: 4 },
    ].map(async item => {
      const existing = await prisma.footerNavigationLink.findFirst({ where: { column: item.column, label: item.label } });
      if (existing) return prisma.footerNavigationLink.update({ where: { id: existing.id }, data: { ...item, visible: true } });
      return prisma.footerNavigationLink.create({ data: { ...item, visible: true } });
    }),
  );

  await Promise.all(
    [
      { label: 'Privacy Policy', url: '/privacy', order: 0 },
      { label: 'Terms of service', url: '/terms', order: 1 },
      { label: 'Cookie settings', url: '/cookies', order: 2 },
    ].map(async item => {
      const existing = await prisma.legalLink.findFirst({ where: { label: item.label } });
      if (existing) return prisma.legalLink.update({ where: { id: existing.id }, data: { ...item, visible: true } });
      return prisma.legalLink.create({ data: { ...item, visible: true } });
    }),
  );

  const socialLinks = await Promise.all([
    upsertSocialLink('GitHub', 'https://github.com/mjules-tek', 0),
    upsertSocialLink('LinkedIn', 'https://www.linkedin.com/in/mjules-tek', 1),
    upsertSocialLink('YouTube', 'https://www.youtube.com/@mjules-tek', 2),
  ]);

  await Promise.all(
    [
      { section: 'timeline', label: 'Github', url: 'https://github.com/mjules-tek', order: 0 },
      { section: 'timeline', label: 'LinkedIn', url: 'https://www.linkedin.com/in/mjules-tek', order: 1 },
      { section: 'stack', label: 'Explore', url: '/projects', order: 0 },
      { section: 'stack', label: 'GitHub', url: 'https://github.com/mjules-tek', order: 1 },
    ].map(async item => {
      const existing = await prisma.homepageCTASetting.findFirst({ where: { section: item.section, label: item.label } });
      if (existing) return prisma.homepageCTASetting.update({ where: { id: existing.id }, data: { ...item, visible: true } });
      return prisma.homepageCTASetting.create({ data: { ...item, visible: true } });
    }),
  );

  await prisma.testimonial.upsert({
    where: { id: (await prisma.testimonial.findFirst({ where: { name: 'Jane Doe', company: 'Acme Corp' }, select: { id: true } }))?.id ?? '000000000000000000000000' },
    update: {
      name: 'Jane Doe',
      role: 'Engineering Manager',
      company: 'Acme Corp',
      avatarKey: null,
      quote: 'Jules delivered thoughtful infrastructure work with strong operational clarity.',
      visible: true,
      order: 0,
    },
    create: {
      name: 'Jane Doe',
      role: 'Engineering Manager',
      company: 'Acme Corp',
      avatarKey: null,
      quote: 'Jules delivered thoughtful infrastructure work with strong operational clarity.',
      visible: true,
      order: 0,
    },
  }).catch(async () => {
    const existing = await prisma.testimonial.findFirst({ where: { name: 'Jane Doe', company: 'Acme Corp' } });
    if (existing) return existing;
    return prisma.testimonial.create({
      data: {
        name: 'Jane Doe',
        role: 'Engineering Manager',
        company: 'Acme Corp',
        avatarKey: null,
        quote: 'Jules delivered thoughtful infrastructure work with strong operational clarity.',
        visible: true,
        order: 0,
      },
    });
  });

  const contactMessage = await prisma.contactMessage.findFirst({ where: { email: 'visitor@example.com', subject: 'Seeded local contact message' } })
    ?? await prisma.contactMessage.create({
      data: {
        name: 'Local Test Visitor',
        email: 'visitor@example.com',
        subject: 'Seeded local contact message',
        message: 'This sample message verifies the ContactMessage collection in local MongoDB.',
        status: 'NEW',
        ipAddress: '127.0.0.1',
        userAgent: 'seed-script',
      },
    });

  console.log('Seed complete');
  console.table({
    admin: admin.email,
    tags: tags.length,
    blogCategories: blogCategories.length,
    skills: skills.length,
    videos: videos.length,
    projects: projects.length,
    posts: posts.length,
    resume: resume.label,
    homepage: homepage.id,
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
