import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm";
import { VitePWA } from "vite-plugin-pwa";
import { buildInfoDefine } from "./build-info";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    wasm(),
    react(),
    tanstackRouter({ target: "react" }),
    tailwindcss(),
    VitePWA({
      // "autoUpdate" bakes skipWaiting/clientsClaim into the generated sw.js, so
      // a client stuck on a stale precached index.html recovers on its own.
      // Under "prompt" the only way to activate a waiting worker is for the page
      // to post SKIP_WAITING — impossible when the stale build is what failed to
      // boot.
      registerType: "autoUpdate",
      workbox: {
        // The automerge wasm is ~2.7MB on its own and the favorites CRDT can't
        // start without it, so a limit that excludes it would leave an app that
        // installs and then won't open offline. Sized with headroom rather than
        // to the current build, because falling under it fails silently.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: "/index.html",
        // Everything in public/ that is a real page rather than a route. Without
        // this the fallback hands the app shell to the plugin frame, and every
        // plugin in the app stops loading — pluginframe.html is the iframe each
        // one executes in, ui.html backs the options screen, and login_popup.html
        // is an OAuth window.
        navigateFallbackDenylist: [
          /\.html$/,
          /\.html\?/,
        ],
      },
      manifest: {
        name: "SocialGata",
        short_name: "SocialGata",
        description: "SocialGata is a plugin based social media reader.",
        icons: [
          {
            src: "favicon.ico",
            sizes: "64x64 32x32 24x24 16x16",
            type: "image/x-icon",
          },
          {
            src: "logo192.png",
            type: "image/png",
            sizes: "192x192",
          },
          {
            src: "logo512.png",
            type: "image/png",
            sizes: "512x512",
          },
        ],
        start_url: ".",
        display: "standalone",
        theme_color: "#000000",
        background_color: "#ffffff",
      },
    }),
  ],
  // Vite 8 switched to Rolldown and made CJS default-import interop "consistent"
  // (default = full module.exports), which breaks CJS deps that use the
  // `exports.default` + `__esModule` pattern without an ESM build (e.g.
  // redux-persist). Restore the pre-Vite-8 behavior.
  legacy: {
    inconsistentCjsInterop: true,
  },
  // Version and commit, so a bug report can name the build it came from.
  define: buildInfoDefine(),
  // wasm (automerge) + native top-level await require a modern target; es2022 also
  // avoids esbuild's destructuring-downlevel failure on Rolldown output under Vite 8.
  // With the es2022 target, Vite 8 handles top-level await natively, so
  // vite-plugin-top-level-await is no longer needed here.
  build: {
    target: "es2022",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Unique port per app in ~/projects/webapps; strictPort so a collision fails
  // loudly instead of drifting to the next free port, which would silently break
  // the Dropbox OAuth redirect URI pinned to this origin (see .env).
  server: {
    port: 3005,
    strictPort: true,
    open: true
  },
  preview: {
    port: 4005,
    strictPort: true
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['fake-indexeddb/auto', './src/test/before.ts', './src/test/setupTest.ts'],
    teardownTimeout: 10000,
  },
});
