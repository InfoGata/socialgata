import { MessageSquareIcon, ExternalLinkIcon, PlayIcon } from "lucide-react";

type ImageThumbnailProps = {
  url?: string;
  thumbnailUrl?: string;
  isVideo?: boolean;
  toggleExpand: () => void;
}

const imageRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|bmp|webp|svg|ico|tiff|tif|raw|heic|heif|avif))/i;

function isImageUrl(url: string | undefined) {
  if (!url) return false;
  return imageRegex.test(url);
}


const ImageThumbnail: React.FC<ImageThumbnailProps> = (props) => {
  const { url, thumbnailUrl, isVideo, toggleExpand } = props;

  // A video's url points at a player page, not a file, so it must expand
  // in place rather than fall through to the open-in-new-tab branch below.
  if (isVideo && (thumbnailUrl || url)) {
    return (
      <button onClick={toggleExpand} className="relative cursor-pointer block w-full h-full">
        <img alt="video thumbnail" loading="lazy" src={thumbnailUrl ?? url} className="rounded-md w-full h-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-black/60 p-1.5">
            <PlayIcon className="h-4 w-4 text-white fill-white" />
          </span>
        </span>
      </button>
    );
  }

  if (isImageUrl(url)) {
    return (
      <button onClick={toggleExpand} className="cursor-pointer">
        {thumbnailUrl ? (
          <img alt="thumbnail" loading="lazy" src={thumbnailUrl} className="rounded-md" />
        ) : (
          <img alt="image url" loading="lazy" src={url} className="rounded-md" />
        )}
      </button>
    );
  }

  if (thumbnailUrl) {
    return (
      <a href={url} target="_blank">
        <img alt="thumbnail url" loading="lazy" src={thumbnailUrl} className="rounded-md" />
      </a>
    );
  }

  if (url) {
    return (
      <a href={url} target="_blank" className="flex items-center justify-center w-full h-full">
        <ExternalLinkIcon className="w-full h-full p-2" />
      </a>
    );
  }

  return <MessageSquareIcon className="w-full h-full p-2" />;
};

export default ImageThumbnail;
