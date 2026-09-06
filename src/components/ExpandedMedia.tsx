import React from "react";
import { ChevronsDownUpIcon } from "lucide-react";
import { PostImage, VideoSource } from "@/plugintypes";
import VideoPlayer from "./VideoPlayer";
import PostGallery from "./PostGallery";

type Props = {
  url: string;
  isVideo?: boolean;
  videoSources?: VideoSource[];
  /** Images attached to the post. More than one renders as a gallery. */
  images?: PostImage[];
  alt: string;
  className?: string;
  thumbnailUrl?: string;
  toggleExpand?: () => void;
};

/**
 * Puts the media back to its thumbnail.
 *
 * A single image collapses by clicking it, but a gallery and a video both spend
 * a click on something else — changing slide, hitting play — so the only way
 * back has to be its own control. Kept visible rather than revealed on hover:
 * on a phone there is no hover, and this is the affordance that undoes the one
 * the reader just used.
 */
const CollapseButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Collapse media"
    className="absolute left-2 top-2 z-20 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-black/80"
  >
    <ChevronsDownUpIcon className="h-3.5 w-3.5" />
    Collapse
  </button>
);

const ExpandedMedia: React.FC<Props> = ({ url, isVideo, videoSources, images, alt, className, thumbnailUrl, toggleExpand }) => {
  // Plugins that predate `videoSources` only give us the bare url.
  const sources = React.useMemo(
    () =>
      videoSources?.length
        ? videoSources
        : isVideo && url
        ? [{ source: url }]
        : undefined,
    [videoSources, isVideo, url]
  );

  // Checked before `sources`: a post can carry both, and only `images` records
  // the order the author attached them. An imageboard post with a webm and a
  // png repeats the webm in `videoSources` for older builds, so honouring that
  // first would drop the png.
  //
  // Images carry their own click-to-expand, so `toggleExpand` doesn't apply to
  // the slides themselves — it only collapses the whole gallery, via the button.
  // `className` is deliberately not forwarded: it sizes an <img> (callers cap
  // the height), and the same cap on a carousel wrapper would clip a slide the
  // reader had just expanded to full resolution.
  if (images?.length) {
    return (
      <div className="relative mb-2">
        <PostGallery images={images} alt={alt} className="" />
        {toggleExpand && <CollapseButton onClick={toggleExpand} />}
      </div>
    );
  }

  if (sources) {
    return (
      <div className="relative">
        <VideoPlayer sources={sources} poster={thumbnailUrl} className={className} />
        {toggleExpand && <CollapseButton onClick={toggleExpand} />}
      </div>
    );
  }

  if (toggleExpand) {
    return (
      <button onClick={toggleExpand} className="cursor-zoom-out" aria-label="Collapse media">
        <img
          src={url}
          className={className}
          alt={alt}
        />
      </button>
    );
  }

  return (
    <img
      src={url}
      className={className}
      alt={alt}
    />
  );
};

export default ExpandedMedia;
