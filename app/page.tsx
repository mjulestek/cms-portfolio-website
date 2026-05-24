import { Card, Badge, Button } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { mapProject, resolveHomepageFeaturedVideo, resolveProjectReferences, type MappedProject } from '@/lib/mappers';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type HomepageContentView = { heroHeadline?: string; heroSubtext?: string; ctaText: string; ctaUrl: string; aboutText?: string; featuredVideo?: unknown } | null;

// ─── Data fetching ────────────────────────────────────────────────────────────
async function getData(): Promise<{ content: HomepageContentView; featuredProjects: MappedProject[] }> {
  try {
    const [content, featuredProjects] = await Promise.all([
      prisma.homepageContent.findUnique({ where: { id: 'singleton' } }),
      prisma.project.findMany({
        where: { status: 'PUBLISHED', featured: true },
        take: 3,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const [resolvedProjects, featuredVideo] = await Promise.all([
      resolveProjectReferences(featuredProjects),
      resolveHomepageFeaturedVideo(content?.featuredVideoId),
    ]);
    return {
      content: content ? { ...content, featuredVideo } : null,
      featuredProjects: resolvedProjects.map(mapProject),
    };
  } catch (error) {
    console.error('Failed to load homepage data', error);
    return { content: null, featuredProjects: [] };
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function Home() {
  const { content, featuredProjects } = await getData();

  const ctaText = content?.ctaText ?? 'View My Work';
  const ctaUrl = content?.ctaUrl ?? '/projects';
  const heroHeadline = content?.heroHeadline ?? 'Cloud infrastructure built for scale';
  const heroSubtext = content?.heroSubtext ?? 'DevOps engineer designing resilient systems. From concrete foundations to cloud architecture.';

  return (
    <div className="mx-auto max-w-7xl px-4">

      {/* ── Hero ── */}
      <section className="relative flex min-h-[90vh] flex-col justify-center gap-12 py-16 lg:flex-row lg:items-center lg:gap-8 lg:py-24">

        {/* Localised glow behind the right panel */}
        <div className="pointer-events-none absolute right-0 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute right-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-blue-600/10 blur-[80px]" />

        {/* ── LEFT ── */}
        <div className="relative z-10 flex flex-1 flex-col gap-6 lg:max-w-[52%]">

          {/* Open to work badge */}
          <div className="flex items-center gap-2 self-start rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Open to Work</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl xl:text-7xl">
            {heroHeadline}
          </h1>

          {/* Sub-description */}
          <p className="max-w-lg text-base leading-7 text-slate-400 sm:text-lg">
            {heroSubtext}
          </p>

          {/* CTA row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Primary CTA */}
            <a
              href={ctaUrl}
              className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(103,232,249,0.35)] transition-all duration-300 hover:shadow-[0_0_36px_rgba(103,232,249,0.55)] hover:scale-[1.03]"
            >
              {ctaText}
              <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
            </a>

            {/* Let's Connect */}
            <a
              href="/contact"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/10"
            >
              Let&apos;s Connect
            </a>

            {/* Icon buttons */}
            <div className="flex items-center gap-2">
              {/* GitHub */}
              <a
                href="https://github.com/mjules-tek"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 backdrop-blur-sm transition-all duration-200 hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" /></svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 backdrop-blur-sm transition-all duration-200 hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </a>

              {/* Resume */}
              <a
                href="/api/resume/download"
                aria-label="Download Resume"
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 backdrop-blur-sm transition-all duration-200 hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z" /></svg>
              </a>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-2 grid grid-cols-4 divide-x divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] backdrop-blur-sm">
            {[
              { value: '3+',   label: 'Years Learning' },
              { value: '15+',  label: 'Projects Built' },
              { value: '8+',   label: 'Technologies' },
              { value: '100%', label: 'Passion' },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-0.5 px-3 py-4">
                <span className="text-xl font-black text-white sm:text-2xl">{value}</span>
                <span className="text-center text-[10px] leading-tight text-slate-500 sm:text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="relative z-10 flex flex-1 items-center justify-center lg:justify-end">
          <div className="relative h-[420px] w-[340px] sm:h-[480px] sm:w-[400px]">

            {/* Profile card — main */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800/60 to-slate-900/80 shadow-[0_0_60px_rgba(0,0,0,0.6)] backdrop-blur-xl">
              {/* Placeholder profile image area with gradient overlay */}
              <div className="h-full w-full bg-gradient-to-br from-slate-700/40 via-slate-800/60 to-slate-900/80">
                {/* Subtle grid texture */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.04)_1px,transparent_1px)] bg-[size:32px_32px]" />
                {/* Cyan glow at top */}
                <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
              </div>

              {/* Name tag overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-slate-900/80 px-5 py-4 backdrop-blur-sm">
                <p className="text-lg font-black text-white">Jules Munyaneza</p>
                <p className="text-sm text-cyan-300">Cloud &amp; DevOps Engineer</p>
              </div>
            </div>

            {/* Floating card — Deployment Pipeline (top-right) */}
            <div className="absolute -right-4 top-6 w-52 animate-[float_6s_ease-in-out_infinite] rounded-2xl border border-white/10 bg-slate-900/90 p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:-right-8">
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">Deployment Pipeline</p>
              {[
                { step: 'Code Commit',        done: true  },
                { step: 'Build & Test',       done: true  },
                { step: 'Security Scan',      done: true  },
                { step: 'Deploy to Staging',  done: true  },
                { step: 'Deploy to Production', done: false },
              ].map(({ step, done }) => (
                <div key={step} className="flex items-center justify-between py-[3px]">
                  <span className={`text-[11px] ${done ? 'text-slate-300' : 'text-slate-500'}`}>{step}</span>
                  {done
                    ? <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                    : <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                  }
                </div>
              ))}
            </div>

            {/* Floating card — Terminal snippet (left, middle) */}
            <div className="absolute -left-4 top-1/3 w-48 animate-[float_8s_ease-in-out_1s_infinite] rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:-left-10">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <div className="space-y-1 font-mono text-[10px] leading-relaxed">
                <p><span className="text-cyan-400">jules@cloud</span><span className="text-slate-500">:~$</span></p>
                <p className="text-slate-300">deploy <span className="text-cyan-300">--env</span></p>
                <p className="text-slate-300 pl-2">production</p>
                <p className="text-slate-500">Building infra...</p>
                <p className="text-slate-500">Provisioning...</p>
                <p className="text-emerald-400">✓ Deployed!</p>
              </div>
            </div>

            {/* Floating card — Cloud icon panel (bottom-left) */}
            <div className="absolute -bottom-4 -left-4 animate-[float_7s_ease-in-out_2s_infinite] rounded-2xl border border-cyan-400/20 bg-slate-900/90 p-3 shadow-[0_0_24px_rgba(103,232,249,0.12)] backdrop-blur-xl sm:-left-8">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10">
                  {/* Cloud upload icon */}
                  <svg className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75z" /></svg>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white">AWS Deploy</p>
                  <p className="text-[10px] text-emerald-400">● Live</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Featured Projects — unchanged ── */}
      {featuredProjects.length > 0 && (
        <section className="mt-8 grid gap-5 pb-16 md:grid-cols-3">
          {featuredProjects.map(p => (
            <Card key={p.id} className="overflow-hidden">
              {p.coverImageUrl && (
                <img src={p.coverImageUrl} alt={p.title} className="mb-4 h-44 w-full rounded-2xl object-cover" />
              )}
              <h2 className="text-2xl font-black text-white">{p.title}</h2>
              <p className="mt-2 text-slate-400">{p.tagline}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {p.tags.map((t: { id: string; name: string; slug: string }) => (
                  <Badge key={t.id}>{t.name}</Badge>
                ))}
              </div>
              <div className="mt-4">
                <Button href={`/projects/${p.slug}`} variant="secondary">Read case study</Button>
              </div>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
