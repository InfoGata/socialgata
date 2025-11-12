import React from "react";

type Props = {
  url: string;
  isVideo?: boolean;
  alt: string;
  className?: string;
  thumbnailUrl?: string;
  toggleExpand?: () => void;
};

const ExpandedMedia: React.FC<Props> = ({ url, isVideo, alt, className, thumbnailUrl, toggleExpand }) => {
  if (isVideo) {
    return (
      <video
        src={url}
        controls
        className={className}
        preload="metadata"
        poster={thumbnailUrl}
      >
        Your browser does not support the video tag.
      </video>
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
