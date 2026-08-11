import { createPluginError } from "@/plugin-errors";

export const NETWORK_TIMEOUT_MS = 30_000;

/** Origin + pathname, dropping a query that may carry search terms or tokens. */
export const safeRequestUrl = (url: string): string | undefined => {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return undefined;
  }
};

/**
 * Bounds how long a plugin waits on the extension.
 *
 * The extension drops `init.signal` on its way to the background worker, so
 * there's no way to abort the underlying request; this only stops us awaiting it.
 * Leaking one in-flight fetch beats the alternative, which is what older
 * extension versions produce on a transport failure: a promise that never
 * settles, and an app stuck loading with nothing to report.
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  ms: number,
  url: string
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          createPluginError({
            code: "network-error",
            message: `The request to ${url} timed out.`,
            requestUrl: safeRequestUrl(url),
          })
        ),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() =>
    clearTimeout(timer)
  ) as Promise<T>;
};
