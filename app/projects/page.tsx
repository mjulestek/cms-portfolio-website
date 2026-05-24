import Link from 'next/link';
import { Badge, Card, EmptyState, MediaPlaceholder, PageHeader } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { mapProject, resolveProjectReferences } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

async function getProjects() {
  try {
    const projects = await prisma.project.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ homepageOrder: 'asc' }, { featured: 'desc' }, { createdAt: 'desc' }],
    });
    const resolvedProjects = await resolveProjectReferences(projects);
    return resolvedProjects.map(mapProject);
  } catch (error) {
    console.error('Failed to load projects', error);
    return [];
  }
}

function Arrow() { return <span aria-hidden="true" className="ml-2 transition group-hover:translate-x-1">›</span>; }

export default async function Projects() {
  const projects = await getProjects();
  const [featured, ...rest] = projects;

  return (
    <div className="bg-[#f8f7f3] text-neutral-950">
      <PageHeader eyebrow="Projects" title="Work that scales" subtitle="Infrastructure built for production demands — case studies, CMS builds, cloud delivery, and deployment systems." />
      <section className="app-container pb-20 lg:pb-28">
        {projects.length === 0 ? (
          <EmptyState title="No published projects yet" message="Publish projects from the admin dashboard to show them here." />
        ) : (
          <div className="grid gap-10">
            {featured && (
              <Link href={`/projects/${featured.slug}`} className="group block focus-ring">
                <Card className="grid gap-8 p-0 md:grid-cols-[1.15fr_.85fr]">
                  <div className="h-80 bg-neutral-100 md:h-full">
                    {featured.coverImageUrl ? <img src={featured.coverImageUrl} alt={featured.title} className="h-full w-full object-cover grayscale transition duration-500 group-hover:grayscale-0" /> : <MediaPlaceholder label="Project image" />}
                  </div>
                  <div className="flex min-h-[26rem] flex-col p-8 sm:p-10">
                    <div className="flex flex-wrap gap-3">
                      {(featured.tags[0]?.name || 'Case study') && <Badge>{featured.tags[0]?.name ?? 'Case study'}</Badge>}
                      <Badge>{featured.readTime ?? '8 min read'}</Badge>
                    </div>
                    <h2 className="mt-8 text-4xl font-black leading-tight tracking-tight sm:text-5xl">{featured.title}</h2>
                    <p className="mt-5 text-lg leading-8 text-neutral-700">{featured.tagline}</p>
                    <span className="mt-auto pt-10 text-base font-black">{featured.ctaLabel ?? 'View case'}<Arrow /></span>
                  </div>
                </Card>
              </Link>
            )}
            {rest.length > 0 && (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {rest.map(project => (
                  <Link key={project.id} href={`/projects/${project.slug}`} className="group block h-full focus-ring">
                    <Card className="flex h-full flex-col p-0 transition duration-300 group-hover:-translate-y-1 group-hover:border-neutral-950">
                      <div className="h-56 bg-neutral-100">
                        {project.coverImageUrl ? <img src={project.coverImageUrl} alt={project.title} className="h-full w-full object-cover grayscale transition duration-500 group-hover:grayscale-0" /> : <MediaPlaceholder label="Project image" />}
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <div className="flex flex-wrap gap-3">
                          <Badge>{project.tags[0]?.name ?? 'Case study'}</Badge>
                          <Badge>{project.readTime ?? '8 min read'}</Badge>
                        </div>
                        <h2 className="mt-5 text-2xl font-black leading-tight">{project.title}</h2>
                        <p className="mt-3 line-clamp-3 text-neutral-600">{project.tagline}</p>
                        <span className="mt-auto pt-8 text-sm font-black">{project.ctaLabel ?? 'View case'}<Arrow /></span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
