import DOMPurify from "dompurify";
import {
  domToReact,
  type DOMNode,
  type HTMLReactParserOptions,
} from "html-react-parser";
import { Link } from "@tanstack/react-router";
import type { Opts } from "linkifyjs";
import "linkify-plugin-hashtag";
import { registerMentionPlugin } from "@/lib/linkify-mentions";

registerMentionPlugin();

/** Marks hrefs this app owns, so parse options know to route them internally. */
const INTERNAL_PREFIX = "/plugins/";

const userPath = (pluginId: string, handle: string) =>
  `${INTERNAL_PREFIX}${pluginId}/user/${encodeURIComponent(handle)}`;

const hashtagPath = (pluginId: string, tag: string) =>
  `${INTERNAL_PREFIX}${pluginId}/trending/${encodeURIComponent(tag.replace(/^#/, ""))}`;

/**
 * Derives a fediverse acct from a mention anchor's href.
 *
 * Mastodon renders mentions as `<a href="https://hachyderm.io/@user">@user</a>`
 * — the visible text omits the host, so the full acct only exists in the href.
 * Returns undefined for anything that isn't a recognizable `/@user` profile URL.
 */
export const acctFromMentionHref = (href: string): string | undefined => {
  try {
    const url = new URL(href);
    const match = url.pathname.match(/^\/@([^/]+)\/?$/);
    if (!match) return undefined;
    // A remote-instance mention may already carry the host in the path.
    return match[1].includes("@") ? match[1] : `${match[1]}@${url.hostname}`;
  } catch {
    return undefined;
  }
};

/** Flattens body HTML to plain text, for attributes like `alt` that can't hold markup. */
export const htmlToText = (html: string): string =>
  DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

const isMentionAnchor = (attribs: Record<string, string>) =>
  (attribs.class || "").split(/\s+/).includes("mention");

/**
 * Turns anchors into either client-side router links or hardened external
 * links. Anchors are the only tag this rewrites; everything else falls through
 * to html-react-parser's default handling.
 */
export const createPostBodyParseOptions = (
  pluginId: string,
): HTMLReactParserOptions => {
  const options: HTMLReactParserOptions = {
    replace(domNode: DOMNode) {
      if (domNode.type !== "tag" || domNode.name !== "a") return;

      const attribs = domNode.attribs || {};
      const href = attribs.href || "";
      const children = () => domToReact(domNode.children as DOMNode[], options);

      // Mentions the plugin already anchored (Mastodon) are skipped by linkify,
      // so resolve them here from the href rather than the visible text.
      if (isMentionAnchor(attribs) && !href.startsWith(INTERNAL_PREFIX)) {
        const acct = acctFromMentionHref(href);
        if (acct) {
          return (
            <Link
              to={userPath(pluginId, acct)}
              className="text-primary hover:underline"
            >
              {children()}
            </Link>
          );
        }
      }

      if (href.startsWith(INTERNAL_PREFIX)) {
        return (
          <Link to={href} className="text-primary hover:underline">
            {children()}
          </Link>
        );
      }

      // DOMPurify preserves href/target/rel but never adds noopener itself.
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {children()}
        </a>
      );
    },
  };
  return options;
};

/**
 * Linkify emits plain anchors; `formatHref` is what points them at app routes.
 * The href linkify passes in is the token's own `toHref()` output, so a mention
 * arrives as `/handle` and a hashtag as `#tag`.
 */
export const createLinkifyOptions = (pluginId: string): Opts => ({
  formatHref: {
    fediMention: (href) => userPath(pluginId, href.slice(1)),
    hashtag: (href) => hashtagPath(pluginId, href),
    // Scraped bodies can carry a display-truncated url ("example.com/a…").
    // The full target is unrecoverable, but an href ending in an ellipsis is
    // never valid, so trim it rather than linking to a guaranteed 404.
    url: (href) => href.replace(/(?:\.{3}|…)+$/, ""),
  },
});
