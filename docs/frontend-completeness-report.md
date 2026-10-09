# Frontend Completeness Assessment — TechPulse

**Date:** 2026-10-09
**Scope:** `src/` (105 files), `e2e/`, build & deployment config
**Method:** static inspection of every source file, route table extraction, API-surface inventory, dependency and primitive usage analysis, plus verification runs (`tsc --noEmit`, `vite build`, `vitest run`).

---

## 1. Executive summary

The frontend is a **functionally broad but unevenly finished** application. The migration from a hand-rolled page-state router to a route-first, FSD-structured workspace shell is essentially complete, and the build/type-check pipeline is green. However, a large share of the newer workspace pages are **presentational shells backed by hardcoded data**, the billing flow is intentionally stubbed, and the quality gates (tests, CI) are close to absent.

**Overall completeness estimate: ~62%**

| Dimension | Weight | Score | Status |
|---|---|---|---|
| Foundation / architecture | 15% | 88% | Good — FSD layers, aliases, query boundaries exist |
| Routing & navigation | 12% | 95% | Good — single shell, canonical nav model |
| Authentication & session | 12% | 80% | Partial — reset/verify pages missing |
| Data layer | 15% | 55% | Mixed — real entities vs mock pages |
| Feature surface | 20% | 60% | Mixed — registry/upload real, sections mock |
| Design system / styling | 10% | 65% | Partial — tokens good, Tailwind v4 not fully wired |
| Testing & CI | 10% | 10% | Very weak — 2 tests, no CI |
| Build / env / deploy | 6% | 70% | Partial — Docker/env improved, dist still tracked |

**Verification (current HEAD + working tree):**
- `npx tsc --noEmit` → clean
- `npm run build` → succeeds (~2.9k modules)
- `npm test` → 1 file / 2 tests pass

---

## 2. Codebase inventory

| Metric | Value |
|---|---|
| Source files | 105 |
| TS/TSX/JS/JSX lines | 7,882 |
| CSS lines | 5,657 |
| `.tsx` / `.ts` / `.jsx` / `.css` | 38 / 31 / 20 / 16 |
| Route path entries | 25 (15 real pages + 4 redirects + catch-all + public) |
| Distinct API endpoints referenced | 18 |
| Unit test files | 1 (2 tests) |
| E2E specs | 1 (stale) |
| CI workflows | 0 |

---

## 3. Architecture (FSD)

The Feature-Sliced Design layer layout is in place and mostly respected:

- `app/` — router, providers, global styles (`app-router.tsx`, `query-provider.tsx`, `tokens.css`, `content.css`)
- `pages/` — route compositions (auth, public/landing, workspace, workspace-overview, workspace-sections, software-registry, upload-workspace, software-details, version-details, plans, checkout)
- `widgets/` — `workspace-shell` (sidebar/header/shell) and `help-centre`
- `features/` — `command-palette`, `upload-software`
- `entities/` — `software`, `admin`, `support`
- `processes/` — `auth` session store
- `shared/` — api, config, hooks, lib, navigation, store, ui

**Gaps**
- Legacy root modules still ship alongside FSD: `AdminPage.jsx` (499 lines), `components/`, `hooks/useSoftwareRegistry.jsx`, `hooks/useDebounce.jsx`, `constants/`, `types/modules.d.ts`, and root `LandingPage.css` / `LoginPage.css`.
- Alias adoption is partial: `@/` and `@shared/` are used, but `@features/@entities/@widgets/@processes` are largely unused (most imports are relative).
- `src/legacy/` is an empty, dead directory.
- `src/types/modules.d.ts` declares a module (`./toastBus`) that no longer exists.

---

## 4. Routing & navigation — 95% complete

All routes are registered in `src/app/router/app-router.tsx` against a single `WorkspaceShell` layout route guarded by `RequireAuth`:

