/**
 * The addresses and links the app publishes. Shared so the About page, the
 * abuse page and anything added later can't drift apart, and so an address can
 * be repointed in one place rather than hunted for.
 */

export const contactEmail = "contact@socialgata.com";

/**
 * Separate from the general contact so abuse and copyright reports can be
 * filtered and answered on their own terms rather than competing with everything
 * else in one inbox. Delivered by the domain's catch-all.
 */
export const abuseEmail = "abuse@socialgata.com";

export const repoUrl = "https://github.com/InfoGata/socialgata";
export const abusePolicyUrl = `${repoUrl}/blob/master/ABUSE.md`;
