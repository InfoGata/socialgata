import React from "react";
import { VideoSource } from "@/plugintypes";
import VideoPlayer from "./VideoPlayer";

type Props = {
  url: string;
  isVideo?: boolean;
  videoSources?: VideoSource[];
  alt: string;
  className?: string;
  thumbnailUrl?: string;
  toggleExpand?: () => void;
};

const ExpandedMedia: React.FC<Props> = ({ url, isVideo, videoSources, alt, className, thumbnailUrl, toggleExpand }) => {
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
