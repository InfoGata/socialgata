package com.socialgata.app;

import android.annotation.SuppressLint;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.net.URI;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Requests a site will only answer when they come from one of its own pages.
 *
 * Some sites decide on where a request came from rather than on what it carries.
 * twstalker.com is the case that forced this: its Cloudflare rule keys on
 * Sec-Fetch-Site, so a request from the app arrives as cross-site and is
 * challenged, while the same request from a page on twstalker.com arrives as
 * same-origin and is served. Sec-Fetch-* is browser-controlled and cannot be
 * forged, so the request has to genuinely come from a page on that site.
 *
 * CapacitorHttp cannot do this: it is a native client, so it looks less like a
 * browser than the app's own fetch does. Instead a hidden WebView is parked on
 * the origin and the fetch runs inside it.
 */
@CapacitorPlugin(name = "PageContext")
public class PageContextPlugin extends Plugin {

    /** Managed challenges clear themselves; the page just needs a moment. */
    private static final long CHALLENGE_TIMEOUT_MS = 25_000;
    private static final long CHALLENGE_POLL_MS = 500;
    private static final long LOAD_TIMEOUT_MS = 30_000;

    private final Map<String, WebView> parked = new HashMap<>();
    private final Handler main = new Handler(Looper.getMainLooper());

    private static final String CHALLENGE_PROBE =
        "(function(){var t=document.title||'';" +
        "if(/^Just a moment|Attention Required|Verifying your browser/i.test(t))return true;" +
        "if(document.getElementById('challenge-error-text'))return true;" +
        "if(document.getElementById('cf-challenge-running'))return true;" +
        // Anubis (lobste.rs): its proof-of-work page carries the challenge as JSON.
        "if(document.getElementById('anubis_challenge'))return true;" +
        "return typeof window._cf_chl_opt!=='undefined';})()";

    @PluginMethod
    public void fetch(final PluginCall call) {
        final String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("A url is required");
            return;
        }

        final String origin;
        try {
            URI uri = new URI(url);
            String scheme = uri.getScheme();
            if (!"https".equals(scheme) && !"http".equals(scheme)) {
                call.reject("Refusing a page-context request to " + scheme);
                return;
            }
            origin = scheme + "://" + uri.getAuthority();
        } catch (Exception e) {
            call.reject("Could not parse url: " + url);
            return;
        }