- Public/auth: `/`, `/register`, `/login`, `/forgot-password`, `/check-email`
- Canonical workspace: `/workspace/overview|softwares|discover|upload-software|versions|artifacts|security|audit|analytics|settings`
- Feature routes inside the shell: `/workspace/software-details|version-details|plans|checkout|admin`
- Legacy redirects: `/workspace`, `/workspace/software-registry`, `/workspace/software-library`, `/workspace/resources`
- Catch-all → `/`

Navigation is centralised in `src/shared/navigation/workspace-navigation.ts` (single source of truth consumed by sidebar, command palette, header breadcrumbs). The old `DashboardLayout`, `app-shell`, `AdminSidebar` and the manual page-state router are removed.

**Remaining gaps**
- 4 routes (`software-details`, `version-details`, `plans`, `checkout`) carry data via `location.state` only — deep links / refreshes render an empty state.
- No `errorElement` / route error boundary.
- `RequireAuth` blocks render with `null` (blank screen) during hydration rather than a loading state.

---

## 5. Authentication & session — 80% complete

- Single Zustand session store (`processes/auth/model/session-store.ts`) with `isLoggedIn`, `user`, `isHydrated`.
- `SessionBootstrap` calls `/api/v1/users/me` and gates `RequireAuth` on hydration (fixes the earlier refresh race).
- Login uses RHF + Zod, form-urlencoded POST to `/api/v1/auth/login`, then refetches profile.
- Unified HTTP client with `withCredentials`, 401 refresh-and-retry via `/api/v1/auth/refresh`, and prompting to `/login` on refresh failure.
- Logout calls `/api/v1/auth/logout` and clears session.

**Missing**
- **Password-reset completion page** (`/password-reset/:token`) does not exist, although the forgot-password flow requests an email that links to it.
- **Email-verification page** (`/email-verification?token=`) does not exist.
- Registration posts to `/api/v1/users` but there is no verification-completion UI.
- No role-based route guard for `/workspace/admin` (guarded only inside the page component).

---

## 6. Data layer — 55% complete

**Real (TanStack Query + Zod):**

| Entity | File | Endpoints |
|---|---|---|
| Software | `entities/software/api/software.queries.ts` | list, versions, admin summary, download URL |
| Admin dashboard | `entities/admin/api/admin-dashboard.queries.ts` | users, admin packages, summary, alerts, audit-events |
| Support | `entities/support/api/support.queries.ts` | support-chat messages *(no consumer)* |
| Categories | `features/upload-software/api/categories.api.ts` | categories |
| Upload | `features/upload-software/api/upload-artifact.api.ts` | multipart upload |

**Strengths**
- Query-key factory (`shared/lib/query/query-keys.ts`), normalized `ApiError`, single HTTP client.
- Zod parsing at adapter boundaries for software/versions/summary.

**Gaps**
- **No query invalidation after upload** — the registry list is not refreshed after a successful upload (`invalidateQueries` is never called anywhere).
- Admin mutations (`updateUserStatus`, `assignUserRole`, approve/reject/quarantine, `markNotificationRead` aside) are **local-state only** and revert on the next 60s poll.
- `useSupportMessages` exists but has no UI consumer.
- Legacy `hooks/useSoftwareRegistry.jsx` duplicates entity logic and still powers 3 feature pages.
- MSW (`src/mocks/`) is installed but **never started** (`worker.start()` / `setupServer` absent), so it is dead weight in runtime.

---

## 7. Feature completeness matrix

