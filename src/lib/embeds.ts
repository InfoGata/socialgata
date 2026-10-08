export type YouTubeEmbed = {
  id: string;
  /** Seconds into the video, from a `t=` or `start=` on the link. */
  start?: number;
  /** Shorts are portrait, so the player needs a different box. */
  isShort: boolean;
};

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

// Path forms that carry the id as their second segment.
const ID_PATHS = new Set(["shorts", "embed", "live", "v"]);

/** Accepts `90`, `90s` and `1h2m3s`. */
function parseStart(value: string | null): number | undefined {
  if (!value) return undefined;
  if (/^\d+$/.test(value)) return Number(value) || undefined;
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
  if (!match || !match[0]) return undefined;
  const [, h, m, s] = match;
  const seconds = Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
  return seconds || undefined;
}

/**
 * The YouTube video a link points at, if it is one. Worked out from the url
 * alone so every plugin that links to YouTube gets a player, without each one
 * having to report the embed itself.
 */
export function getYouTubeEmbed(url?: string): YouTubeEmbed | undefined {
  if (!url) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return undefined;

  const host = parsed.hostname.toLowerCase();
  const segments = parsed.pathname.split("/").filter(Boolean);
  let id: string | undefined;
  let isShort = false;

  if (host === "youtu.be") {
    id = segments[0];
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (segments[0] === "watch") {
      id = parsed.searchParams.get("v") ?? undefined;
    } else if (segments[0] && ID_PATHS.has(segments[0])) {
      id = segments[1];
      isShort = segments[0] === "shorts";
    }
  }

  if (!id || !VIDEO_ID.test(id)) return undefined;
  const start = parseStart(parsed.searchParams.get("t") ?? parsed.searchParams.get("start"));
  return { id, isShort, ...(start ? { start } : {}) };
}

/**
 * The no-cookie host: nothing is set on the reader until they press play,
 * and a feed can hold dozens of these.
 */
export function youTubeEmbedSrc(embed: YouTubeEmbed, options: { autoplay?: boolean } = {}): string {
  const params = new URLSearchParams({ playsinline: "1" });
  if (embed.start) params.set("start", String(embed.start));
  if (options.autoplay) params.set("autoplay", "1");
  return `https://www.youtube-nocookie.com/embed/${embed.id}?${params}`;
}

/** For plugins that link a video without giving a preview image. */
export function youTubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export type StreamableEmbed = { id: string };

const STREAMABLE_HOSTS = new Set(["streamable.com", "www.streamable.com"]);

// Shortcodes are short and lowercase; older ones have as few as four characters.
const STREAMABLE_ID = /^[a-z0-9]{4,12}$/i;

// Player forms, which carry the shortcode as their second segment.
const STREAMABLE_ID_PATHS = new Set(["e", "o", "s"]);

// Site pages that would otherwise pass for a shortcode.
const STREAMABLE_PAGES = new Set([
  "about",
  "blog",
  "careers",
  "contact",
  "documentation",
  "enterprise",
  "login",
  "pricing",
  "privacy",
  "settings",
  "signup",
  "terms",
  "upload",
  "videos",
]);

/** The Streamable video a link points at, if it is one; see {@link getYouTubeEmbed}. */
export function getStreamableEmbed(url?: string): StreamableEmbed | undefined {
  if (!url) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return undefined;
  if (!STREAMABLE_HOSTS.has(parsed.hostname.toLowerCase())) return undefined;

  const segments = parsed.pathname.split("/").filter(Boolean);
  const id = segments[0] && STREAMABLE_ID_PATHS.has(segments[0]) ? segments[1] : segments[0];
  if (!id || !STREAMABLE_ID.test(id) || STREAMABLE_PAGES.has(id.toLowerCase())) return undefined;
  return { id };
}

/** The player Streamable's own oEmbed hands out. */
export function streamableEmbedSrc(embed: StreamableEmbed, options: { autoplay?: boolean } = {}): string {
  const params = new URLSearchParams();
  if (options.autoplay) params.set("autoplay", "1");
  const query = params.size ? `?${params}` : "";
  return `https://streamable.com/o/${embed.id}${query}`;
}

/**
 * Streamable's poster for a video. Unlike YouTube's it isn't guaranteed: very
 * old videos and removed ones 403, so the image needs somewhere to fall back to.
 */
export function streamableThumbnail(id: string): string {
  return `https://cdn-cf-east.streamable.com/image/${id}.jpg`;
}

/** A video from another site that plays in an iframe of that site's player. */
export type VideoEmbed =
  | ({ provider: "youtube" } & YouTubeEmbed)
  | ({ provider: "streamable" } & StreamableEmbed);

export function getVideoEmbed(url?: string): VideoEmbed | undefined {
  const youTube = getYouTubeEmbed(url);
  if (youTube) return { provider: "youtube", ...youTube };
  const streamable = getStreamableEmbed(url);
  if (streamable) return { provider: "streamable", ...streamable };
  return undefined;
}

export function videoEmbedSrc(embed: VideoEmbed, options: { autoplay?: boolean } = {}): string {
  return embed.provider === "youtube"
    ? youTubeEmbedSrc(embed, options)
    : streamableEmbedSrc(embed, options);
}

export function videoEmbedThumbnail(embed: VideoEmbed): string {
  return embed.provider === "youtube" ? youTubeThumbnail(embed.id) : streamableThumbnail(embed.id);
}
