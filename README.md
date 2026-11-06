# Jiawei Guo

Personal homepage for research and photography. Published at https://van-lord.github.io/.

## Build

Requires Node.js 22.13 or newer.

```sh
npm ci
npm run build
npm run check
```

The static output is `_site/`. GitHub Actions publishes it on pushes to `main`.

Edit `app/components/JournalHome.tsx` for the homepage, `public/journal.css` for styles, `app/components/DeskScene.tsx` for the interactive workspace, and `data/portfolio.json` for publication records. `static-home/site-data.ts` contains the public contact and profile links.

## Photography archive

The homepage links to the existing live [Gallery](https://jiawei-guo-vision.jiaweiguonice.chatgpt.site/gallery). Its design, fluid effects, albums and Studio updates remain unchanged on the original host.

## Assets

Photographs and CV belong to Jiawei Guo. Cormorant Garamond and Smiley Sans are included with their OFL licenses in `public/fonts/`. The scene is authored in Three.js and has an SVG fallback.
