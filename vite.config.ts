/// <reference types="vitest" />
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [wasm(), topLevelAwait(), react(), TanStackRouterVite({ target: "react" }), tailwindcss()],
  // top-level-await + wasm (automerge) require a modern target; es2022 also avoids
  // esbuild's destructuring-downlevel failure on Rolldown output under Vite 8.
  build: {
    target: "es2022",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['fake-indexeddb/auto', './src/test/before.ts', './src/test/setupTest.ts'],
    teardownTimeout: 10000,
  },
});
