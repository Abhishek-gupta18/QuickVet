<div align="center">
  <img width="1000" alt="QuickVet Preview" src="<img width="1847" height="1072" alt="image" src="preview.jpg" />
" />
</div>

# QuickVet

QuickVet (formerly VetFinder) is a development demo that helps locate nearby veterinarians, request emergency assistance, and book home visits. This repo contains the frontend (React + Vite) and a small Express-based server used for development.

## Preview

The image above shows a preview of the app running locally (hero section, map and CTAs). To see the live preview run the server and open http://localhost:3000 in your browser.

## Run locally

Prerequisites:
- Node.js (16+ recommended)

Quick start:

1. Install dependencies

```bash
npm install
```

2. Start the dev server

```bash
npm run dev
```

3. Open the app in your browser

```
http://localhost:3000
```

Notes:
- The app stores session data under `quickvet_user` / `quickvet_token` in `localStorage` when you sign in.
- The development server launches Vite in middleware mode and serves the SPA alongside the server APIs.
- If you want a real screenshot included, replace `assets/preview.svg` with `assets/preview.png` (same name) and commit.

If you'd like, I can replace the SVG with the actual PNG screenshot I captured earlier and commit it into `assets/`.
