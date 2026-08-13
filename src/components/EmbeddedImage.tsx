import { ExternalLinkIcon } from "lucide-react";
import type { DOMNode } from "html-react-parser";
import React from "react";

type Props = {
  src: string;
  /** Full resolution, swapped in when the reader expands. */
  full?: string;
  /** Tried when `src` fails to load (giphy serves webp and gif of the same id). */
  fallback?: string;
  /** Rendered as a plain link when no image source loads at all. */
  link?: string;
  alt?: string;
  width?: number;
  height?: number;
};

/** Tallest an unexpanded inline image gets, so a thread stays scannable. */
const MAX_COLLAPSED_HEIGHT = 400;
const COLLAPSED = "max-h-[400px]";

/** Held open for an image whose dimensions the plugin couldn't tell us. */
const UNKNOWN_SIZE_HEIGHT = 200;

/**
 * Height to hold open until the image arrives.
 *
 * Capping the height means the image needs `width: auto` to avoid being
 * squashed, and an `<img>` that is auto on both axes has no size at all before
 * it loads — a comment whose whole body is an image would render as an empty
 * row and then shove the thread down when the bytes land. Reserving the space
 * up front is what stops that.
 */
const reservedHeight = (width?: number, height?: number) =>
  width && height
    ? Math.min(MAX_COLLAPSED_HEIGHT, height)
    : UNKNOWN_SIZE_HEIGHT;

/**
 * An image embedded in a post or comment body. Renders inline at its natural
 * width with the height capped; clicking swaps in the full-resolution source
 * and drops the cap.
 *
 * Sources can be wrong in ways the plugin can't check — a giphy url is derived
 * from an id rather than given, and reddit media can be deleted out from under
 * a comment — so a failure walks down to the next source and finally to the
 * plain link, rather than leaving a broken-image icon in the thread.
 */
const EmbeddedImage: React.FC<Props> = ({
  src,
  full,
  fallback,
  link,
  alt,
  width,
  height,
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const [useFallback, setUseFallback] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  if (failed) {
    return link ? (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {link}
      </a>
    ) : null;
  }

  const base = useFallback && fallback ? fallback : src;
  const showFull = expanded && !!full;

  const handleError = () => {
    // The full-size source failing shouldn't lose the image we already had.
    if (showFull) setExpanded(false);
    else if (fallback && !useFallback) setUseFallback(true);
    else {
      setFailed(true);
      setLoaded(true);
    }
  };

  return (
    // A span, not a div: this lands inside the <p> the plugin left in place.
    <span
      className="relative my-2 block w-fit max-w-full group/media"
      style={
        loaded ? undefined : { minHeight: reservedHeight(width, height) }
      }
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? "Collapse image" : "Expand image"}
        aria-expanded={expanded}
        className={`block max-w-full ${expanded ? "cursor-zoom-out" : "cursor-zoom-in"}`}
      >
        <img
          src={showFull ? full : base}
          alt={alt || ""}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          // width/height reserve the box; `w-auto h-auto` keeps the intrinsic
          // ratio while both caps apply.
          className={`h-auto w-auto max-w-full rounded-md border ${expanded ? "" : COLLAPSED}`}
          onLoad={() => setLoaded(true)}
          onError={handleError}
        />
      </button>
      <a
        href={full ?? base}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute right-1 top-1 rounded bg-black/60 p-1 opacity-0 transition-opacity focus:opacity-100 group-hover/media:opacity-100"
        aria-label="Open original"
      >
        <ExternalLinkIcon className="h-3.5 w-3.5 text-white" />
      </a>
    </span>
  );
};

const HTTP_URL = /^https?:\/\//i;

/**
 * DOMPurify's default config allows `data:` image sources, which a body has no
 * legitimate reason to use. Anything that isn't plain http(s) is dropped.
 */
const httpOnly = (value?: string) =>
  value && HTTP_URL.test(value) ? value : undefined;

const toInt = (value?: string) => {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Mastodon renders custom emoji as `<img class="emoji">` and some plugins ship
 * small inline icons. Those have to stay inline glyphs rather than become
 * expandable blocks.
 */
const isInlineGlyph = (attribs: Record<string, string>) =>
  (attribs.class || "").split(/\s+/).includes("emoji") ||
  (toInt(attribs.width) ?? Infinity) <= 48;

/**
 * Parse-options hook that upgrades an `<img>` in body html to {@link EmbeddedImage}.
 * Shared by every body surface, so any plugin emitting inline images gets the
 * same size cap, lazy loading and click-to-expand.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const replaceEmbeddedMedia = (
  domNode: DOMNode,
): React.ReactElement | undefined => {
  if (domNode.type !== "tag" || domNode.name !== "img") return undefined;

  const attribs = domNode.attribs || {};
  const src = httpOnly(attribs.src);
  if (!src) return undefined;
  // `data-sg-media` marks a deliberate embed, so it always wins over the
  // heuristic — a plugin can embed something small on purpose.
  if (!attribs["data-sg-media"] && isInlineGlyph(attribs)) return undefined;

  return (
    <EmbeddedImage
      src={src}
      full={httpOnly(attribs["data-sg-full"])}
      fallback={httpOnly(attribs["data-sg-fallback"])}
      link={httpOnly(attribs["data-sg-link"])}
      alt={attribs.alt}
      width={toInt(attribs.width)}
      height={toInt(attribs.height)}
    />
  );
};

export default EmbeddedImage;
