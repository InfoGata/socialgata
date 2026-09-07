import type { NsfwDisplay } from "@/store/reducers/uiSlice";

/**
 * What the host tells a plugin when it asks whether to request adult content
 * from the source.
 *
 * Only "hide" stops the fetch. Under "warn" the reader can still choose to
 * reveal an individual item, and there would be nothing to reveal if the plugin
 * had never asked for it — so that content has to arrive and be withheld on
 * display instead. A plugin filtering on anything looser than this removes
 * posts the reader expected to be able to open.
 */
export const shouldRequestNsfw = (display: NsfwDisplay): boolean =>
  display !== "hide";