| Page / route | Data source | Status |
|---|---|---|
| Landing `/` | Static content | ✅ Complete (marketing) |
| Register `/register` | Live API | ✅ Complete |
| Login `/login` | Live API | ✅ Complete |
| Forgot password `/forgot-password` | Live API | ⚠️ Sends email; no reset page |
| Check email `/check-email` | Static | ✅ Complete |
| Overview `/workspace/overview` | Live API (`useSoftwareList`, `useSoftwareAdminSummary`) | ✅ Complete |
| My Software `/workspace/softwares` | Live API | ✅ Complete |
| Discover `/workspace/discover` | Live API (same list, client filter) | ✅ Complete |
| Upload Software `/workspace/upload-software` | Live API | ✅ Complete |
| Software details `/workspace/software-details` | Live API + legacy hook | ⚠️ State-dependent, refresh-empty |
| Version details `/workspace/version-details` | Live API + legacy hook | ⚠️ State-dependent, refresh-empty |
| Versions `/workspace/versions` | **Hardcoded rows** | 🟡 Shell only |
| Artifacts `/workspace/artifacts` | **Hardcoded rows** | 🟡 Shell only |
| Security `/workspace/security` | **Hardcoded rows** | 🟡 Shell only |
| Audit `/workspace/audit` | **Hardcoded entries** | 🟡 Shell only |
| Analytics `/workspace/analytics` | **Hardcoded bars/table** | 🟡 Shell only |
| Settings `/workspace/settings` | **Hardcoded profile** ("Alex Devs") | 🟡 Shell only; save is a toast |
| Plans `/workspace/plans` | Static `PLANS` array | 🟡 Presentation only |
| Checkout `/workspace/checkout` | Live (project purchases) | 🟡 Project flow wired; plan billing explicitly deferred |
| Admin `/workspace/admin` | Live API | ⚠️ Read real, writes local-only |
| Help Centre (widget) | Canned regex replies | 🟡 Prototype assistant |
| Command palette | Nav model | ✅ Complete |

Legend: ✅ complete · ⚠️ functional with gaps · 🟡 visual shell / placeholder behavior.

---

## 8. Design system & styling — 65% complete

- Central token layer in `app/styles/tokens.css` with light/dark via `data-theme`; shared content primitives extracted to `app/styles/content.css`; `.sec-*` layout for workspace sections; shell styles in `workspace-shell.css`.
- Global theme store (`theme-store.ts`) persists to `localStorage` and mirrors to `<html data-theme>`; the header toggle and Settings page share it.

