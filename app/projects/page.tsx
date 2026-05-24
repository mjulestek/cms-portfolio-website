import Link from 'next/link';
import { Badge, Card, CardActionLabel, MediaPlaceholder } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { mapProject, resolveProjectReferences } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

async function getProjects() {
  try {
    const projects = await prisma.project.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
    });
    const resolvedProjects = await resolveProjectReferences(projects);
    return resolvedProjects.map(mapProject);
  } catch (error) {
    console.error('Failed to load projects', error);
    return [];
  }
}

export default async function Projects() {
  const projects = await getProjects();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">Case studies</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Infrastructure case studies</h1>
        <p className="mt-4 text-slate-400">Production-style projects, cloud workflows, dashboards, deployment systems, and full-stack CMS work.</p>
      </div>

      {projects.length === 0 ? (
        <Card className="mt-8">
          <p className="text-slate-400">No published projects yet.</p>
        </Card>
      ) : (
        <div className="mt-8 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <Link
              href={`/projects/${project.slug}`}
              key={project.id}
              className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
            >
              <Card className="flex h-full flex-col p-0 transition duration-300 group-hover:-translate-y-1 group-hover:border-cyan-300/30 group-hover:bg-white/[.07]">
                <div className="h-56 w-full overflow-hidden rounded-t-3xl bg-slate-950/40">
                  {project.coverImageUrl ? (
                    <img
                      src={project.coverImageUrl}
                      alt={project.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <MediaPlaceholder label="Project image missing" />
                  )}
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h2 className="text-2xl font-black leading-tight text-white">{project.title}</h2>
                  <p className="mt-3 line-clamp-3 text-slate-400">{project.tagline}</p>

                  {project.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.tags.map(tag => (
                        <Badge key={tag.id}>{tag.name}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto pt-6">
                    <CardActionLabel>Read case study</CardActionLabel>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
