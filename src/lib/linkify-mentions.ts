import { createTokenClass, registerPlugin, type MultiToken } from "linkifyjs";

/**
 * Mention token that also accepts fediverse handles (`@user@instance.tld`).
 *
 * The stock `linkify-plugin-mention` stops at the second `@`, so
 * `@user@hachyderm.io` tokenizes as two separate mentions (`@user`, `@hachyderm`)
 * with the TLD dropped entirely. That is unusable for Mastodon and Lemmy, so we
 * register our own token type instead of the stock plugin.
 */
export const FediMentionToken = createTokenClass("fediMention", {
  isLink: true,
  toHref() {
    return "/" + this.toString().slice(1);
  },
});

/**
 * `State.tt()` is typed to accept a token *instance*, but linkify's own plugin
 * API (and its bundled plugins) pass the token *class* returned by
 * `createTokenClass`. Upstream typing bug — cast once here rather than at each
 * call site.
 */
const MentionTokenState = FediMentionToken as unknown as MultiToken;

let registered = false;

/**
 * Registers the mention plugin with linkify's global parser. Safe to call more
 * than once; linkify's parser state is global and must only be built once.
 */
export const registerMentionPlugin = () => {
  if (registered) return;
  registered = true;

  registerPlugin("fediMention", ({ scanner, parser }) => {
    const { HYPHEN, UNDERSCORE, AT, DOT, SLASH } = scanner.tokens;
    const { domain } = scanner.tokens.groups;

    // Note: `ta()` only wires transitions and returns void. New states must be
    // created with `tt()` first, then have group transitions attached.
    const At = parser.start.tt(AT);

    // Leading hyphens are not a mention on their own.
    const AtHyphen = At.tt(HYPHEN);
    AtHyphen.tt(HYPHEN, AtHyphen);

    const Mention = At.tt(UNDERSCORE, MentionTokenState);
    At.ta(domain, Mention);
    AtHyphen.tt(UNDERSCORE, Mention);
    AtHyphen.ta(domain, Mention);

    Mention.ta(domain, Mention);
    Mention.tt(HYPHEN, Mention);
    Mention.tt(UNDERSCORE, Mention);

    // Mentions can resume after a divider, e.g. `@org/team`.
    const MentionDivider = Mention.tt(SLASH);
    MentionDivider.ta(domain, Mention);
    MentionDivider.tt(UNDERSCORE, Mention);
    MentionDivider.tt(HYPHEN, Mention);

    // Fediverse extension: `@user@instance.tld`.
    // A trailing `@` with no host degrades to the plain `@user` mention, and
    // `bob@example.com` still scans as an email because that starts from the
    // word rather than from `@`.
    const MentionAt = Mention.tt(AT);
    const Host = MentionAt.tt(UNDERSCORE, MentionTokenState);
    MentionAt.ta(domain, Host);
    Host.ta(domain, Host);
    Host.tt(HYPHEN, Host);
    Host.tt(DOT).ta(domain, Host);
  });
};
