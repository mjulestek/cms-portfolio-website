import Link from 'next/link';
import { WritingSection } from '@/components/homepage/writing-section';
import { assetUrlFromKey } from '@/lib/s3';
import { getHomepageData, type HomepageCTAView, type HomepageTimelineItemView, type HomepageStackItemView } from '@/lib/homepage-data';
import type { MappedProject } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

function ctaFor(ctas: HomepageCTAView[], section: string, index: number, fallback: { label: string; url: string }) {
  return ctas.filter(cta => cta.section === section).sort((a, b) => a.order - b.order)[index] ?? fallback;
}

function Arrow() {
  return <span aria-hidden="true" className="ml-2 inline-block transition group-hover:translate-x-1">›</span>;
}

function ImageBox({ src, alt, className = '' }: { src?: string | null; alt: string; className?: string }) {
  return (
    <div className={`flex overflow-hidden bg-neutral-200 ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0" />
      ) : (
        <div className="flex h-full min-h-[10rem] w-full items-center justify-center text-neutral-400">
          <svg className="h-14 w-14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 16l4-4a2 2 0 0 1 3 0l2 2 1-1a2 2 0 0 1 3 0l5 5"/><path d="M3 5h18v14H3z"/><circle cx="8" cy="9" r="1.5"/></svg>
        </div>
      )}
    </div>
  );
}

function InternalOrExternalLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  if (href.startsWith('http')) {
    return <a href={href} target="_blank" rel="noreferrer" className={className}>{children}</a>;
  }
  return <Link href={href} className={className}>{children}</Link>;
}

function SectionIntro({ eyebrow, title, subtitle, align = 'left' }: { eyebrow: string; title: string; subtitle: string; align?: 'left' | 'center' }) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-4xl'}>
      <p className="text-sm font-bold tracking-tight text-black">{eyebrow}</p>
      <h2 className="mt-6 text-4xl font-black leading-[1.05] tracking-[0.08em] text-black sm:text-5xl lg:text-6xl">{title}</h2>
      <p className="mt-7 text-xl leading-8 text-black/80">{subtitle}</p>
    </div>
  );
}

function TimelineSection({ timeline, ctas, eyebrow, title, subtitle }: { timeline: HomepageTimelineItemView[]; ctas: HomepageCTAView[]; eyebrow: string; title: string; subtitle: string }) {
  if (timeline.length === 0) return null;
  const github = ctaFor(ctas, 'timeline', 0, { label: 'Github', url: 'https://github.com/mjules-tek' });
  const linkedin = ctaFor(ctas, 'timeline', 1, { label: 'LinkedIn', url: 'https://www.linkedin.com/in/mjules-tek' });

  return (
    <section className="px-6 py-28 sm:px-10 lg:px-20">
      <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className="mt-10 flex flex-wrap items-center gap-6">
        <InternalOrExternalLink href={github.url} className="border border-black px-8 py-4 text-base font-medium transition hover:bg-black hover:text-white">{github.label}</InternalOrExternalLink>
        <InternalOrExternalLink href={linkedin.url} className="group text-base font-medium text-black underline-offset-4 hover:underline">{linkedin.label}<Arrow /></InternalOrExternalLink>
      </div>
      <div className="mt-28 hidden lg:block">
        <div className="grid grid-cols-5 items-center gap-3">
          {timeline.slice(0, 5).map((item, index) => {
            const body = (
              <>
                {index % 2 === 0 && <ImageBox src={item.imageUrl} alt={item.title} className="h-44 w-full" />}
                <div className={index % 2 === 0 ? 'mt-7' : 'mb-7'}>
                  <h3 className="text-3xl font-black tracking-wide text-black">{item.year}</h3>
                  <p className="mt-2 text-base font-bold text-black">{item.title}</p>
                  <p className="mt-4 text-lg leading-7 text-black/85">{item.description}</p>
                </div>
                {index % 2 === 1 && <ImageBox src={item.imageUrl} alt={item.title} className="h-44 w-full" />}
              </>
            );
            return (
              <div key={item.id} className="relative min-h-[340px]">
                <div className={index % 2 === 0 ? 'mb-6' : 'mt-40'}>
                  {item.externalUrl ? (
                    <InternalOrExternalLink href={item.externalUrl} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-black">
                      {body}
                    </InternalOrExternalLink>
                  ) : body}
                </div>
                <div className="absolute left-0 right-0 top-1/2 h-[3px] bg-black" />
                <div className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-black" />
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-16 grid gap-8 lg:hidden">
        {timeline.map(item => {
          const body = (
            <>
              <ImageBox src={item.imageUrl} alt={item.title} className="h-52" />
              <div>
                <p className="text-3xl font-black text-black">{item.year}</p>
                <h3 className="mt-2 text-2xl font-black text-black">{item.title}</h3>
                <p className="mt-3 text-lg leading-7 text-black/75">{item.description}</p>
              </div>
            </>
          );
          return item.externalUrl ? (
            <InternalOrExternalLink key={item.id} href={item.externalUrl} className="group grid gap-5 border-l-4 border-black pl-6">{body}</InternalOrExternalLink>
          ) : (
            <div key={item.id} className="grid gap-5 border-l-4 border-black pl-6">{body}</div>
          );
        })}
      </div>
    </section>
  );
}

function ProjectCard({ project, large = false }: { project: MappedProject; large?: boolean }) {
  const tag = project.tags[0]?.name ?? 'Case study';
  return (
    <Link href={`/projects/${project.slug}`} className={`group block ${large ? 'lg:col-span-2 lg:row-span-3' : ''}`}>
      <article className="flex h-full flex-col">
        <ImageBox src={project.coverImageUrl} alt={project.title} className={large ? 'h-[420px]' : 'h-48'} />
        <div className="flex flex-1 flex-col pt-6">
          <div className="flex flex-wrap items-center gap-5 text-sm font-bold text-black">
            <span className="bg-neutral-100 px-3 py-2">{tag}</span>
            <span>{project.readTime ?? '8 min read'}</span>
          </div>
          <h3 className={`${large ? 'text-3xl' : 'text-2xl'} mt-5 font-black leading-tight text-black`}>{project.title}</h3>
          <p className="mt-4 text-base leading-7 text-black/75">{project.tagline}</p>
          <span className="mt-auto pt-7 text-base font-medium text-black">{project.ctaLabel ?? 'View case'}<Arrow /></span>
        </div>
      </article>
    </Link>
  );
}

function ProjectsSection({ projects, eyebrow, title, subtitle }: { projects: MappedProject[]; eyebrow: string; title: string; subtitle: string }) {
  if (projects.length === 0) return null;
  const sorted = [...projects].sort((a, b) => (a.homepageOrder ?? 0) - (b.homepageOrder ?? 0));
  const large = sorted.find(p => p.homepagePlacement === 'large') ?? sorted[0];
  const side = sorted.filter(p => p.id !== large.id && p.homepagePlacement === 'side').slice(0, 3);
  const sideFallback = sorted.filter(p => p.id !== large.id && p.homepagePlacement !== 'grid' && !side.some(item => item.id === p.id)).slice(0, Math.max(0, 3 - side.length));
  const small = [...side, ...sideFallback].slice(0, 3);
  const gridExplicit = sorted.filter(p => p.id !== large.id && p.homepagePlacement === 'grid' && !small.some(item => item.id === p.id));
  const gridFallback = sorted.filter(p => p.id !== large.id && !small.some(item => item.id === p.id) && !gridExplicit.some(item => item.id === p.id));
  const grid = [...gridExplicit, ...gridFallback];
  return (
    <section className="px-6 py-28 sm:px-10 lg:px-20">
      <div className="max-w-4xl">
        <p className="text-sm font-bold text-black">{eyebrow}</p>
        <h2 className="mt-6 text-5xl font-black leading-tight text-black sm:text-6xl">{title}</h2>
        <p className="mt-7 text-xl leading-8 text-black/80">{subtitle}</p>
      </div>
      <div className="mt-16 grid gap-8 lg:grid-cols-[1.25fr_1fr]">
        <ProjectCard project={large} large />
        <div className="grid gap-8">
          {small.map(project => <ProjectCard key={project.id} project={project} />)}
        </div>
      </div>
      {grid.length > 0 && (
        <div className="mt-24">
          <h3 className="text-2xl font-black text-black">Production infrastructure work</h3>
          <div className="mt-10 grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
            {grid.map(project => <ProjectCard key={project.id} project={project} />)}
          </div>
        </div>
      )}
    </section>
  );
}

function StackIcon({ item }: { item: HomepageStackItemView }) {
  const iconUrl = assetUrlFromKey(item.iconKey);
  if (iconUrl) return <img src={iconUrl} alt="" className="mx-auto h-12 w-12 object-contain grayscale" />;
  return <svg className="mx-auto h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14c3-6 7-6 10 0s5 6 6 0"/><path d="M4 10c3 6 7 6 10 0s5-6 6 0"/></svg>;
}

function StackSection({ stack, ctas, eyebrow, title, subtitle }: { stack: HomepageStackItemView[]; ctas: HomepageCTAView[]; eyebrow: string; title: string; subtitle: string }) {
  if (stack.length === 0) return null;
  const explore = ctaFor(ctas, 'stack', 0, { label: 'Explore', url: '/projects' });
  const github = ctaFor(ctas, 'stack', 1, { label: 'GitHub', url: 'https://github.com/mjules-tek' });
  return (
    <section className="px-6 py-32 text-center sm:px-10 lg:px-20">
      <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} align="center" />
      <div className="mt-24 grid gap-x-10 gap-y-20 md:grid-cols-2 xl:grid-cols-4">
        {stack.map(item => (
          <a key={item.id} href={item.externalUrl ?? '#'} className="group block">
            <StackIcon item={item} />
            <h3 className="mt-8 text-3xl font-black leading-tight text-black">{item.title}</h3>
            <p className="mt-7 text-lg leading-8 text-black/75">{item.description}</p>
          </a>
        ))}
      </div>
      <div className="mt-24 flex flex-wrap justify-center gap-7">
        <InternalOrExternalLink href={explore.url} className="border border-black px-8 py-4 text-base font-medium transition hover:bg-black hover:text-white">{explore.label}</InternalOrExternalLink>
        <InternalOrExternalLink href={github.url} className="group px-3 py-4 text-base font-medium text-black">{github.label}<Arrow /></InternalOrExternalLink>
      </div>
    </section>
  );
}

export default async function Home() {
  const data = await getHomepageData();
  const heroHeadline = data.content?.heroHeadline ?? 'Infrastructure that scales from idea to production';
  const heroSubtext = data.content?.heroSubtext ?? 'Cloud, DevOps, deployment systems, and infrastructure stories built for reliability.';
  const heroImageUrl = data.content?.heroImageUrl ?? assetUrlFromKey(data.content?.heroImageKey);
  const primaryCta = { label: data.content?.ctaText ?? 'View projects', url: data.content?.ctaUrl ?? '/projects' };

  return (
    <div className="relative z-10 bg-[#f8f7f3] text-black">
      <section className="grid min-h-[86vh] items-center gap-12 px-6 py-24 sm:px-10 lg:grid-cols-[1.05fr_.95fr] lg:px-20">
        <div className="max-w-5xl">
          <p className="text-sm font-black uppercase tracking-[0.28em]">Cloud infrastructure portfolio</p>
          <h1 className="mt-8 text-6xl font-black leading-[0.95] tracking-tight text-black sm:text-7xl lg:text-8xl">{heroHeadline}</h1>
          <p className="mt-8 max-w-3xl text-2xl leading-10 text-black/75">{heroSubtext}</p>
          <div className="mt-12 flex flex-wrap gap-6">
            <InternalOrExternalLink href={primaryCta.url} className="border border-black px-8 py-4 text-base font-semibold transition hover:bg-black hover:text-white">{primaryCta.label}</InternalOrExternalLink>
            <Link href="/contact" className="group px-3 py-4 text-base font-semibold text-black">Contact<Arrow /></Link>
          </div>
        </div>
        <div className="group relative mx-auto w-full max-w-xl">
          <ImageBox src={heroImageUrl} alt={heroHeadline} className="h-[520px] border border-black/10" />
          <div className="absolute -bottom-8 -left-8 border border-black bg-white p-6 shadow-[12px_12px_0_#000]">
            <p className="text-sm font-bold uppercase tracking-[0.2em]">Production ready</p>
            <p className="mt-3 text-2xl font-black">DevOps systems, CMS builds, and cloud delivery.</p>
          </div>
        </div>
      </section>

      <TimelineSection timeline={data.timeline} ctas={data.ctas} eyebrow={data.content?.timelineEyebrow ?? 'Timeline'} title={data.content?.timelineTitle ?? 'Experience and certifications'} subtitle={data.content?.timelineSubtitle ?? 'Years of building, learning, and shipping infrastructure that matters.'} />
      <WritingSection posts={data.posts} categories={data.blogCategories} eyebrow={data.content?.writingEyebrow ?? 'Writing'} title={data.content?.writingTitle ?? 'Knowledge worth sharing'} subtitle={data.content?.writingSubtitle ?? 'Technical insights from the field.'} />
      <ProjectsSection projects={data.projects} eyebrow={data.content?.projectsEyebrow ?? 'Projects'} title={data.content?.projectsTitle ?? 'Work that scales'} subtitle={data.content?.projectsSubtitle ?? 'Infrastructure built for production demands.'} />
      <StackSection stack={data.stack} ctas={data.ctas} eyebrow={data.content?.stackEyebrow ?? 'Stack'} title={data.content?.stackTitle ?? 'Tools that power production infrastructure'} subtitle={data.content?.stackSubtitle ?? 'Built with technologies that handle real scale. Each tool chosen for reliability, not hype. The stack that runs the internet.'} />
    </div>
  );
}
