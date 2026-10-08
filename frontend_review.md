# Frontend Code Review — Tech Pulse

**Reviewer perspective:** Senior Frontend Developer
**Date:** 2026-10-07
**Scope:** entire repository (`src/`, `e2e/`, build & CI config)
**Method:** static inspection + committed `dist/` artifact analysis. `node_modules` is not installed, so `tsc` / `vitest` / `playwright` could not be executed — every claim below is cited to `file:line` so it can be re-verified.

---

## 1. Executive summary

The project is a **CRA-era React app mid-migration to a Feature-Sliced Design (FSD) architecture on Vite**. The migration direction is right (FSD layers, React Query, Zod, Tailwind, route-level code splitting), but it is roughly **60% complete**, and the seam between the old and new code is where most of the risk lives.

Headline findings:

| # | Severity | Finding |
|---|---|---|
| 1 | 🔴 Critical | **Tailwind v4 is misconfigured** — the built CSS is missing most utilities and *all* responsive variants; layouts are unstyled in production. |
| 2 | 🔴 Critical | **Docker image cannot build** (`Dockerfile` copies `build/`, Vite emits `dist/`), and even fixed it has no `/api` proxy. |
| 3 | 🔴 Critical | **Documented env vars (`REACT_APP_*`) are silently ignored** — Vite only exposes `VITE_*`; production `apiBaseUrl` is always `''`. |
| 4 | 🔴 Critical | **No lint, no format, no typecheck in any script or CI** — `tsconfig` is `strict` but `tsc` is never run; 37 `.jsx` files are unchecked. |
| 5 | 🔴 High | **Broken navigation everywhere** — 6 distinct routes/redirect targets don't exist and dump users on the logged-out landing page. |
| 6 | 🔴 High | **Auth guard race** — hard refresh of any guarded route redirects a valid session to `/login`; `state.from` is written but never read. |
| 7 | 🔴 High | **Password-reset flow cannot complete** — no `/password-reset` route exists, yet the e2e test and email link depend on it. |
| 8 | 🔴 High | **Toast notifications never render** — the event bus has no mounted subscriber, and the payload contract doesn't match. |
| 9 | 🟠 Medium | **Admin mutations are fake** — local-state only, reverted on the next 60s poll; dashboard fabricates metrics when the API fails. |
| 10 | 🟠 Medium | **~3,500 lines of dead code** (~51% of the audited legacy scope) still shipping in the repo, plus 4 unused runtime deps. |
| 11 | 🟠 Medium | **Accessibility: near-zero ARIA on the admin console** (0 `role`/`aria-*` in 502 lines), non-semantic modal, invalid ARIA roles elsewhere. |
| 12 | 🟠 Medium | **Testing is nominal** — 1 unit test, 1 e2e spec that cannot pass as configured, MSW written but never started, no CI. |

---

## 2. Architecture

### 2.1 What's good

