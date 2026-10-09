package com.socialgata.app;

import android.annotation.SuppressLint;
import android.graphics.Color;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.net.URI;

/**
 * Shows a site full screen inside the app, so whatever session it sets is the
 * app's.
 *
 * Some sites only answer requests that carry the cookies their own pages set.
 * Reddit is the case that forced this: without them its .json endpoints return
 * a 403 challenge page. In the browser the fix is to visit the site once, but
 * here a link opens the system browser, whose cookies the app never sees. The
 * app's requests go through CapacitorHttp, which reads cookies from the
 * WebView's CookieManager, so the visit has to happen in a WebView in this
 * process. A background fetch is no substitute: the session comes from the
 * site's scripts, which only a rendered page runs.
 *
 * `open` resolves once the user closes the page, which is when to retry.
 */
@CapacitorPlugin(name = "SiteVisit")
public class SiteVisitPlugin extends Plugin {

    private ViewGroup overlay;
    private WebView webView;
    private OnBackPressedCallback backCallback;
    private PluginCall pending;

    @PluginMethod
    public void open(final PluginCall call) {
        final String url = call.getString("url");
        try {
            String scheme = new URI(url).getScheme();
            if (!"https".equals(scheme) && !"http".equals(scheme)) {
                call.reject("Refusing to open " + scheme);
                return;
            }
        } catch (Exception e) {
            call.reject("Could not parse url: " + url);
            return;
        }
        final String closeLabel = call.getString("closeLabel", "Close");

        getActivity().runOnUiThread(() -> {
            // One at a time: a second open replaces the first, which still
            // counts as closed for whoever was waiting on it.
            close();
            pending = call;
            show(url, closeLabel);
        });
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void show(String url, String closeLabel) {
        LinearLayout root = new LinearLayout(getActivity());
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.WHITE);
        // Clicks must not fall through to the app underneath.
        root.setClickable(true);

        LinearLayout bar = new LinearLayout(getActivity());
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        int pad = dp(8);
        bar.setPadding(dp(16), pad, pad, pad);

        TextView title = new TextView(getActivity());
        title.setText(URI.create(url).getHost());
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        title.setTextColor(Color.BLACK);
        title.setSingleLine(true);
        bar.addView(title, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));

        Button done = new Button(getActivity());
        done.setText(closeLabel);
        done.setOnClickListener(v -> close());
        bar.addView(done, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        root.addView(bar, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        webView = new WebView(getActivity());
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        // Same as PageContextPlugin: the default WebView user agent is a
        // bot-check magnet.
        webView.getSettings().setUserAgentString(
            webView.getSettings().getUserAgentString().replace("; wv", "")
        );
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // Keep the user, and the session, inside this page. Anything
                // that isn't a web page -- Reddit's "Open App" is an intent://
                // link -- would only load as an error page, so it's ignored.
                String scheme = request.getUrl().getScheme();
                return !"https".equals(scheme) && !"http".equals(scheme);
            }
        });
        root.addView(webView, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));

        // The app draws edge to edge, so keep the bar clear of the status bar
        // and the page clear of the navigation bar.
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        ViewGroup content = getActivity().findViewById(android.R.id.content);
        content.addView(root, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        ViewCompat.requestApplyInsets(root);
        overlay = root;

        // Registered last, so it runs ahead of the app's own back handling.
        backCallback = new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                } else {
                    close();
                }
            }
        };
        getActivity().getOnBackPressedDispatcher().addCallback(getActivity(), backCallback);

        webView.loadUrl(url);
    }

    private void close() {
        if (overlay == null) return;
        // Written to disk now rather than on the WebView's own schedule, so a
        // retry straight after closing already sends them.
        CookieManager.getInstance().flush();

        backCallback.remove();
        backCallback = null;
        ViewGroup parent = (ViewGroup) overlay.getParent();
        if (parent != null) parent.removeView(overlay);
        webView.destroy();
        webView = null;
        overlay = null;

        PluginCall call = pending;
        pending = null;
        if (call != null) call.resolve();
    }

    private int dp(int value) {
        return Math.round(TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP, value, getActivity().getResources().getDisplayMetrics()));
    }

    @Override
    protected void handleOnDestroy() {
        close();
    }
}
