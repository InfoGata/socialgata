/**
 * The addresses and links the app publishes. Shared so the About page, the
 * abuse page and anything added later can't drift apart, and so switching to a
 * dedicated abuse alias is a one-line change here rather than a hunt.
 */

export const contactEmail = "contact@socialgata.com";

/**
 * Deliberately the same address for now: a published contact that bounces is
 * worse than one that's merely general, and complaints that don't reach us go
 * to the host or the registrar instead, who suspend first and ask later. Point
 * this at abuse@ once the alias exists.
 */
export const abuseEmail = contactEmail;

export const repoUrl = "https://github.com/InfoGata/socialgata";
export const abusePolicyUrl = `${repoUrl}/blob/master/ABUSE.md`;