**Gaps**
- **Tailwind v4 wiring is incomplete**: `tokens.css` uses `@import "tailwindcss";` (good) but there is **no `@config "../../tailwind.config.js";`** and **no `@plugin "@tailwindcss/forms";`**, despite both existing in `devDependencies`. Custom theme colors (`background`, `brand`, `primary`, `muted`) and the forms plugin therefore do not take effect.
- Fonts (`Inter`, `Geist`, `Cascadia Code`) are referenced in `tailwind.config.js` but never loaded, so stacks fall back silently.
- Three styling lineages coexist: FSD primitives, `.sec-*` / `.wsp-*` / `.tp-*` CSS, and legacy CSS (root `LandingPage.css`, `LoginPage.css`, `AdminPage.css`).
- Unused primitives: `shared/ui/separator`, `shared/ui/table`, `shared/ui/textarea`, `shared/ui/dialog` (dialog is exported but imported nowhere; `cmdk`'s `Command.Dialog` is used instead).

---

## 9. State management — 85% complete

Boundaries are largely correct: TanStack Query for server state; Zustand for ephemeral UI (`ui-store`, `theme-store`, `help-messages-store`, session). `ui-store` covers sidebar, command palette and help centre. Remaining exception: the admin dashboard mirrors query results into local `useState` and mutates them locally.

---

## 10. Testing & CI — 10% complete

- **Unit:** a single file `entities/software/api/software.queries.test.ts` (2 tests). No component, hook, or integration tests.
- **E2E:** one spec (`e2e/tests/forgot_password.spec.ts`) that depends on **routes that do not exist** (`/email-verification`, `/password-reset/:token`), old smoke text ("Welcome"), and a MailHog/Mail API service. It cannot pass as written.
- **CI:** none (`.github/` absent). No lint script, no typecheck script in `package.json`, no `webServer` in the Playwright config.
- **MSW:** handlers written but not wired into dev or the test setup.

---

## 11. Build, environment & deployment — 70% complete

- `vite.config.ts`: React plugin, `@` + FSD aliases, `/api` dev proxy to `localhost:8000`, `manualChunks`, production `console/debugger` stripping. ✅
- `tsconfig.json` is strict (`noUnusedLocals`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`). ✅
- Env handling improved: `app-config.ts` reads `VITE_API_URL`; `.env.example` uses `VITE_*`. ✅
- `Dockerfile` now copies `dist/` and serves it. ✅
- **`dist/` is still committed** (34 tracked files) and churns on every build.
- Docker has no `/api` reverse-proxy to the backend (the built image only serves static files).
- No `typecheck`/`lint` scripts; `build` does not depend on typechecking.

---

## 12. Accessibility

Strong in the new shell (sidebar landmarks, `aria-current`, focus return, Escape handling, `aria-expanded`, skip link in admin). Weak spots:

- `shared/ui/dialog/dialog.tsx` has no `role`, focus trap, or Escape handling.
- Admin usage relies on non-semantic tab buttons rather than a real `tablist`/`tabpanel` relationship.
- Help Centre panel is a persistent `aria-hidden`/`inert` aside (acceptable) but the FAB has no visible label text.
- Placeholder contrast in legacy auth CSS was flagged previously and is unverified.

---

## 13. Dead code, duplication & hygiene

- Orphaned/duplicated: `hooks/useSoftwareRegistry.jsx` (duplicates entities), `hooks/useAdminData.jsx` (one-line re-export), `hooks/useDebounce.jsx`.
- Stale types: `src/types/modules.d.ts` references the removed `./toastBus` module.
- Empty `src/legacy/` directory.
- Unused UI primitives (separator, table, textarea, dialog) and `useSupportMessages`.
- Commented-out debug left in `software.queries.ts:52,55`; 17 `// CORRECTION:` developer notes in `upload-software-page.tsx`.
- `dist/` artifact committed to VCS.

---

## 14. Prioritized backlog to reach "complete"

**P0 — user-visible correctness**
1. Add `/password-reset/:token` and `/email-verification` routes + pages (unblocks reset/verify and e2e).
2. Replace hardcoded data in Versions, Artifacts, Security, Audit, Analytics with real endpoints (or clearly label them as "preview/examples").
3. Wire Settings to the session profile and a real save endpoint.
4. Add `invalidateQueries(['software','list'])` after upload.

**P1 — correctness, security, DX**
5. Route-guard `/workspace/admin` on role; add an error boundary + `errorElement`.
6. Make admin mutations call the API and invalidate queries; remove the local mirror.
7. Persist `software-details`/`version-details` selection in the URL (or refetch by id) so refresh works.
8. Delete the legacy `useSoftwareRegistry` hook and migrate the last 3 pages to entities.
9. Fix Tailwind v4: add `@config` + `@plugin "@tailwindcss/forms"`; load fonts.

**P2 — quality & hygiene**
10. Add `typecheck`/`lint` scripts and a CI workflow; make `build` depend on `typecheck`.
11. Add real unit/integration tests and rewrite the e2e spec against current routes.
12. Untrack `dist/`; add a Docker `/api` proxy.
13. Complete plan-billing checkout via a provider adapter.
14. Remove dead primitives/notes, empty `src/legacy/`, and the stale `modules.d.ts`; either wire MSW or delete it.

---

## 15. Conclusion

The **infrastructure and navigation redesign are complete and healthy**, and the **core software-management flow (overview, registry, discover, upload) is production-shaped**. The platform is not yet feature-complete: five workspace sections and Settings are static mockups, billing is deliberately stubbed, password reset/email verification are unrouted, and automated testing/CI is effectively absent. Addressing the P0/P1 items above would lift overall completeness from ~62% to roughly 85%+.
