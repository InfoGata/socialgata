import { ManifestRedirect } from "./plugintypes";

/**
 * Chrome's URLPattern is stricter than a plain RegExp: it rejects some regex
 * constructs outright, notably negated character classes such as `[^/?#]+`.
 * The extension constructs a URLPattern per redirect and skips any that throw,
 * so an invalid pattern is silently ignored rather than reported.
 *
 * Validate with the real URLPattern rather than pattern-matching on the syntax,
 * since the exact set of rejected constructs is the browser's to define.
 */
export const isValidRedirectPattern = (pattern: string): boolean => {
  const URLPatternCtor = (
    globalThis as { URLPattern?: new (pattern: string) => unknown }
  ).URLPattern;
  // Nothing to validate against (jsdom, older browsers). Defer to the extension.
  if (typeof URLPatternCtor !== "function") return true;
  try {
    new URLPatternCtor(pattern);
    return true;
  } catch {
    return false;
  }
};

// Registration re-runs whenever plugins reload, so only report each pattern once.
const warnedPatterns = new Set<string>();

/**
 * Drop redirects the browser cannot compile, warning once per bad pattern so a
 * plugin author sees why their redirect never fires.
 */
export const filterValidRedirects = (
  redirects: ManifestRedirect[],
  plugin: { id?: string; name: string }
): ManifestRedirect[] =>
  redirects.filter((redirect) => {
    if (isValidRedirectPattern(redirect.pattern)) return true;
    if (!warnedPatterns.has(redirect.pattern)) {
      warnedPatterns.add(redirect.pattern);
      console.warn(
        `Ignoring invalid redirect pattern from plugin "${plugin.name}" (${plugin.id}): ${redirect.pattern}`
      );
    }
    return false;
  });
