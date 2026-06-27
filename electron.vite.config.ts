import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "electron/main/index.ts"),
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "electron/preload/index.ts"),
        },
        output: {
          format: "cjs",
          entryFileNames: "[name].cjs",
        },
      },
    },
  },
  renderer: {
    // Restore pre-Vite-8 CJS default-import interop (see vite.config.ts).
    legacy: {
      inconsistentCjsInterop: true,
    },
    root: ".",
    build: {
      // wasm + native top-level await require a modern target; es2022 also avoids
      // esbuild's destructuring-downlevel failure on Rolldown output under Vite 8.
      // With es2022, Vite 8 handles top-level await natively, so
      // vite-plugin-top-level-await is no longer needed here.
      target: "es2022",
      rollupOptions: {
        input: {
          index: resolve(__dirname, "index.html"),
        },
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
    plugins: [
      wasm(),
      react(),
      tanstackRouter({ target: "react" }),
      tailwindcss(),
    ],
  },
});
