import Link from 'next/link';
import { Card, Badge } from '@/components/ui/card';
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
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-5xl font-black text-white">Infrastructure case studies</h1>
      {projects.length === 0 ? (
        <p className="mt-8 text-slate-400">No published projects yet.</p>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {projects.map(p => (
            <Link href={`/projects/${p.slug}`} key={p.id}>
              <Card className="h-full overflow-hidden">
                {p.coverImageUrl && (
                  <img
                    src={p.coverImageUrl}
                    alt={p.title}
                    className="mb-4 h-48 w-full rounded-2xl object-cover"
                  />
                )}
                <h2 className="text-2xl font-black text-white">{p.title}</h2>
                <p className="mt-2 text-slate-400">{p.tagline}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.tags.map((t: { id: string; name: string; slug: string }) => (
                    <Badge key={t.id}>{t.name}</Badge>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
