import Link from 'next/link';
import { Card, Badge } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { mapBlog, resolveBlogReferences } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

async function getPosts() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    });
    const resolvedPosts = await resolveBlogReferences(posts);
    return resolvedPosts.map(mapBlog);
  } catch (error) {
    console.error('Failed to load blog posts', error);
    return [];
  }
}

export default async function Blog() {
  const posts = await getPosts();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-5xl font-black text-white">Cloud engineering notes</h1>
      {posts.length === 0 ? (
        <p className="mt-8 text-slate-400">No published posts yet.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {posts.map(p => (
            <Card key={p.id}>
              {p.coverImageUrl && (
                <img src={p.coverImageUrl} alt={p.title} className="mb-4 h-52 w-full rounded-2xl object-cover" />
              )}
              <div className="flex flex-wrap gap-2">
                {p.tags.map((t: { id: string; name: string; slug: string }) => (
                  <Badge key={t.id}>{t.name}</Badge>
                ))}
              </div>
              <h2 className="mt-4 text-2xl font-black text-white">{p.title}</h2>
              <p className="mt-2 text-slate-400">{p.excerpt}</p>
              <Link className="mt-4 inline-flex text-cyan-200 hover:text-cyan-300" href={`/blog/${p.slug}`}>
                Read article →
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
