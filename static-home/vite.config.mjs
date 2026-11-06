import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// This standalone build includes only the public homepage. The original
// gallery and its management tools continue running on their existing host.
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  publicDir: false,
  base: "/",
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL("../_site", import.meta.url)),
    emptyOutDir: true,
    sourcemap: false,
    target: "es2022",
  },
});
