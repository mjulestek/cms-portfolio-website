import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Card, Badge, Button } from '@/components/ui/card';
import { VideoGallery } from '@/components/videos/video-gallery';
import { prisma } from '@/lib/prisma';
import { mapProject, resolveProjectReferences } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

async function getProject(slug: string) {
  try {
    const project = await prisma.project.findFirst({
      where: { slug, status: 'PUBLISHED' },
    });
    if (!project) return null;
    const [resolvedProject] = await resolveProjectReferences([project]);
    return mapProject(resolvedProject);
  } catch (error) {
    console.error(`Failed to load project ${slug}`, error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const project = await getProject(params.slug);
  if (!project) return {};
  return { title: project.title, description: project.tagline };
}

export default async function ProjectDetail({ params }: { params: { slug: string } }) {
  const p = await getProject(params.slug);
  if (!p) return notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <p className="text-cyan-300">Case study</p>
          <h1 className="mt-2 text-5xl font-black text-white">{p.title}</h1>
          <p className="mt-4 text-slate-300">{p.tagline}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {p.tags.map((t: { id: string; name: string; slug: string }) => (
              <Badge key={t.id}>{t.name}</Badge>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {p.githubUrl && <Button href={p.githubUrl} variant="secondary">GitHub</Button>}
            {p.liveUrl && <Button href={p.liveUrl} variant="secondary">Live site</Button>}
            {p.pdfUrl && <Button href={p.pdfUrl} variant="secondary">Case study PDF</Button>}
          </div>
        </Card>

        {p.coverImageUrl && (
          <Card className="overflow-hidden p-0">
            <img
              src={p.coverImageUrl}
              alt={p.title}
              className="h-full max-h-[420px] min-h-[260px] w-full rounded-3xl object-cover"
            />
          </Card>
        )}

        {!p.coverImageUrl && p.videos.length > 0 && (
          <VideoGallery items={p.videos} />
        )}
      </div>

      {p.coverImageUrl && p.videos.length > 0 && (
        <Card className="mt-6">
          <h2 className="mb-4 text-2xl font-black text-white">Project videos</h2>
          <VideoGallery items={p.videos} />
        </Card>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {p.story && (
          <Card>
            <h2 className="text-2xl font-black text-white">Engineering story</h2>
            <p className="mt-4 leading-8 text-slate-300">{p.story}</p>
          </Card>
        )}
        {p.challenge && (
          <Card>
            <h2 className="text-2xl font-black text-white">Challenge</h2>
            <p className="mt-4 leading-8 text-slate-300">{p.challenge}</p>
          </Card>
        )}
        {p.solution && (
          <Card>
            <h2 className="text-2xl font-black text-white">Solution</h2>
            <p className="mt-4 leading-8 text-slate-300">{p.solution}</p>
          </Card>
        )}
        {p.results && (
          <Card>
            <h2 className="text-2xl font-black text-white">Results</h2>
            <p className="mt-4 leading-8 text-slate-300">{p.results}</p>
          </Card>
        )}
      </div>

      {p.metrics && typeof p.metrics === 'object' && Object.keys(p.metrics).length > 0 && (
        <Card className="mt-6">
          <h2 className="text-2xl font-black text-white">Metrics</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {Object.entries(p.metrics as Record<string, string>).map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white/5 p-4">
                <p className="text-2xl font-black text-cyan-300">{value}</p>
                <p className="mt-1 text-sm text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {p.techStack.length > 0 && (
        <Card className="mt-6">
          <h2 className="text-2xl font-black text-white">Tech stack</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {p.techStack.map((s: { id: string; name: string; category: string }) => (
              <Badge key={s.id}>{s.name}</Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
