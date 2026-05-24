import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Card, Badge } from '@/components/ui/card';
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
  const p = await getPost(params.slug);
  if (!p) return notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-wrap gap-2">
        {p.tags.map((t: { id: string; name: string; slug: string }) => (
          <Badge key={t.id}>{t.name}</Badge>
        ))}
      </div>
      <h1 className="mt-4 text-5xl font-black text-white">{p.title}</h1>
      <p className="mt-4 text-xl text-slate-300">{p.excerpt}</p>

      {p.coverImageUrl && (
        <img src={p.coverImageUrl} alt={p.title} className="mt-8 max-h-[420px] w-full rounded-3xl object-cover" />
      )}

      {p.videos.length > 0 && (
        <div className="mt-8">
          <VideoGallery items={p.videos} />
        </div>
      )}

      <Card className="mt-8">
        <p className="leading-8 text-slate-300">{p.body}</p>
      </Card>
    </article>
  );
}
