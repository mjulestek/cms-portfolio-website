import { YouTubeEmbed } from '@/components/videos/youtube-embed';
import type { MappedVideo } from '@/lib/mappers';

export function VideoGallery({ items }: { items: Array<{ video: MappedVideo }> }) {
  if (!items.length) return null;
  const [featured, ...rest] = items;
  return (
    <div className="grid gap-4">
      <YouTubeEmbed title={featured.video.title} embedUrl={featured.video.embedUrl} />
      {rest.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map(item => (
            <div key={item.video.id} className="rounded-2xl border border-neutral-300 bg-white p-3">
              {item.video.thumbnailUrl ? <img src={item.video.thumbnailUrl} alt={item.video.title} className="h-32 w-full rounded-xl object-cover grayscale" /> : null}
              <p className="mt-3 text-sm font-black text-neutral-950">{item.video.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
