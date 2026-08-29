# Tech Pulse Frontend

React frontend for Tech Pulse, built with Vite.

## Getting Started

1. Install dependencies:
```bash
npm install
```
2. Start the dev server:
```bash
npm run dev
```

## Scripts

- `npm run dev`: start the Vite development server.
- `npm start`: alias for `npm run dev`.
- `npm run build`: build production assets into `dist/`.
- `npm test`: run Vitest.
- `npm run e2e`: run Playwright tests in Chromium.

## Environment

Copy or adjust the env file for local development:

```env
REACT_APP_API_URL=http://127.0.0.1:8000
REACT_APP_ENV=development
REACT_APP_WEBSITE_NAME=Tech Pulse
```

For production, update `REACT_APP_API_URL` to the deployed backend endpoint.
