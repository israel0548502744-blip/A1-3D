import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base is "./" so the built site works both on GitHub Pages (a subpath) and
// inside the Android app bundle.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { target: "es2020", outDir: "dist" },
});
