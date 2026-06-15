# OmniVision AI Search

A multi-engine visual search platform — upload any image and search it across Google Lens, Bing Visual, TinEye, Yandex (and optional AI providers) in parallel, with deduplication and confidence ranking.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo / React Native (artifacts/omnivision)
- API: Express 5 (artifacts/api-server)
- DB: PostgreSQL + Drizzle ORM (lib/db)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in lib/api-spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source-of-truth OpenAPI spec
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas
- `lib/db/src/schema/` — Drizzle ORM schema (users, search_jobs, providers, images)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/` — auth, visualSearch, imageStorage, seed
- `artifacts/omnivision/` — Expo mobile app
- `artifacts/omnivision/context/` — AuthContext, SearchContext
- `artifacts/omnivision/components/` — SearchResultCard, ProviderStatusRow, ScanAnimation, ConfidenceBar
- `artifacts/omnivision/app/(tabs)/` — main tabs: index (Search), history, providers, profile
- `artifacts/omnivision/app/results/[jobId].tsx` — search results screen with polling

## Architecture decisions

- **Async job queue**: POST /search/visual returns 202 immediately with a jobId; client polls GET /search/jobs/:jobId until completed. Uses `setImmediate` for background execution.
- **Provider architecture**: Each provider is a function in `visualSearch.ts`. New providers are added by registering in `PROVIDER_RUNNERS` and seeding the DB — no core changes needed.
- **Auth**: Custom HMAC-based JWT with `SESSION_SECRET`. No external JWT library dependency. Token stored in AsyncStorage on mobile.
- **Deduplication**: URL-based deduplication across all provider results before ranking by confidence.
- **Image storage**: Base64 upload from mobile → saved to `artifacts/api-server/uploads/` → served at `/api/uploads/:filename`.

## Product

- **Search tab**: Pick image from gallery or camera → multi-engine parallel search → polled results
- **Results screen**: Tabbed view (Results / Engines) — results sorted by confidence, engine status with timing
- **History tab**: All past searches with image thumbnails, result count, status
- **Engines tab**: Toggle search providers on/off with success rate stats
- **Profile tab**: User info, plan, usage bar, logout
- **Demo account**: demo@omnivision.ai / password (Pro plan, 100 searches)
- **Admin account**: admin@omnivision.ai / admin123

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm run typecheck:libs` after any `lib/*` schema change before checking leaf packages
- The API server dist is rebuilt on every `dev` script run — must restart the workflow to pick up code changes
- `expo-glass-effect` is installed but the `(tabs)/_layout.tsx` uses classic Tabs for maximum web/Expo Go compatibility
- `imagesTable` and `usersTable` fields use camelCase in TypeScript (e.g., `passwordHash`, not `password_hash`)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
