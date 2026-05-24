import Link from 'next/link';
import { Badge, Card, CardActionLabel, MediaPlaceholder } from '@/components/ui/card';
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
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">Blog</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Cloud engineering notes</h1>
        <p className="mt-4 text-slate-400">Notes, tutorials, debugging logs, and practical lessons from building real systems.</p>
      </div>

      {posts.length === 0 ? (
        <Card className="mt-8">
          <p className="text-slate-400">No published posts yet.</p>
        </Card>
      ) : (
        <div className="mt-8 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
          {posts.map(post => (
            <Link
              href={`/blog/${post.slug}`}
              key={post.id}
              className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
            >
              <Card className="flex h-full flex-col p-0 transition duration-300 group-hover:-translate-y-1 group-hover:border-cyan-300/30 group-hover:bg-white/[.07]">
                <div className="h-52 w-full overflow-hidden rounded-t-3xl bg-slate-950/40">
                  {post.coverImageUrl ? (
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <MediaPlaceholder label="Blog cover image missing" />
                  )}
                </div>

                <div className="flex flex-1 flex-col p-6">
                  {post.tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {post.tags.map(tag => (
                        <Badge key={tag.id}>{tag.name}</Badge>
                      ))}
                    </div>
                  )}
                  <h2 className="text-2xl font-black leading-tight text-white">{post.title}</h2>
                  <p className="mt-3 line-clamp-3 text-slate-400">{post.excerpt}</p>
                  <div className="mt-auto pt-6">
                    <CardActionLabel>Read article</CardActionLabel>
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
