# Frontend Modernization Report

## Executive Summary
The current frontend has strong domain intent but prototype-level architecture. The platform currently mixes legacy patterns (manual page router, duplicate auth context, mixed CRA/Vite entrypoints, manual server state) with modern dependencies that are only partially adopted. The modernization approach in this repository is incremental, backend-safe, and migration-first.

## Current Weaknesses
1. Routing fragmentation: custom page-state router blocks scalability and route-level composition.
2. Entrypoint inconsistency: CRA scripts and Vite configuration coexist, reducing build reliability.
3. Auth duplication: two providers produce inconsistent session behavior.
4. Server-state drift: repeated useEffect data loaders, duplicated requests, custom polling reducers.
5. Monolithic modules: large screens own too much fetch/transform/render logic.
6. Design inconsistency: no enforced tokens or unified primitives for spacing, type, elevation, and states.
7. Accessibility gaps: keyboard and focus management are inconsistent outside some isolated areas.
8. Testing asymmetry: limited feature-level API mocks and migration-safe contract tests.

## Refactored Target Structure (FSD)
- `src/app`: providers, routing, app lifecycle, global styles
- `src/pages`: route-level compositions
- `src/widgets`: workspace shell, dashboard frames, composite UI
- `src/features`: user actions and flows (command palette, filters, uploads)
- `src/entities`: domain objects (software, version, user, audit)
- `src/shared`: UI primitives, libs, api client, config, utilities
- `src/processes`: cross-feature flows (auth bootstrap, onboarding)
- `src/mocks`: MSW handlers and fixtures

## Dependency Architecture
1. `app` imports `pages/widgets/processes/features/entities/shared`
2. `pages` imports `widgets/features/entities/shared`
3. `widgets` imports `features/entities/shared`
4. `features` imports `entities/shared`
5. `entities` imports `shared`
6. `shared` imports only external libraries

## Design System Structure
1. Token layer: `src/app/styles/tokens.css`
2. Primitive layer: button, card, skeleton, form field, badge, table cells
3. Composite layer: modal, drawer, data-table, empty/error/loading states
4. Pattern layer: dashboard cards, list toolbars, filter bars, action rows

## State Boundaries
- TanStack Query: all server state, caching, revalidation, optimistic updates
- Zustand: ephemeral UI state (shell collapse, command palette open, panel visibility)
- React Hook Form + Zod: input and schema ownership at feature boundaries

## Route Architecture
- `app/router` owns route registration and guards
- Route-level lazy loading per module
- Fallback and error routes centralized
- Breadcrumb source derived from route metadata

## Responsive Shell System
- Collapsible desktop sidebar
- Mobile drawer with keyboard focus trap
- Sticky top navigation with global actions
- Content grids scale from 1 column to operational dashboards

## Reusable Component Patterns
1. Async state triad: `loading`, `error`, `content`
2. Query key conventions per entity
3. Feature-local schema parsing with Zod before rendering
4. Shared action surfaces (`Button`, icon actions, destructive action gates)

## Performance Strategy
1. Route splitting by page module
2. Query prefetch for high-frequency transitions
3. Virtualized tables for large artifact collections
4. Debounced filters and memoized selectors
5. Skeleton-first UX and background refresh indicators

## Accessibility Strategy
1. Semantic landmarks and heading hierarchy
2. Focus-visible and keyboard-only parity
3. Reduced-motion and high-contrast compatibility
4. Role/label coverage for interactive controls

## Incremental Migration Phases
1. Foundation: app router, providers, shell, token layer, query boundaries
2. Shared primitives: buttons/forms/table/dialog/loading patterns
3. Domain extraction: software/version entities with typed adapters
4. Feature migration: registry, lifecycle, artifact browser
5. Ops modules: audit center, analytics, notifications
6. Hardening: tests, mocks, profiling, accessibility audits

## Implemented in this iteration
1. FSD-aligned baseline folders under `src/*`
2. Query provider and shared HTTP client
3. Zustand UI store for shell state
4. Enterprise app shell widget (sidebar + top nav + command palette trigger)
5. `SoftwareRegistryPage` migrated example with TanStack Query + Zod
6. MSW mocked software handler for local backend-independent interaction

## Next Refactor Queue
1. Migrate `ResourcesPage` to `entities/software + features/dashboard-overview`
2. Replace manual `MainRouter` page-state transitions with route-first navigation
3. Consolidate auth into a single `processes/auth` pipeline
4. Convert admin reducer polling to query-driven module composition
5. Adopt shadcn primitives systematically for forms, dialogs, menus, tables
