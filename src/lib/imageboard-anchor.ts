/**
 * Url fragments that point at one post inside an imageboard thread.
 *
 * Links SocialGata makes use `#q<number>`, the form leftypol and other vichan
 * boards share (`/leftypol/res/2005272.html#q2958486`). `#p<number>` (4chan)
 * and a bare `#<number>` (vichan, lynxchan, makaba anchors) are read too, so a
 * fragment copied from the board itself still lands on the post.
 */

/** The fragment, without `#`, that links to post `number` in its thread. */
export const imageboardPostAnchor = (number: number | string): string =>
  `q${number}`;

/** The post number a fragment points at, or undefined when it isn't one. */
export const parseImageboardAnchor = (
  hash: string | undefined,
): number | undefined => {
  const match = hash?.replace(/^#/, "").match(/^[qp]?(\d+)$/);
  return match ? Number(match[1]) : undefined;
};
