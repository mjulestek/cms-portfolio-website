'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { MappedBlog, MappedBlogCategory } from '@/lib/mappers';

function Arrow() {
  return <span aria-hidden="true" className="ml-2 inline-block transition group-hover:translate-x-1">›</span>;
}

function ImageBox({ src, alt, className = '' }: { src?: string | null; alt: string; className?: string }) {
  return (
    <div className={`flex overflow-hidden bg-neutral-200 ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0" />
      ) : (
        <div className="flex h-full min-h-[10rem] w-full items-center justify-center text-neutral-400">
          <svg className="h-14 w-14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 16l4-4a2 2 0 0 1 3 0l2 2 1-1a2 2 0 0 1 3 0l5 5"/><path d="M3 5h18v14H3z"/><circle cx="8" cy="9" r="1.5"/></svg>
        </div>
      )}
    </div>
  );
}

function SectionIntro({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-bold tracking-tight text-black">{eyebrow}</p>
      <h2 className="mt-6 text-4xl font-black leading-[1.05] tracking-[0.08em] text-black sm:text-5xl lg:text-6xl">{title}</h2>
      <p className="mt-7 text-xl leading-8 text-black/80">{subtitle}</p>
    </div>
  );
}

export function WritingSection({
  posts,
  categories,
  eyebrow,
  title,
  subtitle,
}: {
  posts: MappedBlog[];
  categories: MappedBlogCategory[];
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  const [activeCategory, setActiveCategory] = useState('all');

  const visiblePosts = useMemo(() => {
    if (activeCategory === 'all') return posts;
    return posts.filter(post => post.category?.slug === activeCategory);
  }, [activeCategory, posts]);

  if (posts.length === 0) return null;

  return (
    <section className="px-6 py-28 sm:px-10 lg:px-20">
      <SectionIntro eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className="mt-16 flex flex-wrap justify-center gap-4 sm:gap-6">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={activeCategory === 'all' ? 'border border-black px-7 py-3' : 'px-2 py-3 text-black'}
        >
          View all
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.slug)}
            className={activeCategory === category.slug ? 'border border-black px-7 py-3' : 'px-2 py-3 text-black'}
          >
            {category.name}
          </button>
        ))}
      </div>
      <div className="mt-20 grid gap-x-14 gap-y-16 lg:grid-cols-2">
        {visiblePosts.map(post => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="group grid gap-8 md:grid-cols-[minmax(220px,360px)_1fr]">
            <ImageBox src={post.coverImageUrl} alt={post.title} className="h-64" />
            <div className="flex min-h-64 flex-col justify-center">
              <div className="flex flex-wrap items-center gap-6 text-sm font-bold">
                {post.category && <span className="bg-neutral-100 px-3 py-2">{post.category.name}</span>}
                <span>{post.readTime ?? '6 min read'}</span>
              </div>
              <h3 className="mt-6 text-3xl font-black leading-tight text-black">{post.title}</h3>
              <p className="mt-5 text-xl leading-8 text-black/80">{post.excerpt}</p>
              <span className="mt-auto pt-8 text-lg font-medium text-black">{post.ctaLabel ?? 'Read more'}<Arrow /></span>
            </div>
          </Link>
        ))}
      </div>
      {visiblePosts.length === 0 && (
        <p className="mt-16 text-center text-lg text-black/60">No posts in this category yet.</p>
      )}
    </section>
  );
}
