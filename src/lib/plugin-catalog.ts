import type { PluginDescription } from "@/types";

/**
 * Whether this host can run the plugin well enough to offer it.
 *
 * A plugin is hidden when installing it here would produce one that fails every
 * request. The exception is a plugin that only needs the extension for
 * anonymous reading: hiding that one would stop the reader installing the
 * plugin they need in order to sign in, which is what makes it work.
 */
export const isOfferable = (
  plugin: PluginDescription,
  corsDisabled: boolean,
  pageContextSupported: boolean | undefined
): boolean => {
  const corsOk =
    !plugin.requiresCorsDisabled ||
    corsDisabled ||
    !!plugin.signInReplacesCorsRequirement;

  // Still unknown counts as unsupported: better to show the card a moment late
  // than to offer a plugin this host cannot run.
  const pageContextOk =
    !plugin.requiresPageContext || pageContextSupported === true;

  return corsOk && pageContextOk;
};

/**
 * Whether the card should say an account is needed. True only where the plugin
 * is being offered *because* signing in substitutes for the extension — with
 * the extension present there is nothing to warn about.
 */
export const needsSignIn = (
  plugin: PluginDescription,
  corsDisabled: boolean
): boolean =>
  !!plugin.requiresCorsDisabled &&
  !!plugin.signInReplacesCorsRequirement &&
  !corsDisabled;
