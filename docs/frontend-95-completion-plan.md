# Frontend 95% Completion Plan (for review)

**Date:** 2026-10-09
**Target:** ≥95% on every parameter in `docs/frontend-completeness-report.md`
**Status:** PROPOSED — awaiting sign-off before implementation

---

## 1. Definition of done

"95%" means each parameter below passes its acceptance criteria, verified by the commands in §10.

| Parameter | Now | Target | Acceptance signal |
|---|---|---|---|
| Foundation / architecture | 88% | ≥95% | No legacy modules outside FSD; aliases used consistently; `src/legacy` and stale `.d.ts` gone |
| Routing & navigation | 95% | ≥98% | Deep-linkable details routes; error boundary; hydration UI; role guard; reset/verify routes |
| Authentication & session | 80% | ≥95% | Register→verify→login and forgot→reset→login flows complete and routed |
| Data layer | 55% | ≥95% | Every server read via TanStack Query + Zod; mutations invalidate; no local-only writes; MSW wired |
| Feature surface | 60% | ≥95% | No hardcoded page data; Settings persists; help centre talks to API; billing has a real flow or explicit provider adapter |
| Design system / styling | 65% | ≥95% | Tailwind v4 fully configured; fonts load; documented primitives; unused CSS/primitives removed |
| Testing & CI | 10% | ≥95% | Unit+integration suites with coverage; e2e specs pass; lint+typecheck+test+build in CI |
| Build / env / deploy | 70% | ≥95% | `dist` untracked; Docker serves SPA with `/api` proxy; env documented; `build` gated on typecheck |

---

## 2. Guiding principles

1. **Frontend-only contract first.** For any backend endpoint that may not exist, I will define a typed adapter with the proposed contract and a graceful, clearly-labelled fallback — so the frontend is complete even if the backend lags.
2. **No behaviour regressions.** Existing working flows (login, registry, upload) keep working at every phase.
3. **Incremental, phase-by-phase, each phase independently shippable and green.**
4. **Tests travel with code.** Each phase adds the tests that prove it.

---

## 3. Assumptions & decisions needed (please vet)

**A1. Backend endpoints** — I could not find frontend calls for these; please confirm existence/contract or approve proposed contracts:
- Password reset confirm: `POST /api/v1/auth/password-reset/confirm` `{ token, new_password }`
- Email verification: `GET /api/v1/auth/email-verification?token=...` (or `POST .../confirm`)
- Workspace artifacts: derive from software versions **or** `GET /api/v1/software-management/artifacts`
- Workspace security scans: derive from version `artifact_status`/`quarantine_reason` **or** `GET /api/v1/security/scans`
- Workspace audit: reuse `GET /api/v1/admin/audit-events` **or** `GET /api/v1/audit-events`
- Workspace analytics: derive from software `download_count` + audit download events **or** `GET /api/v1/analytics`
- Admin mutations: `PATCH /api/v1/users/{id}` (status/role), `PATCH /api/v1/software-management/admin/packages/{id}` (approve/reject/quarantine)

**A2. `.jsx` legacy pages** — Convert `software-details`, `version-details`, `checkout`, `plans`, `AdminPage` to `.tsx` (more type safety, more churn) **or** keep `.jsx` and only relocate them? **Recommend: convert**, since strict TS is a scorecard item.

**A3. Plan billing** — *DECIDED: out of scope.* Plans stay a static catalogue; only project purchase is live.

**A4. MSW** — *DECIDED: tests only.* No `VITE_ENABLE_MOCKS` dev hook; mocks used exclusively by Vitest.

**A5. E2E in CI** — *DECIDED: manual/dispatch only.* CI runs lint/typecheck/unit/build; e2e is `workflow_dispatch` against a compose stack.

**A6. Coverage threshold** — *DECIDED: 85% lines* on `entities`, `shared/lib`, `processes`, and key `pages`/`widgets`.

## 3a. Decisions recorded (signed off 2026-10-09)

| # | Decision |
|---|---|
| A1 | Derive workspace data from existing endpoints; typed adapters + labelled fallbacks where endpoints are missing |
| A2 | Convert all legacy `.jsx` pages to `.tsx` |
| A3 | Payment provider / plan billing **out of scope** |
| A4 | MSW **tests only** |
| A5 | Playwright e2e **manual/dispatch only** |
| A6 | Coverage gate **85% lines** |

---

## 4. Phase plan

### Phase 0 — Baseline, guardrails, VCS hygiene
- `git rm -r --cached dist` (already in `.gitignore`); rebuild confirms it is ignored.
- `package.json` scripts: add `typecheck` (`tsc --noEmit`), `lint` (`eslint .`), `test:coverage`; `build` → `npm run typecheck && vite build`.
- Add `.github/workflows/ci.yml` skeleton (node 20; install, lint, typecheck, test, build).
- Add `eslint.config.js` (flat): `@typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`.
- Add `@vitest/coverage-v8`.
- Remove stale `src/types/modules.d.ts`; delete empty `src/legacy/`.
- **Exit:** lint+typecheck+test+build all green in CI.

