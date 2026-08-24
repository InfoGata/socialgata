import React from "react";
import { PostImage } from "@/plugintypes";
import EmbeddedImage from "./EmbeddedImage";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";

/** A plugin-supplied url need not parse, and a throw here would blank the post. */
const hostname = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

type Props = {
  images: PostImage[];
  alt: string;
  className?: string;
};

/** One slide: the image, its caption, and any link the author attached. */
const GalleryImage: React.FC<{ image: PostImage; alt: string }> = ({
  image,
  alt,
}) => (
  <>
    <EmbeddedImage
      src={image.url}
      full={image.fullUrl}
      link={image.linkUrl}
      alt={image.caption || alt}
      width={image.width}
      height={image.height}
      variant="gallery"
    />
    {(image.caption || image.linkUrl) && (
      <div className="mt-1.5 text-center text-xs text-muted-foreground">
        {image.caption}
        {image.linkUrl && (
          <a
            href={image.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1.5 text-primary hover:underline"
          >
            {hostname(image.linkUrl)}
          </a>
        )}
      </div>
    )}
  </>
);

/**
 * The images of a multi-image post, one at a time, with the count and arrows to
 * move between them. Embla handles touch drag, so there is no separate mobile
 * path; the arrows exist for pointer and keyboard.
 *
 * A single-image array skips the carousel entirely — the chrome would only be
 * disabled controls around one picture.
 */
const PostGallery: React.FC<Props> = ({ images, alt, className = "mb-2" }) => {
  const [api, setApi] = React.useState<CarouselApi>();
  // Read from embla during render and re-render on its events, rather than
  // mirroring the index into state and seeding it from inside the effect.
  const [, onEmblaEvent] = React.useReducer((n: number) => n + 1, 0);
  const current = api?.selectedScrollSnap() ?? 0;

  React.useEffect(() => {
    if (!api) return;
    api.on("select", onEmblaEvent);
    api.on("reInit", onEmblaEvent);
    return () => {
      api.off("select", onEmblaEvent);
      api.off("reInit", onEmblaEvent);
    };
  }, [api, onEmblaEvent]);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className={className}>
        <GalleryImage image={images[0]} alt={alt} />
      </div>
    );
  }

  return (
    <Carousel
      className={className}
      setApi={setApi}
      opts={{ align: "center" }}
      aria-label={`${alt} — gallery of ${images.length} images`}
    >
      <CarouselContent>
        {images.map((image, i) => (
          <CarouselItem key={image.url}>
            <GalleryImage image={image} alt={`${alt} (${i + 1} of ${images.length})`} />
          </CarouselItem>
        ))}
      </CarouselContent>
      {/* Inside the frame, not shadcn's default outside offset — a post card has
          no margin to spare on a phone. */}
      <CarouselPrevious className="left-2 bg-background/80 backdrop-blur" />
      <CarouselNext className="right-2 bg-background/80 backdrop-blur" />
      <div
        className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white"
        aria-live="polite"
      >
        {current + 1} / {images.length}
      </div>
    </Carousel>
  );
};

export default PostGallery;
