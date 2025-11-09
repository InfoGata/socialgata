import React from "react";

type Props = {
  url: string;
  isVideo?: boolean;
  alt: string;
  className?: string;
};

const ExpandedMedia: React.FC<Props> = ({ url, isVideo, alt, className }) => {
  if (isVideo) {
    return (
      <video
        src={url}
        controls
        className={className}
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
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
