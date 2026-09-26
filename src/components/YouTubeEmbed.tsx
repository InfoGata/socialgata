import React from "react";
import { YouTubeEmbed as Embed, youTubeEmbedSrc } from "@/lib/embeds";

type Props = {
  embed: Embed;
  title: string;
  autoPlay?: boolean;
};

const YouTubeEmbed: React.FC<Props> = ({ embed, title, autoPlay }) => (
  <iframe
    src={youTubeEmbedSrc(embed, { autoplay: autoPlay })}
    title={title}
    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
    allowFullScreen
    loading="lazy"
    // index.html sends no Referer anywhere (4chan 403s on one), and YouTube
    // refuses to play without one — error 153. This overrides that for the
    // player alone.
    referrerPolicy="strict-origin-when-cross-origin"
    className={`mx-auto mb-2 block rounded-lg border-0 ${
      embed.isShort
        ? "aspect-9/16 h-[70vh] max-w-full"
        : "aspect-video w-full max-w-3xl"
    }`}
  />
);

export default YouTubeEmbed;
