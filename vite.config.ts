import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [wasm(), react(), tanstackRouter({ target: "react" }), tailwindcss()],
  // Vite 8 switched to Rolldown and made CJS default-import interop "consistent"
  // (default = full module.exports), which breaks CJS deps that use the
  // `exports.default` + `__esModule` pattern without an ESM build (e.g.
  // redux-persist). Restore the pre-Vite-8 behavior.
  legacy: {
    inconsistentCjsInterop: true,
  },
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
