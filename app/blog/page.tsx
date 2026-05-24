import Link from 'next/link';
import { Badge, Card, EmptyState, MediaPlaceholder, PageHeader } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { mapBlog, resolveBlogReferences } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

async function getPosts() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ homepageOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
    });
    const resolvedPosts = await resolveBlogReferences(posts);
    return resolvedPosts.map(mapBlog);
  } catch (error) {
    console.error('Failed to load blog posts', error);
    return [];
  }
}

function Arrow() { return <span aria-hidden="true" className="ml-2 transition group-hover:translate-x-1">›</span>; }

export default async function Blog() {
  const posts = await getPosts();

  return (
    <div className="bg-[#f8f7f3] text-neutral-950">
      <PageHeader eyebrow="Writing" title="Knowledge worth sharing" subtitle="Technical insights from the field: practical notes on cloud systems, automation, observability, and deployment work." />
      <section className="app-container pb-20 lg:pb-28">
        {posts.length === 0 ? (
          <EmptyState title="No published posts yet" message="Publish blog posts from the admin dashboard to show them here." />
        ) : (
          <div className="grid gap-x-12 gap-y-14 lg:grid-cols-2">
            {posts.map(post => (
              <Link href={`/blog/${post.slug}`} key={post.id} className="group grid gap-8 focus-ring sm:grid-cols-[minmax(12rem,20rem)_1fr]">
                <div className="h-60 bg-neutral-100 sm:h-full">
                  {post.coverImageUrl ? <img src={post.coverImageUrl} alt={post.title} className="h-full w-full object-cover grayscale transition duration-500 group-hover:grayscale-0" /> : <MediaPlaceholder label="Article image" />}
                </div>
                <div className="flex min-h-60 flex-col py-2">
                  <div className="flex flex-wrap gap-3">
                    {post.category && <Badge>{post.category.name}</Badge>}
                    <Badge>{post.readTime ?? '6 min read'}</Badge>
                  </div>
                  <h2 className="mt-5 text-3xl font-black leading-tight">{post.title}</h2>
                  <p className="mt-4 line-clamp-3 text-lg leading-8 text-neutral-700">{post.excerpt}</p>
                  <span className="mt-auto pt-7 text-base font-black">{post.ctaLabel ?? 'Read more'}<Arrow /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
