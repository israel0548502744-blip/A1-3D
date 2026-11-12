import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };

// base is "./" so the built site works both on GitHub Pages (a subpath) and
// inside the Android app bundle (assets/www).
export default defineConfig({
  base: "./",
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: { target: "es2020", outDir: "dist" },
});
