import React from "react";
import type Hls from "hls.js";
import { VideoSource } from "@/plugintypes";

type Props = {
  /** Ordered best-first; each is tried in turn until one plays. */
  sources: VideoSource[];
  poster?: string;
  className?: string;
};

const HLS_MIMES = ["application/x-mpegurl", "application/vnd.apple.mpegurl"];
const NATIVE_HLS_MIME = "application/vnd.apple.mpegurl";

const isHlsSource = (source: VideoSource) =>
  HLS_MIMES.includes(source.type?.toLowerCase() ?? "") ||
  /\.m3u8(\?|$)/i.test(source.source);

/**
 * Plays a post's video. Reddit (and other DASH/HLS hosts) only serve audio in
 * the HLS/DASH manifest — their plain mp4 fallback is video-only — so an HLS
 * source is attached via hls.js, lazily imported so it stays out of the main
 * bundle.
 *
 * hls.js is preferred over native playback rather than the other way around:
 * Chrome answers `canPlayType("application/vnd.apple.mpegurl")` with "maybe"
 * despite having no native HLS support, so that probe can't gate the decision.
 * `Hls.isSupported()` (i.e. MSE) is the reliable signal, and the browsers where
 * it's false — iOS Safari — are exactly the ones with real native HLS.
 */
const VideoPlayer: React.FC<Props> = ({ sources, poster, className }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [sourceIndex, setSourceIndex] = React.useState(0);

  // Reset to the best source whenever the post's media changes. Adjusted
  // during render rather than in an effect so no stale source is ever attached.
  const sourceKey = sources.map((s) => s.source).join("|");
  const [renderedKey, setRenderedKey] = React.useState(sourceKey);
  if (renderedKey !== sourceKey) {
    setRenderedKey(sourceKey);
    setSourceIndex(0);
  }

  const source = sources[sourceIndex] as VideoSource | undefined;
  // Depend on primitives, not the object: callers rebuild the source array on
  // every render, and re-running this effect tears down a live hls instance and
  // leaves two of them fighting over one video element.
  const sourceUrl = source?.source;
  const sourceIsHls = source ? isHlsSource(source) : false;

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !sourceUrl) return;

    // Guards against the dynamic import resolving after teardown — otherwise a
    // stale hls instance would attach itself to a reused video element.
    let cancelled = false;
    let hls: Hls | undefined;

    const tryNextSource = () => {
      if (!cancelled) setSourceIndex((i) => i + 1);
    };

    // Listener lives here rather than as an onError prop so teardown detaches
    // it before we reset the element, which itself fires a spurious error.
    video.addEventListener("error", tryNextSource);

    if (!sourceIsHls) {
      video.src = sourceUrl;
    } else {
      void (async () => {
        const { default: HlsCtor } = await import("hls.js");
        if (cancelled) return;
        if (HlsCtor.isSupported()) {
          hls = new HlsCtor();
          hls.on(HlsCtor.Events.ERROR, (_event, data) => {
            if (data.fatal) tryNextSource();
          });
          hls.loadSource(sourceUrl);
          hls.attachMedia(video);
        } else if (video.canPlayType(NATIVE_HLS_MIME)) {
          // iOS Safari: no MSE, but the media stack plays HLS directly.
          video.src = sourceUrl;
        } else {
          tryNextSource();
        }
      })();
    }

    return () => {
      cancelled = true;
      video.removeEventListener("error", tryNextSource);
      hls?.destroy();
      // Abort any in-flight download so offscreen feed videos stop buffering.
      video.removeAttribute("src");
      video.load();
    };
  }, [sourceUrl, sourceIsHls]);

  if (!source) {
    // Every source failed; hand the user the url rather than a dead player.
    const original = sources[0]?.source;
    return original ? (
      <a
        href={original}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted-foreground underline"
      >
        Unable to play this video — open it directly
      </a>
    ) : null;
  }

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      preload="metadata"
      poster={poster}
      className={className}
    >
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoPlayer;
