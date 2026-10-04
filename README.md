# CLC Vocab Quiz

A Traditional Chinese vocabulary quiz, packaged as a static, installable Progressive Web App. No build step.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The app: the quiz page plus PWA tags (manifest, icons, theme colour) and service worker registration. |
| `clc-vocab-quiz.html` | The original single-file quiz, kept unchanged as a backup. |
| `manifest.webmanifest` | Web app manifest: name, colours, start URL, standalone display, icons. |
| `sw.js` | Service worker. Precaches the app shell; pages are network-first with offline fallback, other assets cache-first with background refresh. Bump `VERSION` to force a cache refresh. |
| `icons/` | App icons: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (Android adaptive) and `apple-touch-icon.png` (iOS, 180×180). |

## Run locally

```sh
npx serve .
```

Then open the URL it prints (usually http://localhost:3000). Service workers need `localhost` or HTTPS, so opening the file directly from disk won't enable offline mode.

## Deploy (Vercel)

1. Import this repository in Vercel.
2. Framework preset: **Other**. Leave the build command empty and the output directory as the repo root.
3. Deploy. Every push to `main` redeploys.

## Install on your phone

- **iPhone (Safari):** open the site, tap **Share**, then **Add to Home Screen**.
- **Android (Chrome):** open the site, tap the ⋮ menu, then **Install app** (or accept the install prompt).

Once installed, the quiz opens full screen and works offline after the first visit.
