import { build } from "vite";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = path.join(projectRoot, "_site");
const ssrRoot = path.join(projectRoot, "work", "pages-build", "ssr");
const configFile = path.join(projectRoot, "static-home", "vite.config.mjs");

const publicAssets = [
  "Jiawei_Guo_CV.pdf",
  "favicon.svg",
  "fonts/journal-serif.woff2",
  "fonts/journal-serif-italic.woff2",
  "fonts/CormorantGaramond-OFL.txt",
  "fonts/SmileySans-Oblique.ttf.woff2",
  "fonts/SmileySans-OFL.txt",
  "photos/0cd9ca70-1ea6-41f1-b301-9c0f15c629ce.jpg",
  "photos/thumbs/0cd9ca70-1ea6-41f1-b301-9c0f15c629ce.jpg",
  "photos/76fefc7c-7c0d-454d-8a6c-a3fb683cbf15.jpg",
  "photos/thumbs/76fefc7c-7c0d-454d-8a6c-a3fb683cbf15.jpg",
];

try {
  await build({
    configFile,
    build: {
      ssr: path.join(projectRoot, "static-home", "entry-server.tsx"),
      outDir: ssrRoot,
      emptyOutDir: true,
      rollupOptions: { output: { entryFileNames: "entry-server.mjs" } },
    },
  });
  const { render } = await import(pathToFileURL(path.join(ssrRoot, "entry-server.mjs")).href);
  const markup = render();

  await build({ configFile });
  const indexPath = path.join(siteRoot, "index.html");
  const template = await readFile(indexPath, "utf8");
  if (!template.includes("<!--ssr-outlet-->")) throw new Error("Missing homepage SSR outlet.");
  await writeFile(indexPath, template.replace("<!--ssr-outlet-->", () => markup));

  for (const relative of publicAssets) {
    const destination = path.join(siteRoot, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(path.join(projectRoot, "public", relative), destination);
  }
  // Optional code-authored fallback supplied by the homepage scene.
  try { await cp(path.join(projectRoot, "public", "desk-scene-fallback.svg"), path.join(siteRoot, "desk-scene-fallback.svg")); }
  catch (error) { if (error.code !== "ENOENT") throw error; }

  await writeFile(path.join(siteRoot, ".nojekyll"), "");
  await writeFile(path.join(siteRoot, "robots.txt"), "User-agent: *\nAllow: /\nSitemap: https://van-lord.github.io/sitemap.xml\n");
  await writeFile(path.join(siteRoot, "sitemap.xml"), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://van-lord.github.io/</loc></url></urlset>\n');
  await writeFile(path.join(siteRoot, "404.html"), `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found — Jiawei Guo</title><meta name="description" content="Return to Jiawei Guo’s homepage or photo gallery."><link rel="canonical" href="https://van-lord.github.io/"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><meta property="og:title" content="Jiawei Guo"><meta property="og:description" content="Research and photography."><meta property="og:image" content="https://van-lord.github.io/photos/76fefc7c-7c0d-454d-8a6c-a3fb683cbf15.jpg"><style>body{margin:0;background:#f3f0e8;color:#292923;font:18px/1.7 Georgia,serif}main{max-width:40rem;padding:15vh 8vw}h1{font-size:3rem;font-weight:400}a{color:inherit;text-underline-offset:5px}nav{display:flex;gap:2rem}</style></head><body><main><p>Jiawei Guo / 404</p><h1>This page isn’t here.</h1><p>You can return home or visit the photographic archive.</p><nav><a href="/">Home</a><a href="https://jiawei-guo-vision.jiaweiguonice.chatgpt.site/gallery">Gallery</a></nav></main></body></html>\n`);
  console.log("Built public homepage for GitHub Pages. The existing live gallery is preserved on its original host.");
} finally {
  await rm(ssrRoot, { recursive: true, force: true });
}