- Clear FSD layering exists: `app / shared / entities / features / pages / widgets / processes`.
- **`entities` never import `features`/`pages`/`widgets`; `features` never import `pages`/`widgets`.** The hard rules mostly hold.
- Entities are independent (`software`, `admin`, `support` don't import each other).
- Zod schemas exist for software (`software.schema.ts`), support messages, and upload payloads.
- Route-level `React.lazy` with per-route `<Suspense>`.

### 2.2 Violations of the project's own documented rules

`docs/frontend-modernization-report.md` defines the dependency rules; these break them:

- `src/widgets/app-shell/ui/app-shell.tsx:7` → imports `processes/` (forbidden for widgets).
- `src/pages/auth/model/.tsx:3`, `src/pages/workspace/model/workspace-route-components.tsx:4` → `pages` importing `processes`.
- `src/shared/hooks/useToast.ts:2` → `shared` importing root-level legacy `toastBus.jsx` (`shared` must import only external libs).
- **Page → page imports:** `auth-route-components.tsx:4` imports the landing page; `workspace-route-components.tsx:5-10` imports six sibling page slices. This defeats slice isolation and forces whole-group code splitting.
- **Cross-boundary reach into legacy root:** `entities/software/api/software.queries.ts:2`, `entities/admin/api/admin-dashboard.queries.ts:3`, `features/upload-software/api/categories.api.ts:2`, `features/upload-software/api/upload-artifact.api.ts:2`, `app/router/app-router.tsx:5` all import `../../../API_Wrapper`.

### 2.3 Aliases are defined but never used

`tsconfig.json:23-30` declares `@shared`, `@features`, `@entities`, `@app`, `@processes`, `@widgets` — **zero source files import them** (78 relative `../../../` imports instead), and `vite.config.ts` has **no `resolve.alias`**, so if anyone used one, `vite build` would fail. There is no `@pages` alias at all.

There is also **no enforcement** (no ESLint, no `eslint-plugin-boundaries`, no dependency-cruiser) — the architecture is convention-only.

### 2.4 Dead / broken slice

- `src/pages/upload-software/ui/upload-software-route.tsx:1` imports `features/upload-software/ui/upload-software-page` — a bare specifier that resolves under no alias. The file is dead (0 importers), so it never fails, but it's a landmine.
- Unrouted page slices: `src/pages/project-library/**`, `src/pages/upload-software/**`.

---

## 3. Routing & navigation

File: `src/app/router/app-router.tsx` (75 lines), guard: `src/app/router/require-auth.tsx` (13 lines).

### 3.1 Broken targets (users get bounced to the logged-out landing page)

| Target | Referenced at | Problem |
|---|---|---|
| `/workspace/software` | `app-router.tsx:69`, `command-palette.tsx:7`, `workspace-overview-page.tsx:218` | No such route → `*` → `/` |
| `/workspace/upload-project` | `command-palette.tsx:9`, `workspace-overview-page.tsx:34,209`, `software-registry-page.tsx:61`, `project-library-page.tsx:68` | No such route → `/` |
| `/workspace/resources` | `workspace-route-components.tsx:27,34,117` — **the default branch of `onNavigate`**; also `DashboardLayout.jsx:8,47` | No such route → `/` |
| `/software-library` | `upload-software-page.tsx:280` (post-upload success) | Missing `/workspace/` prefix → `/` |
| `developers`/`api_docs`/`support_ai`/`settings` | `workspace-route-components.tsx:33` explicitly `return;` | 4 of 9 sidebar entries are silent no-ops |
| `/workspace/resources` (admin) | `AdminPage.jsx:306` | Same as above |

### 3.2 Auth guard defects

- **Guard race (functional bug):** `session-store.ts:14` starts `isLoggedIn: false`; `app-router.tsx:26-39` (`SessionBootstrap`) fetches `/api/v1/users/me` *after* first render; `require-auth.tsx:8` evaluates during first render → **hard refresh of any guarded URL redirects a valid session to `/login`**, and the bootstrap's `mounted` flag then discards the session. There is no `isLoading`/`isHydrated` state.
- **`state.from` is written (`require-auth.tsx:9`) and never read anywhere.** Login always navigates to a hardcoded route (`auth-route-components.tsx:39-40`) — post-login intent is discarded.
- **Unguarded routes:** `/workspace/overview`, `/workspace/softwares`, `/workspace/discover` (`app-router.tsx:66-68`) render inside `AppShell` with no guard.
- **No role check on `/workspace/admin`** (`app-router.tsx:62`) — any authenticated user can open it; role is only used to pick the post-login redirect.
- **Password reset cannot complete:** forgot-password issues the request and the e2e spec (`e2e/tests/forgot_password.spec.ts:77-85`) expects `/password-reset/<token>`, but **no such route or page exists** → catch-all → `/`.

### 3.3 Other routing issues

- **11 redundant `lazy()` wrappers over 2 modules** (`app-router.tsx:10-20`) — five imports of `auth-route-components`, six of `workspace-route-components`. Because those barrels re-export *all* their pages, code splitting is effectively per-group, not per-route; any one route pulls in every page of the group.
- **No `errorElement` and no error boundary anywhere in `src/app`** — a failed dynamic import or render throw yields a blank page. `index.html:11-47` ships an inline red error overlay even in production.
- **Two competing shells:** routes `:66-68` use `AppShell` (Tailwind), `:56-63` render the legacy `DashboardLayout` (own `tp-*` CSS + own localStorage theme). Navigation chrome differs between sections; `AppShell` is applied per-route instead of as a layout route with `<Outlet/>`.
- **Two logout implementations with different destinations:** `workspace-route-components.tsx:17-23` → `/`; `app-shell.tsx:30-36` → `/login`.
- **Silent login failure:** `auth-route-components.tsx:41-43` — on `/users/me` failure it calls `setSession(null)` and returns: no navigation, no error message. Dead button.
- `main.tsx:15` wraps in `StrictMode` → `SessionBootstrap` fires the session request twice in dev with no abort.

---

## 4. Data layer

### 4.1 Two HTTP clients with divergent behaviour

| | `httpClient` | `authApi` |
|---|---|---|
| File | `src/shared/api/http-client.ts:4-8` | `src/API_Wrapper.ts:15-18` |
| Base URL | `appConfig.apiBaseUrl \|\| ''` | env **or** hardcoded `http://localhost:8000` via `window.location.origin.includes('localhost:5173')` |
| Timeout | 15 s | **none** |
| 401 refresh | **no** | yes (single-flight) |
| Error toasts | no (interceptor is a pass-through) | yes for network/5xx |
| Used by | `entities/support/api/support.queries.ts:2` | everything else |

Support chat therefore bypasses token refresh and can fail silently on 401 while every other query refreshes. **These must be merged into one client.**

### 4.2 Cache invalidation is completely absent

`grep -rn "invalidateQueries|setQueryData|removeQueries" src` → **0 matches**.

- Upload succeeds (`upload-software-page.tsx:106-129`), navigates, resets the form — and **never invalidates `software.list`**, so registry/overview serve pre-upload data up to `staleTime` (and `refetchOnWindowFocus: false` removes the usual escape hatch).
- Admin mutations (`admin-dashboard.queries.ts:99-101`) mutate local state only — **no API call at all** — while `refetchInterval: 60_000` (`:60`) silently overwrites them a minute later. The UI reports success for changes that never reach the server (`AdminPage.jsx:144-158, 272-296`).

### 4.3 Query keys

`src/shared/lib/query/query-keys.ts` registers only `software.*` and `support.*`. Meanwhile:
- `['admin', 'dashboard']` is hardcoded (`admin-dashboard.queries.ts:60`).
- Categories are filed under `software.all` (`categories.api.ts:22`) — invalidating software would nuke categories too.

### 4.4 Fake-data fallback

`admin-dashboard.queries.ts:5-18` defines `METRIC_SERIES`, `SAMPLE_USERS`, `SAMPLE_SOFTWARE`, `SAMPLE_LOGS`, `SAMPLE_NOTIFICATIONS`, used as fallbacks at `:36,37,40,43` and surfaced as "Offline sample mode" (`:90`). **On API failure the dashboard displays fabricated metrics.** KPI trends are further faked by slicing the hardcoded array (`AdminPage.jsx:123-130`).

### 4.5 Redundant state

`AdminPage` mirrors `query.data` into seven `useState` slots (`admin-dashboard.queries.ts:61-67`, synced at `:70-79`) — a second source of truth that defeats React Query's cache and causes the fake-mutation bug above.

### 4.6 Debug logging in production paths

- `src/shared/api/http-client.ts:16-20` — logs **every** request.
- `src/API_Wrapper.ts:33, 47, 59, 62` — logs every error/refresh (includes URL + response detail).

No `import.meta.env.PROD` guard; these survive into `dist/assets/*.js` (verified).

---

## 5. Auth & session

**Good:** cookie-based auth with `withCredentials: true` on both clients; **no auth token in `localStorage`/`sessionStorage`/`document.cookie` anywhere** (only two theme keys). Low XSS token-theft exposure provided the backend issues HttpOnly cookies.

Issues:
- `session-store.ts:3` — `type SessionUser = Record<string, unknown> | null`. No `User` type or Zod schema; consumers cast (`workspace-route-components.tsx:14` `as any`, `app-shell.tsx:27`).
- Store has no `persist` (correct for cookies) but also no hydration flag → the §3.2 refresh race.
- **No CSRF handling** anywhere in `API_Wrapper.ts:26-83` despite cookie auth.
- `src/cookieTracking.jsx:59` creates a 180-day tracking cookie **even when the user declined** (`:59` calls `getOrCreateTrackingClientId()` regardless of `action`), and the cookie at `:23` has no `Secure` flag. (File is currently dead — see §9.)
- Logout implemented twice with different destinations (§3.3).

---

## 6. Type safety

**`tsconfig.json` is above-average strict** — `strict: true` (`:15`), `noUncheckedIndexedAccess` (`:16`), `exactOptionalPropertyTypes` (`:17`), `noFallthroughCasesInSwitch` (`:18`).

But it is **decorative**:
- `allowJs: true` (`:13`) with **no `checkJs`** → all **37 `.jsx` files** (≈1,960 lines, including routed pages `checkout`, `plans`, `software-details`, `version-details`, plus `AdminPage.jsx` and `DashboardLayout.jsx`) are never checked.
- **No `typecheck` script exists.** `build` is `vite build` (esbuild transpile only, no type gate). Type errors never fail any pipeline.
- `ignoreDeprecations: "6.0"` (`:22`) blanket-suppresses deprecation diagnostics rather than fixing the deprecated `baseUrl`.
- No `tsconfig` covers `vite.config.ts`, `vitest.config.ts`, or `e2e/**`.

**Escape hatches:**
- **45 `any` occurrences** across 12 TS files. Hot spots: `admin-dashboard.queries.ts` (18), `workspace-route-components.tsx` (9), `categories.api.ts` (4).
- **`src/types/globals.d.ts:3` declares `export const authApi: any`** — this single ambient declaration nullifies typing for *every* API response in entities/features/pages. Highest-leverage fix in the codebase.
- 18 `as` casts (6 benign `as const`, 6 `as any`).
- **0 `@ts-ignore` / `@ts-expect-error` / `eslint-disable`** — good; the codebase prefers `any` over suppression, which is at least visible.
- No PropTypes on the `.jsx` components either.

---

## 7. UI kit & styling

### 7.1 Three parallel styling systems

1. **Tailwind utilities** — `widgets/**`, `shared/ui/*.tsx`, workspace pages.
2. **Global `tp-*` tokens** — `src/app/styles/tokens.css` (imported at `main.tsx:5`), including **element-level `input`/`select`/`textarea` selectors (`:102-120`)** that globally restyle every form control and fight both Tailwind and page CSS.
3. **21 co-located/legacy CSS files**, 10 of which are orphaned.

Pages also import root-level CSS across layer boundaries: `login-route-page.tsx:8` / `register-route-page.tsx:8` → `../../../../LoginPage.css`; `landing-route-page.tsx:2` → `../../../../LandingPage.css`.

### 7.2 🔴 Tailwind v4 misconfigured — critical, production-visible

- `package.json:47` installs `tailwindcss@4.3.0` + `@tailwindcss/postcss`, but `src/app/styles/tokens.css:1-3` still uses **v3 directives** (`@tailwind base/components/utilities`).
- **No `@import "tailwindcss"`, no `@config`, no `@plugin`, no `@source` anywhere** (0 matches).
- Consequence: **`tailwind.config.js` is never loaded** (v4 doesn't auto-load a JS config) — its `brand`/`primary`/`muted` colors and font stacks are inert (0 usages of those utilities in src).
- **Evidence in the committed build (`dist/assets/index-nZsrdrwt.css`):**
  - Theme variables absent: no `var(--color*)`, `var(--spacing*)`, `--breakpoint-md` etc.
  - `.text-sm` used 34× in src → **0 occurrences** in dist CSS; `.font-semibold` 27/0; `.gap-2` 21/0; `.text-stone-400` 25/0; `.rounded-lg` 10/0; `.px-4` 4/0.
  - **No responsive variants at all** — `md:grid-cols-2`, `xl:grid-cols-3`, `lg:flex-row` (`workspace-overview-page.tsx:96,190,222,413`, `software-registry-page.tsx:68,115`) → `grep 'md\\:' dist/assets/*.css` = **0**.
  - Preflight not emitted.
- `@tailwindcss/forms` and `@tailwindcss/typography` are installed but registered nowhere (no `plugins` entry, no `@plugin`).
- `autoprefixer` still runs and is the only consumer of the CRA-era `browserslist` block — redundant under v4.
- `.gitignore` does **not** ignore `/dist`, and Tailwind v4 auto source-detection skips only gitignored paths → the stale `dist/assets/*.js` is a candidate source for future scans.

**Fix:** replace the v3 directives in `tokens.css` with `@import "tailwindcss";` + `@config "../../tailwind.config.js";` (or migrate the config to `@theme`), add `@plugin "@tailwindcss/forms";`, and verify with a fresh build.

### 7.3 Component kit duplication

| Old (dead, 0 importers) | New |
|---|---|
| `shared/ui/button/Button.jsx` | `shared/ui/button/button.tsx` — byte-identical variant strings |
| `shared/ui/input/Input.jsx` | `shared/ui/input/input.tsx` — different visual system (`.tp-field` vs Tailwind) |

Dead kit members: `separator.tsx` (0 users), `dialog.tsx` (0 users), `table.tsx` (1 unrouted user).

**Hand-rolled, not Radix:** no `@radix-ui/*` dependency (only transitive via `cmdk`). `dialog.tsx:4-20` is a plain `<div>` — **no portal, no focus trap, no Escape, no `aria-modal`/`role="dialog"`, no focus restoration, no scroll lock, no outside-click**. `select.tsx` is a native `<select>` wrapper. The only accessible dialog is `cmdk`'s `Command.Dialog`.

**Auth screens bypass the kit:** `login-route-page.tsx:137,173` and `register-route-page.tsx:233,243,256,268,293` use raw `<input>` — login therefore has **three** input styles in play (raw + `tokens.css` element selectors + `LoginPage.css`).

**Variant vocabulary inconsistent:** Button = `primary|secondary|ghost|danger`, Badge = `default|success|warning` — no shared token set; Badge has no error state while Button has `danger`.

### 7.4 Brand-color drift

Three definitions of the brand: teal in `button.tsx:7`, `--brand: 171 73% 40%` in `tokens.css:12`, blue `primary: '#2563eb'` in `tailwind.config.js:12`.

### 7.5 Fonts never load

`src/index.css:1` has the Google Fonts `@import` but **`index.css` is never imported** (0 matches). `tokens.css:46` still requests `'Inter', 'Geist'`; `DashboardLayout.css` declares `"Sora", "Manrope"`; `APIDocs.css:238` declares `'JetBrains Mono', 'Fira Code'` — **no `@font-face` and no stylesheet link anywhere**, so all fall back to system fonts.

### 7.6 Command palette

- Button labelled **"CMD+K"** (`app-shell.tsx:120-122`) — **no keyboard listener exists anywhere** (`grep keydown|metaKey|ctrlKey` in `widgets`/`features`/`shared` → 0). The advertised shortcut doesn't work; the palette opens only on click.
- Both palette targets are dead routes (§3.1).

---

## 8. Accessibility

| Location | Issue |
|---|---|
| `src/AdminPage.jsx` (all 502 lines) | **0 `role` / `aria-*` occurrences.** Console with tables, bulk selection, pagination, modal. |
| `AdminPage.jsx:491-499` | Confirm modal: plain `<div>` — no `role="dialog"`, no `aria-modal`, no focus trap, no Escape, no focus restore, backdrop doesn't close. |
| `AdminPage.jsx:457-475` | Three `<select>` with neither `value` nor `onChange` — user input discarded (also a functional bug). |
| `SupportChatPage.jsx:117` | `aria-hidden={!isOpen}` on an `<aside>` that stays mounted and focusable (CSS only translates it off-screen, `SupportChatPage.css:41`) → **focusable descendants inside `aria-hidden`** (WCAG/ARIA violation). |
| `APIDocs.jsx:232-243` | `role="tablist"` whose children have no `role="tab"`, no `aria-selected`, no tabpanel, no arrow-key nav. |
| `APIDocs.jsx:570-583` | `role="listbox"` containing `<button>`s instead of `role="option"`; no `aria-activedescendant`, no arrow keys. |
| `KnowledgeBase/ProductUpdates/SupportCenter` | 0 ARIA each; each card renders an `<a>Open</a>` **and** a `<button>Open</button>` — identical accessible names. |
| `shared/ui/input/input.tsx` | Bare `<input>`: no `<label>`, no `aria-label`, no `aria-describedby` — only `placeholder`. Used by forgot-password. |
| `LoginPage.css:319-321` | Placeholder `#94a3b8` on `#fff` → **≈2.57:1**, fails WCAG AA (4.5:1). This CSS is **live** (imported by login + register). |
| `SupportChatPage.jsx:147` | `<time>` without `dateTime`. |

**Good examples:** `DashboardLayout.jsx` (Escape + overflow restore + `aria-current`/`aria-expanded`), `APIDocs.jsx:412-451` (keydown + IntersectionObserver cleanup), `FeedbackMessage.jsx:23-38` (`role`/`aria-live`/`aria-label`).

No `<img>` tags in scope, no `dangerouslySetInnerHTML`, no `innerHTML`, no `eval` anywhere — **the React escaping story is clean** (the one exception is `document.write` in §10).

---

## 9. Dead code & dependency hygiene

### 9.1 Dead source (0 importers, verified against `dist/` too)

**JS/TSX — ≈1,817 lines:**

| File | Lines |
|---|---|
| `src/APIDocs.jsx` (+ `APIDocs.css` 647) | 726 |
| `src/SupportChatPage.jsx` (+ `.css` 230) | 173 |
| `src/components/Header.jsx` (+ `.css` 89) | 85 |
| `src/cookieTracking.jsx` | 81 |
| `src/ForgotPasswordPage.jsx` | 61 |
| `src/ResourcePage.jsx` | 42 |
| `src/KnowledgeBase.jsx` / `ProductUpdates.jsx` / `SupportCenter.jsx` | 93 (triplicated) |
| `src/components/AppToasts.jsx` | 39 |
| `src/reportWebVitals.jsx` | 13 |
| `src/config.jsx`, `src/legacy/API_Wrapper.ts` | 10 |
| `shared/ui/button/Button.jsx`, `shared/ui/input/Input.jsx` | 34 |

**CSS — ≈1,704 lines:** `App.css`, `index.css`, `ResourcesPage.css`, `Workspace.css`, `ProjectHubPage.css`, `RegistrationPage.css` (827, never imported) + `APIDocs.css`/`SupportChatPage.css` (877, only imported by dead JSX).

**Total ≈ 3,521 lines of dead code.** Plus unrouted slices `pages/project-library/**`, `pages/upload-software/**`, and `public/index.html` (CRA template with unprocessed `%PUBLIC_URL%`).

**Live legacy files (do not delete):** `AdminPage.jsx`, `API_Wrapper.ts`, `toastBus.jsx`, `FeedbackMessage.jsx`, `useDebounce.jsx`, `useAdminData.jsx`, `useSoftwareRegistry.jsx`, `DashboardLayout.jsx`, `setupTests.jsx`.

### 9.2 Dead dependencies

| Package | Status |
|---|---|
| `framer-motion` | 0 imports — and `vite.config.ts:17` still allocates a chunk (`dist/assets/motion-*.js` = **32 bytes**) |
| `react-icons` | 0 imports (only `lucide-react` is used) |
| `web-vitals` | only the dead `reportWebVitals.jsx` |
| `msw` | in **`dependencies`**, `setupWorker` never called, gets a **production chunk that `dist/index.html:10` modulepreloads** |
| `node-fetch` | ESM-only v3, used only by the e2e spec despite Node's global `fetch` |
| `@testing-library/*` ×4 | in `dependencies`, imported by **0** test files (only `setupTests.jsx` registers jest-dom) |

**CRA leftovers:** `eslintConfig` → `react-app` (package not installed), `browserslist`, `overrides` for `webpack-dev-server`/`nth-check`/`jsonpath` (all 3 absent from the lockfile), `.gitignore` `/build` instead of `/dist`, `src/setupTests.jsx` naming, `src/index.css`/`App.css`.

### 9.3 Bundle (committed `dist/`, stale)

```
361,743  charts-*.js        (recharts — 107 KB gz, largest chunk)
279,689  index-*.js
 92,171  forms-*.js
 44,995  tanstack-*.js
 40,402  react-*.js
  1,110  msw-*.js           ← preloaded, contains no msw code
     32  motion-*.js        ← empty stub
```
Preloaded ≈ 372 KB raw / 121 KB gz. **No source maps** (`build.sourcemap` unset). `dist/` is **committed** (54 files), **stale** (last built at `c9c0947`, `src` changed at `2ee0a14`), and **not gitignored**.

---

## 10. Security

| Severity | Finding |
|---|---|
| 🔴 | **DOM-XSS via `document.write`:** `AdminPage.jsx:190,196-222,213` interpolates API data (`item.name`, `item.version`, `item.owner`, `m.label`) into an HTML string with **no escaping**. A package named `<img src=x onerror=…>` executes in the popup origin. |
| 🟠 | `cookieTracking.jsx:59` writes a 180-day cookie **even on "decline"**; `:23` omits `Secure`. (Currently dead code.) |
| 🟠 | `console.log` of URLs/response detail in shipped bundles (`API_Wrapper.ts:33-62`, `http-client.ts:16-20`). |
| 🟠 | `.env` is **not gitignored** (only `.env.local` etc.) and **not in `.dockerignore`** → `COPY . .` bakes it into the build context; Vite inlines `VITE_*` into JS. |
| 🟡 | Cookie auth with **no CSRF token/header handling**. |
| 🟡 | Client-only "permissions" object in `AdminPage.jsx:101-113` gates the UI cosmetically — must be enforced server-side. |
| 🟡 | `src/legacy/API_Wrapper.ts:3-4` is broken — imports the default export but reads named exports off it → `API_BASE_URL`/`authApi` are `undefined`; fully `as any`. (Dead, 0 importers.) |

**Positive:** no token in JS-readable storage; no `dangerouslySetInnerHTML`/`innerHTML`/`eval` anywhere; `rel="noopener noreferrer"` used correctly on external links.

---

## 11. Reliability (leaks, races, error handling)

| Sev | Location | Issue |
|---|---|---|
| High | `ResourcePage.jsx:9-19` | `useEffect([slug])` no abort → stale response overwrites newer slug; `error` never reset |
| High | `SupportChatPage.jsx:46-63` | `loadHistory` from effect + Refresh + post-send, no cancellation → last-resolved-wins, setState after unmount |
| Med | `APIDocs.jsx:356-381, 463-510` | `loadDoc`/`runSearch` unguarded → out-of-order render; one `fetch` per doc per keystroke, no concurrency limit |
| Med | `AppToasts.jsx:19-21` | `setTimeout` never cleared |
| Med | `KnowledgeBase/ProductUpdates/SupportCenter` effects | no cleanup under `StrictMode` → double fetch, setState after unmount |
| Med | `APIDocs.jsx:347-348` | `docCacheRef`/`indexCacheRef` grow unbounded |
| Med | `API_Wrapper.ts:24` | `refreshPromise` never reset to `null` |
| Low | `API_Wrapper.ts:29` | `error.config \|\| {}` fallback would retry a config-less 401 as `authApi({})` |

**Swallowed errors:** `KnowledgeBase.jsx:11-13`, `ProductUpdates.jsx:8`, `SupportCenter.jsx:8` — `catch { setEntries([]) }`; failures indistinguishable from "no results". No error UI, no loading UI, no empty state anywhere in those pages.

**The toast system is broken end-to-end:** `notifyToast` is called from 8 sites (`API_Wrapper.ts:68,74`, `useToast.ts:19`, `software-details-route-page.jsx:206,215`, `checkout-route-page.jsx:72,84,98`) but `AppToasts.jsx` — the only subscriber — **is never mounted**. Even if mounted, the payload contracts don't match (`message`/`timeout` vs `description`/`duration`). **Users see no error toasts at all.**

**Encoding damage:** `src/components/FeedbackMessage.jsx` is **not valid UTF-8** (byte `0xd7` at line 1121) — renders garbage; and `:5` has `success: '?'`, almost certainly a lost `✓`. Two CSS files (`APIDocs.css`, `DashboardLayout.css`) begin with a UTF-8 BOM.

---

## 12. Testing & CI

- **1 unit test** (`software.queries.test.ts`, 2 cases, `normalizeSoftwareResponse` only) for 94 source files. `@testing-library/react|user-event|dom` are installed but imported by **0** files.
- **MSW written but never activated:** `src/mocks/browser.ts:4` exports `setupWorker` — **0 importers**, `worker.start()` never called, and only 2 handlers exist (no auth, categories, upload, admin, checkout).
- **Vitest has no MSW `setupServer`** in setup files → no HTTP mocking available to unit tests. `jsdom@16.7.0` is resolved (a 2021 major, not declared in `package.json`).
- **1 e2e spec that cannot pass:**
  - `playwright.config.ts:7` baseURL is `:3000`; Vite serves `:5173`.
  - The script (`package.json:33`) passes **no `--config`**, and Playwright only auto-discovers config in CWD → `e2e/playwright.config.ts` **is not loaded**.
  - No `webServer` block and no script that serves `dist/` → nothing starts the app.
  - Selectors are wrong: `:41` clicks "Register" (actual: "Create account", `register-route-page.tsx:313`); `:62,16` clicks "Login" (actual: "Sign in", `login-route-page.tsx:200`); `:68` uses `a:has-text` on a `<button>`; `:64,17` expects `text=Welcome` (actual: "TechPulse Dashboard").
  - Requires an undocumented external **MailHog** at `:9`.
- **No CI at all** — no `.github/`, no `*.yml` pipeline.
- **No lint, no format.** `eslintConfig` in `package.json:52-57` references `react-app`, which is not installed (0 matches in the lockfile).

**Missing scripts:** `typecheck`, `lint`, `format`, `preview`, `test:watch`, `test:coverage`, `e2e:ui`.

---

## 13. Build, env & deployment

### 13.1 🔴 Env vars are silently ignored

- `app-config.ts:4` and `API_Wrapper.ts:5` prefer `VITE_API_URL` and fall back to `REACT_APP_API_URL`.
- Vite's default `envPrefix` is `VITE_`; **no `envPrefix`/`define` is configured** → `REACT_APP_*` is never exposed. Proof: **0 occurrences of `REACT_APP` in `dist/assets/*.js`.**
- `.env.example:1-3` and README document only `REACT_APP_*` → **the documented configuration has no effect**; production `apiBaseUrl` is always `''`.
- `REACT_APP_ENV` / `REACT_APP_WEBSITE_NAME` are documented but read by **0** files.
- `src/config.jsx:2-4` reads `process.env.REACT_APP_FEATURE_*` → would throw `ReferenceError: process is not defined` if ever bundled (currently latent, behind dead `Header.jsx`).
- `PLAYWRIGHT_BASE_URL` and `MAILHOG_API` are used but undocumented.

### 13.2 🔴 Dockerfile is broken

```dockerfile
RUN npm run build                 # Vite → dist/
COPY --from=builder /app/build ./build   # ← no such directory; image build fails
CMD ["serve", "-s", "build", "-l", "3000"]
```
Even after fixing the path, `serve -s` performs **no `/api` reverse proxy**, while in production all 32 API calls are relative (`apiBaseUrl === ''`) → everything 404s. The only proxy is `vite.config.ts:29-34` (dev only). There is no nginx/Caddy config. `serve` is also installed unpinned at image build.

`.dockerignore` ignores `build` (should be `dist`), does **not** ignore `dist/`, `.env`, `docs/`, `e2e/`.

### 13.3 Vite config

- `manualChunks` allocates chunks for packages with **zero imports** (`motion` → 32-byte stub; `icons` partly) and puts **`msw` in the production graph, modulepreloaded** (`vite.config.ts:19`, `dist/index.html:10`).
- `react({ include: /\.[jt]sx?$/ })` + `esbuild: { loader: 'tsx' }` (`:5-9`) — every `.ts` file is parsed as TSX (angle-bracket assertions would break; none found).
- No `sourcemap`, no `base`, no `resolve.alias`, no `envPrefix`.
- **No `engines` field / `.nvmrc`** while Vite 7 requires Node ≥20.19.

### 13.4 Misc

- No duplicate route paths (verified all 16).
- `dist/` committed + stale + not gitignored (§9.3).
- `docs/frontend-modernization-report.md:8` claims "CRA scripts and Vite configuration coexist" — `react-scripts` is actually gone from the lockfile; only its artifacts remain. The report is stale.

---

## 14. Notable positives

Worth preserving as the migration continues:

1. **FSD hard rules mostly hold** — entities/features don't reach upward; entities are decoupled.
2. **`tsconfig` strictness is genuinely high** (`strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`) — rare for this stage.
3. **Zero `@ts-ignore` / `eslint-disable`** — no suppression debt.
4. **Auth tokens are cookie-only**, never in JS-readable storage.
5. **No `dangerouslySetInnerHTML` / `innerHTML` / `eval`** anywhere in `src/`.
6. **Zod schemas** exist for software, support, and upload payloads.
7. **Good cleanup patterns** in `DashboardLayout.jsx:74-86`, `APIDocs.jsx:427,450`, `useDebounce.jsx:8`, `toastBus.jsx:12`, `useSoftwareRegistry.jsx:84`.
8. **Markdown is rendered as React nodes**, not HTML strings — XSS-safe by construction.
9. React Query defaults are sensible (`staleTime: 30s`, `retry: 1`, mutations `retry: 0`).

---

## 15. Prioritized action plan

### P0 — broken in production
1. **Fix Tailwind v4** — replace `@tailwind base/components/utilities` in `tokens.css:1-3` with `@import "tailwindcss";`, add `@config "../../tailwind.config.js";`, register `@plugin "@tailwindcss/forms"`, rebuild and diff the CSS output. *(Highest user-visible impact: layouts are currently unstyled.)*
2. **Fix env handling** — add `envPrefix: ['VITE_', 'REACT_APP_']` (or migrate docs/code to `VITE_*`), update `.env.example` + README.
3. **Fix `Dockerfile`** — `COPY --from=builder /app/dist ./dist`; add an nginx/`serve` config with an `/api` proxy; add `dist`/`.env` to `.dockerignore`.
4. **Add `typecheck` + `lint` scripts** — `tsc --noEmit`, ESLint (flat config) with `react-hooks` + `jsx-a11y` + `typescript-eslint`; wire both into a CI workflow. Make `build` depend on `typecheck`.
5. **Fix broken routes** — `/workspace/software`, `/workspace/upload-project`, `/workspace/resources` (or fix the `onNavigate` default), `/software-library` prefix, the 4 swallowed sidebar entries, and `/workspace/resources` in `AdminPage.jsx:306`.
6. **Fix the auth guard race** — add `isHydrated`/`isLoading` to `session-store`, gate `RequireAuth` on it, and consume `state.from` on login.
7. **Add the `/password-reset` route/page** (the emailed link and the e2e spec both depend on it).
8. **Mount the toast subscriber** and unify the payload contract (`message`/`timeout` vs `description`/`duration`), or delete the bus.

### P1 — correctness & security
9. **Merge the two HTTP clients** into one (timeout + refresh + error toasts), and delete `shared/api/http-client.ts`'s `console.log`.
10. **Escape API data in `AdminPage.jsx` `document.write`** (or replace the popup with a React modal).
11. **Make admin mutations real** — server calls + `invalidateQueries`; remove the mirrored `useState` in `admin-dashboard.queries.ts`; remove the fabricated-metrics fallback (or label it unmistakably).
12. **Add `invalidateQueries` after upload** (`software.list`).
13. **Type `authApi` properly** — replace `globals.d.ts:3`'s `any` with typed generics; remove the `(x: any)` mappers in `admin-dashboard.queries.ts`.
14. **Route guards for `/workspace/overview|softwares|discover`** and a server-enforced role check for `/workspace/admin`.
15. **Add an error boundary + `errorElement`.**

### P2 — quality
16. **Delete ~3,500 lines of dead code** (§9.1) and 5 dead deps (`framer-motion`, `react-icons`, `web-vitals`, `node-fetch`, `msw` as a runtime dep) + their `manualChunks` entries.
17. **Adopt Radix/shadcn primitives** for `Dialog`/`Select` (or at minimum add `role`, focus trap, Escape to `dialog.tsx`); delete `Button.jsx`, `Input.jsx`, `separator.tsx`.
18. **Fix a11y** — ARIA on `AdminPage` + its modal, valid `tablist`/`listbox`, un-`aria-hidden` the chat panel, label the shared `Input`, fix placeholder contrast in `LoginPage.css:319-321`.
19. **Fix the e2e spec** (selectors, baseURL, `--config` in the script, add `webServer`) and add specs for login/session/registry/upload/admin.
20. **Wire up MSW** (dev-only `worker.start()` + vitest `setupServer`) or remove it.
21. **Use the FSD aliases** (`@shared/…` etc.) or delete them from `tsconfig` and add matching Vite aliases.
22. **Fix file encoding** — `FeedbackMessage.jsx` (invalid UTF-8 byte + `'?'` success icon), strip BOMs from `APIDocs.css` and `DashboardLayout.css`.
23. **Load the fonts** — move the Google Fonts import into `tokens.css` or `index.html`; remove dead font stacks.
24. **Unify theme stores** (`tp-theme` vs `adm-theme`) and consolidate the triplicated resource pages + the two Markdown renderers.
25. **Untrack `dist/`**, add `/dist` to `.gitignore`, rebuild, and stop committing artifacts.
