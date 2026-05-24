export function YouTubeEmbed({ title, embedUrl }: { title: string; embedUrl: string }) {
  return (
    <div className="aspect-video overflow-hidden rounded-3xl border border-neutral-300 bg-neutral-100">
      <iframe className="h-full w-full" src={embedUrl} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
    </div>
  );
}
