'use client';

import { useMemo, useState } from 'react';
import { YouTubeEmbed } from './youtube-embed';

type VideoItem = {
  video: {
    id: string;
    youtubeVideoId: string;
    title: string;
    thumbnailUrl: string;
    caption?: string | null;
  };
};

export function VideoGallery({ items }: { items: VideoItem[] }) {
  const firstVideo = items[0]?.video;
  const [activeId, setActiveId] = useState(firstVideo?.id ?? '');

  const active = useMemo(
    () => items.find(item => item.video.id === activeId)?.video ?? firstVideo,
    [activeId, firstVideo, items],
  );

  if (!active) return null;

  return (
    <section className="grid gap-4">
      <YouTubeEmbed videoId={active.youtubeVideoId} title={active.title} />
      {active.caption && <p className="text-sm text-slate-400">{active.caption}</p>}

      {items.length > 1 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ video }) => {
            const isActive = video.id === active.id;
            return (
              <button
                key={video.id}
                type="button"
                onClick={() => setActiveId(video.id)}
                className={`group rounded-2xl border p-3 text-left transition duration-200 ${
                  isActive
                    ? 'border-cyan-300/40 bg-cyan-300/10'
                    : 'border-white/10 bg-white/5 hover:border-cyan-300/30 hover:bg-white/[.08]'
                }`}
              >
                <div className="overflow-hidden rounded-xl bg-slate-950/50">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-24 w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="mt-3 line-clamp-2 text-sm font-bold text-white">{video.title}</p>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
