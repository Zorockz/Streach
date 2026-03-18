# StretchGate

## Overview

iOS-first Expo React Native wellness app. Users complete a 20–60 second guided micro-stretch before unlocking distracting apps (TikTok, Instagram, YouTube, etc.) — honor-system mechanic, no Screen Time API.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Mobile**: Expo SDK 54, expo-router 6, React Native 0.81
- **State**: React Context + AsyncStorage (no external state manager)
- **Font**: DM Sans via @expo-google-fonts/dm-sans
- **Icons**: Expo Symbols (iOS SF Symbols), Ionicons (cross-platform)
- **Animations**: react-native-reanimated v3
- **Navigation**: expo-router file-based (tabs + modals)
- **API framework**: Express 5 (API server artifact — not used by mobile MVP)
- **Database**: PostgreSQL + Drizzle ORM (API server only)

## Mobile App Structure (`artifacts/mobile`)

```
app/
  _layout.tsx          — root layout, DM Sans fonts, AppProvider, navigation
  (tabs)/
    _layout.tsx        — tab bar with BlurView (iOS) / solid bg
    index.tsx          — Home dashboard
    stretches.tsx      — Stretch library with area filter
    progress.tsx       — Progress chart + session history
    settings.tsx       — App lock selection, body areas, daily goal
  onboarding.tsx       — 6-step onboarding incl. notification permissions
  stretch/
    [id].tsx           — Stretch detail modal (slide_from_bottom)
    session.tsx        — Full-screen session with breathing orb animation
constants/
  colors.ts            — Design tokens (bg #0D1F1A, primary #5DB483, accent #E8A642)
  stretches.ts         — 12 stretches + 10 distracting apps + body areas
context/
  AppContext.tsx        — Settings + sessions via AsyncStorage, streak logic
components/
  ErrorBoundary.tsx
```

## Key Design Decisions

- **Navigation**: `router.navigate('/settings')` for tab switching; `router.push('/stretch/session')` for modals
- **Fonts**: DM_Sans_400Regular/500Medium/600SemiBold/700Bold
- **No uuid**: use `Date.now().toString() + Math.random().toString(36).substr(2, 9)`
- **Web guards**: `Platform.OS === 'web'` with 67px top / 34px bottom insets
- **Stretch session**: breathing orb uses `withRepeat/withSequence` Reanimated, timer uses setInterval + Date.now()

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
