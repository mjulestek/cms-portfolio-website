'use client';
import { useState } from 'react';
import { YouTubeEmbed } from './youtube-embed';
export function VideoGallery({items}:{items:{video:{id:string;youtubeVideoId:string;title:string;thumbnailUrl:string;caption?:string|null}}[]}){ const [active,setActive]=useState(items[0]?.video); if(!active) return null; return <section className="space-y-4"><YouTubeEmbed videoId={active.youtubeVideoId} title={active.title}/><div className="grid gap-3 md:grid-cols-3">{items.map(({video})=><button key={video.id} onClick={()=>setActive(video)} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-left"><img src={video.thumbnailUrl} alt={video.title} className="mb-3 h-28 w-full rounded-xl object-cover"/><p className="font-bold text-white">{video.title}</p></button>)}</div></section> }
