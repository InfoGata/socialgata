/**
 * The site a link post points at, shown beside its title the way Hacker News,
 * Lobsters and old Reddit do: `github.com`, `i.redd.it`, `en.wikipedia.org`.
 *
 * Derived from `post.url`, which every forum plugin only sets for link posts
 * (text posts leave it empty), so a missing domain means "nothing to show".
 * A relative url (an in-app link) or a non-http one has no domain either.
 */
export const getPostDomain = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return undefined;
  }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  return host || undefined;
};
