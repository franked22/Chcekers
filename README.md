# Checkers

Static Vite app. **Do not put `GEMINI_API_KEY` in Vite `define()`, client code, or GitHub Actions build env.** The key would be public in the JS bundle.

## Opponent AI

- **Production (GitHub Pages):** heuristic fallback. No API key is used or shipped.
- **Local Gemini (optional):** copy `.env.example` to `.env`, set `GEMINI_API_KEY`, then run `npm run gemini-proxy` (127.0.0.1 only) and `npm run dev`. The browser calls `POST /api/gemini`; Vite proxies that to the local process.

## Pages deploy note

The GitHub token used for this patch cannot update workflow files. After merge, change `.github/workflows/static.yml` so it runs `npm ci && npm run build` and uploads `path: dist` (not `path: '.'`). Do not inject `GEMINI_API_KEY` at build time.
