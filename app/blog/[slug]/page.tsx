import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Badge, Card, MediaPlaceholder } from '@/components/ui/card';
import { VideoGallery } from '@/components/videos/video-gallery';
import { prisma } from '@/lib/prisma';
import { mapBlog, resolveBlogReferences } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

async function getPost(slug: string) {
  try {
    const post = await prisma.blogPost.findFirst({ where: { slug, status: 'PUBLISHED' } });
    if (!post) return null;
    const [resolvedPost] = await resolveBlogReferences([post]);
    return mapBlog(resolvedPost);
  } catch (error) {
    console.error(`Failed to load blog post ${slug}`, error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

export default async function BlogDetail({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) return notFound();

  return (
    <article className="bg-[#f8f7f3] text-neutral-950">
      <header className="app-container py-12 sm:py-16 lg:py-20">
        <Link href="/blog" className="text-sm font-black underline underline-offset-4">← Back to blog</Link>
        <div className="mt-8 flex flex-wrap gap-3">
          {post.category && <Badge>{post.category.name}</Badge>}
          <Badge>{post.readTime ?? '6 min read'}</Badge>
          {post.publishedAt && <Badge>{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(post.publishedAt)}</Badge>}
        </div>
        <h1 className="mt-6 max-w-5xl text-5xl font-black leading-none tracking-tight sm:text-6xl lg:text-7xl">{post.title}</h1>
        <p className="mt-6 max-w-3xl text-xl leading-9 text-neutral-700">{post.excerpt}</p>
      </header>
      <div className="app-container">
        <div className="max-h-[560px] overflow-hidden border border-neutral-300 bg-neutral-100">
          {post.coverImageUrl ? <img src={post.coverImageUrl} alt={post.title} className="w-full object-cover grayscale" /> : <MediaPlaceholder label="Article image" />}
        </div>
      </div>
      <section className="app-container max-w-4xl py-12 lg:py-16">
        {post.videos.length > 0 && <Card className="mb-8"><h2 className="text-2xl font-black">Related videos</h2><div className="mt-5"><VideoGallery items={post.videos} /></div></Card>}
        <Card>
          <div className="whitespace-pre-wrap text-lg leading-9 text-neutral-800">{post.body}</div>
        </Card>
      </section>
    </article>
  );
}