        main.post(() -> ensureWebView(origin, origin, call, webView -> runFetch(webView, call, url, true)));
    }

    private interface WebViewReady {
        void onReady(WebView webView);
    }

    @SuppressLint("SetJavaScriptEnabled")
    /**
     * `loadUrl` is usually the origin. A check that guards only some paths
     * (Anubis on lobste.rs/search) never runs there, so the page has to load the
     * guarded url itself to earn the cookie the in-page fetch then carries.
     * It gets there from the origin's own page, the way following a link would:
     * lobste.rs answers a /search load with no Referer with an empty 403, and
     * `loadUrl` sends none.
     */
    private void ensureWebView(String origin, String loadUrl, PluginCall call, WebViewReady ready) {
        WebView existing = parked.get(origin);
        if (existing != null) {
            ready.onReady(existing);
            return;
        }

        final WebView webView = new WebView(getActivity());
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        // A real user agent: the default WebView string is a bot-check magnet,
        // and this window only ever loads the plugin's own site.
        webView.getSettings().setUserAgentString(
            webView.getSettings().getUserAgentString().replace("; wv", "")
        );
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.addJavascriptInterface(new ResultBridge(), "PageContextBridge");

        // Rendered and full size to begin with. Cloudflare's check here is a
        // Turnstile widget, and it never completes in a 1x1 invisible view --
        // measured: still "Just a moment..." after 60s, versus clearing in a few
        // seconds once the view is actually laid out. It is shrunk out of the
        // way in `park` as soon as the check passes.
        ViewGroup content = getActivity().findViewById(android.R.id.content);
        content.addView(webView, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        final boolean[] settled = { false };
        final boolean[] onTarget = { loadUrl.equals(origin) };
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                if (settled[0]) return;
                if (!onTarget[0]) {
                    onTarget[0] = true;
                    view.evaluateJavascript(
                        "location.href = " + JSONObject.quote(loadUrl) + ";", null);
                    return;
                }
                settled[0] = true;
                parked.put(origin, webView);
                waitForChallenge(webView, System.currentTimeMillis() + CHALLENGE_TIMEOUT_MS,
                    () -> { park(webView); ready.onReady(webView); });
            }
        });

        main.postDelayed(() -> {
            if (settled[0]) return;
            settled[0] = true;
            destroy(origin, webView);
            call.reject("Timed out loading " + origin);
        }, LOAD_TIMEOUT_MS);

        webView.loadUrl(origin);
    }

    private void waitForChallenge(WebView webView, long deadline, Runnable done) {
        if (System.currentTimeMillis() > deadline) {
            // Fall through: the fetch still runs, and its status describes what
            // happened better than a timeout would.
            done.run();
            return;
        }
        webView.evaluateJavascript(CHALLENGE_PROBE, value -> {
            // Only an explicit "false" is cleared. Mid-navigation -- Anubis
            // redirects once solved -- the probe can come back "null", which
            // means it could not answer, not that the check has passed.
            if ("false".equals(value)) {
                done.run();
            } else {
                main.postDelayed(() -> waitForChallenge(webView, deadline, done), CHALLENGE_POLL_MS);
            }
        });
    }

    /**
     * `evaluateJavascript` hands back whatever the expression evaluates to, and
     * does not await it -- an async function just yields a pending Promise,
     * which arrives here as "{}". So the page posts its result back through this
     * bridge instead.
     */
    private final Map<String, ValueCallback<String>> awaiting = new ConcurrentHashMap<>();

    private class ResultBridge {
        @JavascriptInterface
        public void onResult(String requestId, String json) {
            ValueCallback<String> callback = awaiting.remove(requestId);
            if (callback != null) main.post(() -> callback.onReceiveValue(json));
        }
    }

    /** Out of sight once the check has passed; a fetch needs no layout. */
    private void park(WebView webView) {
        webView.setVisibility(View.INVISIBLE);
        ViewGroup.LayoutParams params = webView.getLayoutParams();
        params.width = 1;
        params.height = 1;
        webView.setLayoutParams(params);
    }

    private void runFetch(WebView webView, PluginCall call, String url, boolean retryOnChallenge) {
        JSObject request = new JSObject();
        request.put("url", url);
        request.put("method", call.getString("method", "GET"));
        JSObject headers = call.getObject("headers");
        request.put("headers", headers == null ? new JSObject() : headers);
        String body = call.getString("body");
        if (body != null) request.put("body", body);

        final String requestId = UUID.randomUUID().toString();
        awaiting.put(requestId, json -> onFetchResult(json, call, url, retryOnChallenge));

        String script =
            "(async function(){var req=" + request.toString() + ";var id='" + requestId + "';" +
            "var out;try{var init={method:req.method,headers:req.headers,credentials:'include'};" +
            "if(req.body!==undefined)init.body=req.body;" +
            "var r=await fetch(req.url,init);" +
            "var h={};r.headers.forEach(function(v,k){h[k]=v;});" +
            "out=JSON.stringify({status:r.status,statusText:r.statusText,headers:h,body:await r.text()});}" +
            "catch(e){out=JSON.stringify({error:String(e&&e.message?e.message:e)});}" +
            "PageContextBridge.onResult(id,out);})()";

        webView.evaluateJavascript(script, null);
    }

    private void onFetchResult(String json, PluginCall call, String url, boolean retryOnChallenge) {
        try {
            JSObject result = new JSObject(json);

            boolean isGet = "GET".equalsIgnoreCase(call.getString("method", "GET"));
            if (retryOnChallenge && isGet && (result.has("error") || looksAnubisChallenged(result))) {
                // Anubis guards paths, not the origin, so the page loads the
                // guarded url and solves the check there. The same load rescues
                // a fetch the parked page's CSP refused: lobste.rs serves
                // `connect-src 'none'` on its cached pages, the origin's landing
                // page among them, but not on /search. Only a GET replays as a
                // page load.
                String origin = originFor(url);
                WebView stale = parked.remove(origin);
                if (stale != null) destroy(origin, stale);
                main.post(() -> ensureWebView(origin, url, call,
                    fresh -> runFetch(fresh, call, url, false)));
                return;
            }

            if (result.has("error")) {
                call.reject("Page-context request to " + url + " failed: " + result.getString("error"));
                return;
            }

            if (retryOnChallenge && looksChallenged(result)) {
                // Clearance expires and the parked page starts collecting
                // interstitials. Reload it the way the first load went.
                String origin = originFor(url);
                WebView stale = parked.remove(origin);
                if (stale != null) destroy(origin, stale);
                main.post(() -> ensureWebView(origin, origin, call,
                    fresh -> runFetch(fresh, call, url, false)));
                return;
            }

            call.resolve(result);
        } catch (Exception e) {
            call.reject("Could not read the page-context response: " + e.getMessage());
        }
    }

    private boolean looksChallenged(JSObject result) {
        int status = result.getInteger("status", 0);
        if (status != 403 && status != 503) return false;
        String body = result.getString("body", "");
        String head = body.length() > 4000 ? body.substring(0, 4000) : body;
        return head.contains("Just a moment")
            || head.contains("cf_chl")
            || head.contains("Attention Required")
            || head.contains("Verifying your browser");
    }

    /**
     * Anubis answers a challenged request with its proof-of-work page, as a 200
     * on lobste.rs. The page has to be loaded to be solved; a fetch never does.
     */
    private boolean looksAnubisChallenged(JSObject result) {
        return result.getString("body", "").contains("id=\"anubis_challenge\"");
    }

    private String originFor(String url) {
        try {
            URI uri = new URI(url);
            return uri.getScheme() + "://" + uri.getAuthority();
        } catch (Exception e) {
            return url;
        }
    }

    private void destroy(String origin, WebView webView) {
        parked.remove(origin);
        ViewGroup parent = (ViewGroup) webView.getParent();
        if (parent != null) parent.removeView(webView);
        webView.destroy();
    }

    @Override
    protected void handleOnDestroy() {
        for (Iterator<Map.Entry<String, WebView>> it = parked.entrySet().iterator(); it.hasNext(); ) {
            Map.Entry<String, WebView> entry = it.next();
            WebView webView = entry.getValue();
            it.remove();
            ViewGroup parent = (ViewGroup) webView.getParent();
            if (parent != null) parent.removeView(webView);
            webView.destroy();
        }
    }
}
