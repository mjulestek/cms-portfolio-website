import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Badge, Button, Card, MediaPlaceholder } from '@/components/ui/card';
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
  const project = await getProject(params.slug);
  if (!project) return notFound();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
        <Card className="flex min-h-[360px] flex-col justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">Case study</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">{project.title}</h1>
            <p className="mt-4 text-lg leading-8 text-slate-300">{project.tagline}</p>

            {project.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {project.tags.map(tag => (
                  <Badge key={tag.id}>{tag.name}</Badge>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {project.githubUrl && <Button href={project.githubUrl} variant="secondary">GitHub</Button>}
            {project.liveUrl && <Button href={project.liveUrl} variant="secondary">Live site</Button>}
            {project.pdfUrl && <Button href={project.pdfUrl} variant="secondary">Case study PDF</Button>}
          </div>
        </Card>

        <Card className="min-h-[360px] p-0">
          <div className="h-full min-h-[360px] overflow-hidden rounded-3xl bg-slate-950/40">
            {project.coverImageUrl ? (
              <img
                src={project.coverImageUrl}
                alt={project.title}
                className="h-full max-h-[520px] min-h-[360px] w-full object-cover"
              />
            ) : (
              <MediaPlaceholder label="Project cover image missing" />
            )}
          </div>
        </Card>
      </div>

      {project.videos.length > 0 && (
        <Card className="mt-6">
          <h2 className="mb-4 text-2xl font-black text-white">Project videos</h2>
          <VideoGallery items={project.videos} />
        </Card>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {project.story && (
          <Card>
            <h2 className="text-2xl font-black text-white">Engineering story</h2>
            <p className="mt-4 whitespace-pre-wrap leading-8 text-slate-300">{project.story}</p>
          </Card>
        )}
        {project.challenge && (
          <Card>
            <h2 className="text-2xl font-black text-white">Challenge</h2>
            <p className="mt-4 whitespace-pre-wrap leading-8 text-slate-300">{project.challenge}</p>
          </Card>
        )}
        {project.solution && (
          <Card>
            <h2 className="text-2xl font-black text-white">Solution</h2>
            <p className="mt-4 whitespace-pre-wrap leading-8 text-slate-300">{project.solution}</p>
          </Card>
        )}
        {project.results && (
          <Card>
            <h2 className="text-2xl font-black text-white">Results</h2>
            <p className="mt-4 whitespace-pre-wrap leading-8 text-slate-300">{project.results}</p>
          </Card>
        )}
      </div>

      {project.metrics && typeof project.metrics === 'object' && Object.keys(project.metrics).length > 0 && (
        <Card className="mt-6">
          <h2 className="text-2xl font-black text-white">Metrics</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(project.metrics as Record<string, string>).map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-black text-cyan-300">{value}</p>
                <p className="mt-1 text-sm text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {project.techStack.length > 0 && (
        <Card className="mt-6">
          <h2 className="text-2xl font-black text-white">Tech stack</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {project.techStack.map(skill => (
              <Badge key={skill.id}>{skill.name}</Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
