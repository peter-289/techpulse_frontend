# Tech Pulse Frontend

React + Vite frontend for Tech Pulse, organised with Feature-Sliced Design.

## Getting started

```bash
npm install
npm run dev
```

The dev server runs on <http://127.0.0.1:5173> and proxies `/api` to
`http://localhost:8000`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server. |
| `npm start` | Alias for `npm run dev`. |
| `npm run build` | Type-check then build production assets into `dist/`. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run lint` | ESLint over the whole repo. |
| `npm test` | Unit + integration tests (Vitest). |
| `npm run test:coverage` | Tests with coverage thresholds enforced. |
| `npm run e2e` | Playwright specs (hermetic; starts the dev server). |
| `npm run e2e:ui` | Playwright in UI mode. |

## Environment

Copy `.env.example` to `.env` and adjust as needed:

```env
VITE_API_URL=
VITE_ENV=development
VITE_WEBSITE_NAME=Tech Pulse
```

- `VITE_API_URL` — backend base URL. Leave empty for same-origin requests
  through the `/api` proxy.

## Docker

```bash
docker build -t techpulse-frontend .
docker run --rm -p 8080:8080 techpulse-frontend
```

The image serves the built `dist/` with nginx and reverse-proxies `/api/*`
to a `backend:8000` service. A `/healthz` endpoint is available for probes.

## Testing

- Unit/integration tests live beside their sources (`*.test.ts[x]`) and run with
  Vitest + Testing Library + MSW.
- End-to-end specs live in `e2e/tests` and use Playwright with mocked API routes,
  so they run without a live backend.
