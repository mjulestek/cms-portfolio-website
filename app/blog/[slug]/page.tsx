import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Badge, Card, MediaPlaceholder } from '@/components/ui/card';
import { VideoGallery } from '@/components/videos/video-gallery';
import { prisma } from '@/lib/prisma';
import { mapBlog, resolveBlogReferences } from '@/lib/mappers';

export const dynamic = 'force-dynamic';

async function getPost(slug: string) {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug, status: 'PUBLISHED' },
    });
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
    <article className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.tags.map(tag => (
            <Badge key={tag.id}>{tag.name}</Badge>
          ))}
        </div>
      )}
      <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">{post.title}</h1>
      <p className="mt-4 text-xl leading-8 text-slate-300">{post.excerpt}</p>

      <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40">
        {post.coverImageUrl ? (
          <img src={post.coverImageUrl} alt={post.title} className="max-h-[480px] w-full object-cover" />
        ) : (
          <MediaPlaceholder label="Blog cover image missing" />
        )}
      </div>

      {post.videos.length > 0 && (
        <Card className="mt-8">
          <h2 className="mb-4 text-2xl font-black text-white">Related videos</h2>
          <VideoGallery items={post.videos} />
        </Card>
      )}

      <Card className="mt-8">
        <div className="whitespace-pre-wrap leading-8 text-slate-300">{post.body}</div>
      </Card>
    </article>
  );
}
