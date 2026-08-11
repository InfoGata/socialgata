import React from "react";
import { ErrorComponentProps, useParams, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Lock,
  LucideIcon,
  SearchX,
  ServerCrash,
  ShieldAlert,
  Timer,
  TriangleAlert,
  WifiOff,
} from "lucide-react";
import ErrorState from "@/components/ErrorState";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlugins } from "@/hooks/usePlugins";
import { useExtension } from "@/hooks/useExtension";
import { isCorsDisabled } from "@/utils";
import {
  PluginErrorCode,
  errorSiteHost,
  toPluginErrorPayload,
} from "@/plugin-errors";

const ICONS: Record<PluginErrorCode, LucideIcon> = {
  blocked: ShieldAlert,
  forbidden: Lock,
  unauthorized: Lock,
  "rate-limited": Timer,
  "not-found": SearchX,
  "server-error": ServerCrash,
  "network-error": WifiOff,
  "invalid-response": TriangleAlert,
  unknown: TriangleAlert,
};

/** `https://www.reddit.com/*` -> `www.reddit.com`. */
const hostFromSiteMatch = (pattern?: string): string | undefined => {
  if (!pattern) return undefined;
  try {
    return new URL(pattern.replace(/\*+$/, "")).host;
  } catch {
    return undefined;
  }
};

/**
 * Rendered for any route whose loader rejected. Plugin failures arrive here as
 * plain objects (plugin-frame strips the prototype), so they're classified by
 * shape and message rather than by type — see src/plugin-errors.ts.
 */
const RouteErrorComponent: React.FC<ErrorComponentProps> = ({
  error,
  reset,
}) => {
  const { t } = useTranslation("errors");
  const { t: tCommon } = useTranslation("common");
  const router = useRouter();
  const { plugins } = usePlugins();
  const { extensionDetected } = useExtension();
  // Not every route has a pluginId, hence the loose lookup.
  const params = useParams({ strict: false }) as { pluginId?: string };

  const payload = toPluginErrorPayload(error);
  const plugin = plugins.find((p) => p.id === params.pluginId);
  const site =
    errorSiteHost(payload) ?? hostFromSiteMatch(plugin?.siteMatch?.[0]);

  const { code, status } = payload;
  // Only these two are worth sending someone to the site for: a block may clear
  // once the site sets its cookies, and a network error may just be this app.
  const offerSiteLink = (code === "blocked" || code === "network-error") && !!site;
  const suggestExtension = extensionDetected === false && !isCorsDisabled();

  const copy = (): { title: string; description: string } => {
    switch (code) {
      case "blocked":
        return site
          ? {
              title: t("blockedTitle", { site }),
              description: t("blockedDescription", { site }),
            }
          : {
              title: t("blockedTitleGeneric"),
              description: t("blockedDescriptionGeneric"),
            };
      case "network-error":
        return {
          title: site
            ? t("networkTitle", { site })
            : t("networkTitleGeneric"),
          description: t("networkDescription"),
        };
      case "forbidden":
        return {
          title: t("forbiddenTitle"),
          description: t("forbiddenDescription"),
        };
      case "unauthorized":
        return {
          title: t("unauthorizedTitle"),
          description: t("unauthorizedDescription"),
        };
      case "rate-limited":
        return {
          title: t("rateLimitedTitle"),
          description: t("rateLimitedDescription"),
        };
      case "not-found":
        return {
          title: t("notFoundTitle"),
          description: t("notFoundDescription"),
        };
      case "server-error":
        return {
          title: t("serverErrorTitle"),
          description: t("serverErrorDescription"),
        };
      case "invalid-response":
        return {
          title: t("invalidResponseTitle"),
          description: t("invalidResponseDescription"),
        };
      default:
        return {
          title: t("unknownTitle"),
          description: t("unknownDescription"),
        };
    }
  };

  const { title, description } = copy();

  const retry = React.useCallback(() => {
    // `reset` clears the boundary; only invalidate re-runs the loader that failed.
    reset();
    router.invalidate();
  }, [reset, router]);

  // Opening the site is what actually fixes a block: the page runs the site's
  // own scripts, which is where the session comes from — a background request
  // can't do that. So once someone has been sent there, retry as soon as they
  // come back rather than making them ask for it.
  const visitedSite = React.useRef(false);
  React.useEffect(() => {
    const onFocus = () => {
      if (!visitedSite.current) return;
      visitedSite.current = false;
      retry();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [retry]);

  return (
    <ErrorState icon={ICONS[code]} title={title} description={description}>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={retry}>{t("tryAgain")}</Button>
        {offerSiteLink && (
          <a
            href={`https://${site}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              visitedSite.current = true;
            }}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {t("openSite", { site })}
          </a>
        )}
        {suggestExtension && (
          <a
            href="https://github.com/InfoGata/infogata-extension"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {tCommon("installExtension")}
          </a>
        )}
      </div>
      <details className="text-muted-foreground text-xs">
        <summary className="cursor-pointer">{t("showDetails")}</summary>
        <p className="mt-2 font-mono break-all">
          {[status && `HTTP ${status}`, code, payload.requestUrl]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="mt-1 break-all">{payload.message}</p>
      </details>
    </ErrorState>
  );
};

export default RouteErrorComponent;
