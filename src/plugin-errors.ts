/**
 * A shared vocabulary for "the plugin couldn't get the content", so the app can
 * say something useful instead of showing a stack trace.
 *
 * The shape is dictated by how plugin errors cross the iframe boundary.
 * plugin-frame serializes a rejection as
 * `[...Object.keys(e), "message"].reduce(...)`, so:
 *
 * - only `message` plus **own enumerable** properties survive. The prototype
 *   doesn't, which is why nothing here may be identified with `instanceof` and
 *   why `createPluginError` assigns its fields onto the instance.
 * - `Object.keys(undefined)` throws, and that throw happens inside plugin-frame's
 *   own error handling, where it prevents the reply from being posted at all and
 *   leaves the caller's promise pending forever. So a rejection reaching the
 *   boundary must always be an object — hence `toPluginErrorPayload`, which
 *   turns anything at all into one.
 */

export type PluginErrorCode =
  /** The site refused us, typically anti-bot or a missing session cookie. */
  | "blocked"
  /** We reached the site and it said no: private, quarantined, deleted. */
  | "forbidden"
  | "unauthorized"
  | "rate-limited"
  | "not-found"
  | "server-error"
  /** Never reached the server, or took too long. */
  | "network-error"
  /** A 2xx we couldn't read: a challenge page, or an unexpected shape. */
  | "invalid-response"
  | "unknown";

export interface PluginErrorPayload {
  /** Discriminator. Must be an own enumerable prop to survive serialization. */
  isPluginError: true;
  code: PluginErrorCode;
  message: string;
  status?: number;
  /**
   * Origin + pathname only. The query string is dropped on purpose: it carries
   * search terms, and on authenticated hosts it can carry identifiers.
   */
  requestUrl?: string;
  /** Site-specific reason, e.g. reddit's `private`. */
  detail?: string;
}

export type PluginError = Error & PluginErrorPayload;

export const createPluginError = (
  payload: Omit<PluginErrorPayload, "isPluginError">
): PluginError => {
  const error = new Error(payload.message);
  // Assigned, not declared: class fields and prototype members don't survive
  // plugin-frame's serialization, own enumerable properties do. `message` is own
  // but non-enumerable, and is force-added by the serializer regardless.
  return Object.assign(error, { isPluginError: true as const }, payload);
};

const hasOwn = (value: object, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

/**
 * True for a payload that survived the frame boundary. Deliberately structural:
 * by the time the app sees one it is a plain object, so `instanceof` is always
 * false.
 */
export const isPluginErrorPayload = (
  value: unknown
): value is PluginErrorPayload => {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    hasOwn(candidate, "isPluginError") &&
    candidate.isPluginError === true &&
    typeof candidate.code === "string"
  );
};

const FALLBACK_MESSAGE = "The request failed.";

/**
 * Classifies whatever a plugin call rejected with. Plugins that adopt the
 * convention are passed through untouched; everything else is matched on its
 * message, which is all that's left of an error by the time it arrives here.
 * That heuristic layer is what lets the app give a useful answer for plugins
 * that predate the convention.
 */
export const toPluginErrorPayload = (error: unknown): PluginErrorPayload => {
  if (isPluginErrorPayload(error)) return error;

  const message =
    (typeof error === "object" && error !== null &&
      typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message
      : typeof error === "string"
        ? error
        : "") || FALLBACK_MESSAGE;

  const name =
    typeof error === "object" && error !== null &&
    typeof (error as { name?: unknown }).name === "string"
      ? (error as { name: string }).name
      : "";

  const classify = (): PluginErrorCode => {
    if (/failed to fetch|networkerror|load failed|timed out/i.test(message)) {
      return "network-error";
    }
    // A block page served with a 200, or an HTML error body, reaches a plugin as
    // a JSON parse failure.
    if (
      name === "SyntaxError" ||
      /unexpected token|is not valid json|unexpected end of json/i.test(message)
    ) {
      return "invalid-response";
    }
    // Reading through a response that wasn't the shape the plugin expected.
    if (/cannot read propert(y|ies) of (undefined|null)/i.test(message)) {
      return "invalid-response";
    }
    return "unknown";
  };

  return { isPluginError: true, code: classify(), message };
};

/** Host to name in the error copy, and to offer as a link. */
export const errorSiteHost = (
  payload: Pick<PluginErrorPayload, "requestUrl">
): string | undefined => {
  if (!payload.requestUrl) return undefined;
  try {
    return new URL(payload.requestUrl).host;
  } catch {
    return undefined;
  }
};
