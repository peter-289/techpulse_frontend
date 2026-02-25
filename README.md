# Tech Pulse Frontend

React frontend for Tech Pulse, built with Create React App.

## Getting Started

1. Install dependencies:
```bash
npm install
```
2. Start development server:
```bash
npm start
```

## Scripts

- `npm start`: run local development server.
- `npm run build`: build optimized production assets into `build/`.
- `npm test`: run tests once and pass when no tests are present.
- `npm run test:ci`: CI-safe test command (single process).
- `npm run e2e`: run Playwright tests in Chromium.

## Production Deployment Checklist

1. Set production environment variables in `.env.production`:
```env
REACT_APP_API_URL=https://api.your-domain.com
REACT_APP_ENV=production
REACT_APP_WEBSITE_NAME=Tech Pulse
```
2. Validate before release:
```bash
npm run build
npm run test:ci
```
3. Deploy static `build/` output (or build and run via Docker).