### Phase 1 — Architecture consolidation (FSD)
Move legacy root modules into their slices and adopt aliases.
- `src/AdminPage.jsx|css` → `src/pages/admin/ui/admin-page.{tsx,css}`
- `src/components/admin/*` → `src/pages/admin/ui/sections/*` and `src/pages/admin/ui/*`
- `src/components/FeedbackMessage.*` → `src/shared/ui/feedback-message/*`
- `src/constants/registryEnums.jsx` → `src/entities/software/model/software-enums.ts`
- `src/hooks/useDebounce.jsx` → `src/shared/lib/use-debounce.ts`
- `src/hooks/useAdminData.jsx` → delete (import `entities/admin` directly)
- `src/hooks/useSoftwareRegistry.jsx` → delete after Phase 4 replaces it
- `src/LandingPage.css` → `src/pages/public/landing/ui/landing.css`; `src/LoginPage.css` → `src/pages/auth/ui/auth.css` (plus a thin `pages/auth/ui/auth-shell.css`)
- Add `@pages` alias to `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`; convert imports to aliases.
- **Exit:** `grep` finds no references to deleted paths; build green.

### Phase 2 — Routing (to ≥98%)
- `src/app/router/route-error-boundary.tsx` (class boundary + `useRouteError`) and attach `errorElement` to the shell route.
- `src/app/router/require-role.tsx`; wrap `/workspace/admin`.
- `RequireAuth`: replace `return null` with a shared `<RouteLoading />`.
- Deep-linkable details:
  - `/workspace/software/:softwareId`
  - `/workspace/software/:softwareId/versions/:version`
  - `entities/software/api`: add `useSoftwareDetail(id)` and `useSoftwareVersion(id, version)`.
  - Pages fall back to `location.state` for instant paint, then reconcile by id.
  - Add redirects from old `/workspace/software-details` and `/workspace/version-details` when state is absent.
- `src/app/router/route-paths.ts` central constants; use in nav + command palette.
- Consume `location.state.from` after login.
- **Exit:** refresh/deep-link on details works; unknown route shows boundary.

### Phase 3 — Auth completion (to ≥95%)
- `src/pages/auth/password-reset/ui/password-reset-route-page.tsx` (+ route, validation, success/error) using `POST /api/v1/auth/password-reset/confirm`.
- `src/pages/auth/email-verification/ui/email-verification-route-page.tsx` (+ route; success/failure/invalid-token states).
- Wire routes in `app-router.tsx` and `auth-route-components.tsx`.
- Register flow: after success, offer "resend verification" (optional endpoint, guarded).
- **Exit:** full register→verify→login and forgot→reset→login paths reachable; e2e can target real routes.

### Phase 4 — Data layer (to ≥95%)
- `entities/software/api/software.mutations.ts`: `useUploadSoftware`, `useUploadVersion`, `useVersionLifecycle` (deprecate/revoke), `useUpdatePricing` — all invalidate `queryKeys.software.*`.
- `entities/artifact`: `useArtifacts()` (derive from software versions or endpoint per A1) with Zod schema.
- `entities/security`: `useSecurityScans()` (derive `artifact_status`/`quarantine_reason` or endpoint).
- `entities/audit`: `useAuditEvents()` (endpoint or reuse admin audit).
- `entities/analytics`: `useDownloadAnalytics()` (derive from software + audit, or endpoint).
- Admin: replace local-state mutations with `useMutation` (`PATCH` endpoints per A1) + `invalidateQueries(['admin','dashboard'])`; keep optimistic updates.
- Add `invalidateQueries(['software','list'])` after upload.
- MSW: `src/mocks/server.ts` for Vitest only (A4); handlers for every endpoint above.
- Delete `src/hooks/useSoftwareRegistry.jsx`; migrate the last 3 pages to entity mutations.
- **Exit:** no `useState` mirror of server data; all reads/writes query-backed; mocks available to tests.

### Phase 5 — Feature surface (to ≥95%)
- Wire `versions`, `artifacts`, `security`, `audit`, `analytics` pages to Phase 4 hooks with loading/error/empty states.
- `settings`: read profile from `useSessionStore`; persist via `PATCH /api/v1/users/me`; notification prefs via a `settings` entity/local persistence.
- Help centre: replace regex replies with `useSupportMessages` + `POST /api/v1/support-chat/messages`; retain graceful offline reply.
- Plans/checkout: plans remain a static catalogue; project purchase stays live. Plan billing explicitly out of scope (A3).
- **Exit:** zero hardcoded business data in pages; all states handled.

### Phase 6 — Design system (to ≥95%)
- `tokens.css`: add `@config "../../tailwind.config.js";`, `@plugin "@tailwindcss/forms";`, `@source "../../**/*.{ts,tsx,jsx}"`.
- Load fonts in `index.html` (preconnect + stylesheet) or via `@import` in tokens.
- New documented primitives under `shared/ui`: `modal` (focus trap, Escape, `role="dialog"`), `empty-state`, `error-state`, `loading-state`, `data-table`, `segmented`. Reuse or remove existing `separator`, `table`, `textarea`, `dialog`.
- Remove legacy CSS dead rules after relocation.
- **Exit:** no unused primitives; dark mode consistent; forms styled by plugin.

