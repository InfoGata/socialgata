import React from "react";
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

  if (sources) {
    return (
      <VideoPlayer sources={sources} poster={thumbnailUrl} className={className} />
    );
  }

  // Images carry their own click-to-expand, so `toggleExpand` doesn't apply.
  // `className` is deliberately not forwarded: it sizes an <img> (callers cap
  // the height), and the same cap on a carousel wrapper would clip a slide the
  // reader had just expanded to full resolution.
  if (images?.length) {
    return <PostGallery images={images} alt={alt} className="mb-2" />;
  }

  if (toggleExpand) {
    return (
      <button onClick={toggleExpand} className="cursor-pointer">
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
