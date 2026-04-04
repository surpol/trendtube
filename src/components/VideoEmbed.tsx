"use client";

import { embedSrc } from "@/lib/search-query";

type Props = {
  videoId: string | null;
  title?: string;
};

export function VideoEmbed({ videoId, title }: Props) {
  if (!videoId) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-white/15 bg-zinc-900/50 text-center text-sm text-zinc-500">
        Search or pick a video to play here
      </div>
    );
  }

  const src = embedSrc(videoId);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/40">
      <div className="aspect-video w-full">
        <iframe
          title={title ? `Playing: ${title}` : "YouTube video player"}
          src={src}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}
