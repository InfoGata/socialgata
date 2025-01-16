import { MessageSquareIcon, ExternalLinkIcon } from "lucide-react";

type ImageThumbnailProps = {
  url?: string;
  thumbnailUrl?: string;
  toggleExpand: () => void;
}

const imageRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|bmp|webp|svg|ico|tiff|tif|raw|heic|heif|avif))/i;

function isImageUrl(url: string | undefined) {
  if (!url) return false;
  return imageRegex.test(url);
}


const ImageThumbnail: React.FC<ImageThumbnailProps> = (props) => {
  const { url, thumbnailUrl, toggleExpand } = props;

  if (isImageUrl(url)) {
    return (
      <button onClick={toggleExpand} className="cursor-pointer">
        {thumbnailUrl ? <img src={thumbnailUrl} className="rounded-md" /> : <img src={url} className="rounded-md" />}
      </button>
    );
  }

  if (thumbnailUrl) {
    return (
      <a href={url} target="_blank">
        <img src={thumbnailUrl} className="rounded-md" />
      </a>
    );
  }

  if (url) {
    return (
      <a href={url} target="_blank">
        <ExternalLinkIcon className="w-12 h-12" />
      </a>
    );
  }

  return <MessageSquareIcon className="w-12 h-12" />;
};

export default ImageThumbnail;
