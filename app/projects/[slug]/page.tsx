import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Badge, Button, Card, MediaPlaceholder } from '@/components/ui/card';
import { VideoGallery } from '@/components/videos/video-gallery';
import { prisma } from '@/lib/prisma';
import { mapProject, resolveProjectReferences } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

async function getProject(slug: string) {
  try {
    const project = await prisma.project.findFirst({ where: { slug, status: 'PUBLISHED' } });
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
    <article className="bg-[#f8f7f3] text-neutral-950">
      <section className="app-container py-12 sm:py-16 lg:py-20">
        <Link href="/projects" className="text-sm font-black underline underline-offset-4">← Back to projects</Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-stretch">
          <div className="flex flex-col justify-between border border-neutral-300 bg-white p-8 sm:p-10">
            <div>
              <p className="eyebrow">Case study</p>
              <h1 className="mt-5 text-5xl font-black leading-none tracking-tight sm:text-6xl">{project.title}</h1>
              <p className="mt-6 text-xl leading-9 text-neutral-700">{project.tagline}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {project.tags.map(tag => <Badge key={tag.id}>{tag.name}</Badge>)}
                <Badge>{project.readTime ?? '8 min read'}</Badge>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              {project.githubUrl && <Button href={project.githubUrl} variant="secondary">GitHub</Button>}
              {project.liveUrl && <Button href={project.liveUrl} variant="secondary">Live site</Button>}
              {project.pdfUrl && <Button href={project.pdfUrl} variant="secondary">Case study PDF</Button>}
            </div>
          </div>
          <div className="min-h-[360px] overflow-hidden border border-neutral-300 bg-neutral-100">
            {project.coverImageUrl ? <img src={project.coverImageUrl} alt={project.title} className="h-full max-h-[620px] min-h-[360px] w-full object-cover grayscale" /> : <MediaPlaceholder label="Project cover image" />}
          </div>
        </div>
      </section>

      <section className="app-container pb-20 lg:pb-28">
        {project.videos.length > 0 && (
          <Card className="mb-8">
            <h2 className="text-2xl font-black">Project videos</h2>
            <div className="mt-5"><VideoGallery items={project.videos} /></div>
          </Card>
        )}
        <div className="grid gap-8 lg:grid-cols-2">
          {[
            ['Engineering story', project.story],
            ['Challenge', project.challenge],
            ['Solution', project.solution],
            ['Results', project.results],
          ].filter(([, value]) => Boolean(value)).map(([label, value]) => (
            <Card key={label}>
              <h2 className="text-2xl font-black">{label}</h2>
              <p className="mt-4 whitespace-pre-wrap text-lg leading-8 text-neutral-700">{value}</p>
            </Card>
          ))}
        </div>
        {project.metrics && typeof project.metrics === 'object' && Object.keys(project.metrics).length > 0 && (
          <Card className="mt-8">
            <h2 className="text-2xl font-black">Metrics</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(project.metrics as Record<string, string>).map(([label, value]) => (
                <div key={label} className="border border-neutral-300 bg-neutral-50 p-5">
                  <p className="text-3xl font-black">{value}</p>
                  <p className="mt-1 text-sm font-bold text-neutral-600">{label}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
        {project.techStack.length > 0 && (
          <Card className="mt-8">
            <h2 className="text-2xl font-black">Tech stack</h2>
            <div className="mt-5 flex flex-wrap gap-3">{project.techStack.map(skill => <Badge key={skill.id}>{skill.name}</Badge>)}</div>
          </Card>
        )}
      </section>
    </article>
  );
}