### Phase 7 — Testing & CI (to ≥95%)
- Unit: query adapters (MSW-backed), `query-keys`, stores, `normalizeAxiosError`, toast bus.
- Integration (RTL): login/register/reset, `RequireAuth` hydration, workspace shell + sidebar/command palette, registry filters, upload form, admin tab switch.
- E2E (Playwright): fix `webServer` + `baseURL`; rewrite `forgot_password.spec.ts`; add `login`, `session-refresh`, `registry`, `upload`, `admin` specs.
- CI: lint + typecheck + `test:coverage` (threshold per A6) + build; e2e job behind manual/`workflow_dispatch`.
- **Exit:** coverage threshold met; CI green.

### Phase 8 — Build / env / deploy (to ≥95%)
- `nginx.conf` serving `dist/` with `try_files $uri /index.html` and `/api` → backend proxy; update `Dockerfile` to nginx; non-root; healthcheck.
- `.env.example` / README: document `VITE_API_URL`, `VITE_ENABLE_MOCKS`.
- Remove `manualChunks` entries for deleted deps if any.
- **Exit:** `docker build` + run serves SPA and proxies API.

### Phase 9 — Verification & final report
- Run all gates (§10), update scorecard, regenerate `docs/frontend-completeness-report.md` with before/after.

---

## 5. Scorecard mapping (how each parameter clears 95%)

| Parameter | Phases | Why it clears 95% |
|---|---|---|
| Foundation / architecture | 1 | All legacy relocated/removed; aliases uniform |
| Routing & navigation | 2, 3 | Deep links, error boundary, role guard, all routes real |
| Authentication & session | 3 | Reset + verify complete; `from` redirect |
| Data layer | 4 | Query+Zod everywhere, invalidation, MSW |
| Feature surface | 4, 5 | No hardcoded data; Settings/help/billing complete |
| Design system / styling | 6 | Tailwind v4 complete; fonts; primitives |
| Testing & CI | 7 | Suites + coverage + CI |
| Build / env / deploy | 0, 8 | dist untracked; nginx proxy; env documented |

---

## 6. Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Backend endpoints differ/absent | Blocks real data | Typed adapters + labelled fallback; derive from existing endpoints (A1) |
| `.jsx`→`.tsx` conversion surfaces many strict errors | Schedule/scope | Convert per-file in Phase 1; keep changes mechanical |
| Details URL-param refactor touches 3 pages | Regression | Keep `location.state` fast-path; add tests |
| Payment provider unspecified | Billing incomplete | Adapter + explicit state (A3) |
| e2e needs external services | CI flakiness | e2e `workflow_dispatch` (A5) |
| MSW enabled in prod by mistake | Wrong data | Gate on `import.meta.env.DEV && VITE_ENABLE_MOCKS` |

---

## 7. Sequencing & rough effort

0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9. Phases 1, 4 and 7 are the largest. Each phase ends with a green build and a commit-sized diff.

---

## 8. Out of scope (unless you say otherwise)

- Plan billing / payment-provider integration (A3: out of scope).
- Real-time notifications/websockets.
- Backend changes.

---

## 9. Files added / removed (summary)

**Added:** `pages/admin/ui/*`, `pages/auth/password-reset/*`, `pages/auth/email-verification/*`, `pages/auth/ui/auth.css`, `entities/{artifact,security,audit,analytics}/*`, `entities/software/api/software.mutations.ts`, `app/router/{route-error-boundary.tsx,require-role.tsx,route-paths.ts}`, `shared/ui/{modal,empty-state,error-state,loading-state,data-table,segmented}`, `mocks/server.ts`, `eslint.config.js`, `nginx.conf`, `.github/workflows/ci.yml`, plus test files.

**Removed:** `AdminPage.jsx|css` (moved), `components/**` (moved), `hooks/useSoftwareRegistry.jsx`, `hooks/useAdminData.jsx`, `hooks/useDebounce.jsx`, `constants/registryEnums.jsx`, root `LandingPage.css`/`LoginPage.css` (moved), `types/modules.d.ts`, `src/legacy/`, `dist/` from tracking.

---

## 10. Verification commands (run at every phase)

```
npm run typecheck
npm run lint
npm test -- --coverage
npm run build
npm run e2e            # when services available
docker build -t techpulse-frontend .
```

---

## 11. Sign-off checklist (your vetting)

- [ ] A1 endpoint contracts confirmed / corrected
- [ ] A2 convert legacy `.jsx` → `.tsx`?
- [ ] A3 billing approach approved
- [ ] A4 MSW in dev?
- [ ] A5 e2e in CI?
- [ ] A6 coverage threshold agreed
- [ ] Phase order / out-of-scope items approved
