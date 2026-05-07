# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — React Router dev server with HMR (user usually has this already running; don't start it)
- `npm run build` — production build
- `npm run start` — serve the production build (`build/server/index.js`)
- `npm run typecheck` — runs `react-router typegen` then `tsc`. Run this after changing routes, loaders, or actions so the generated `./+types/*` modules stay in sync.
- `npm run db:generate` — generate a Drizzle migration from `app/db/schema.ts` into `./drizzle`
- `npm run db:migrate` — apply migrations to the configured Turso database
- `npm run db:push` — push schema directly (skip migration files)
- `npm run db:studio` — open Drizzle Studio

Database commands need `TURSO_DATABASE_URL` and (for remote) `TURSO_AUTH_TOKEN` in the environment. Clerk needs its standard publishable/secret keys. UploadThing needs its token.

## Architecture

This is a course platform ("Hatch") built on **React Router v7 framework mode** (SSR), Clerk auth, Drizzle ORM over Turso (libSQL), and UploadThing for media. The stack is intentionally the same one taught inside the course content.

### Content vs. data split

Course material lives on disk, not in the database. This is the most important thing to understand about the codebase:

- `content/courses/<course-slug>/course.json` — course metadata + module/lesson tree. Module `access` is `"free" | "account" | "purchased"` and gates visibility per-module.
- `content/courses/<course-slug>/modules/<module-slug>/<lesson-slug>.md` — lesson body with gray-matter frontmatter (`title`, `description`, `duration`).
- `content/courses/<course-slug>/modules/<module-slug>/assets/videos/videos.json` — maps lesson slug → `{ url, type, thumbnail? }`. Video metadata is stored separately from the markdown so content edits don't touch media references.

The database only stores **user state** around that content: `users`, `enrollments`, `lesson_completions`, `profiles`, `projects`, `comments`, `comment_votes` (see `app/db/schema.ts`). User IDs are Clerk user IDs (text PK), not autoincrement.

`app/lib/courses.server.ts` is the read path for content (renders markdown via `marked`, strips a duplicate leading H1, and does `{{user.firstName}}` / `{{user.name}}` / `{{user.email}}` template substitution against the logged-in user before rendering). `app/lib/courses-admin.server.ts` is the write path — admin editors write back to disk for lesson frontmatter and `videos.json`. Any lesson editing feature goes through these two files.

### Auth and access control

`app/root.tsx` installs `clerkMiddleware()` and wraps the tree in `<ClerkProvider>` via `rootAuthLoader`. All auth helpers live in `app/lib/auth.server.ts`:

- `getOrCreateUser(args)` — idempotent upsert of the Clerk user into the `users` table on first visit, also seeds a `profiles` row. It re-syncs firstName/lastName/email from Clerk session claims when they change (e.g. OAuth profile updates). Call this from loaders that need a DB-backed user.
- `checkModuleAccess(args, courseSlug, moduleAccess)` — the single source of truth for gating. Returns `{ allowed, reason?: "auth" | "purchase", userId? }`. `"free"` is always allowed; `"account"` requires login; `"purchased"` requires an `enrollments` row OR `role === "admin"`. Admins bypass purchase checks everywhere.
- `requireAdmin(args)` — throws 401/403 Responses. Used by every route under `routes/admin.*`.

Routes that render lessons must call `checkModuleAccess` and branch on `reason` to redirect to sign-in vs. show a paywall.

### Routing

React Router v7 framework mode uses an **explicit** routes file, not file-based routing. `app/routes.ts` is authoritative — when adding, renaming, or moving a route file under `app/routes/`, you must update `app/routes.ts` too or the route won't exist. Admin routes are grouped under a `layout("routes/admin.tsx", [...])` block so the admin layout's loader can enforce `requireAdmin` once.

### UploadThing

`app/lib/uploadthing.server.ts` defines four upload endpoints (`lessonVideo`, `lessonThumbnail`, `profileAvatar`, `projectImage`) exposed through `routes/api.uploadthing.ts`. When adding a new upload type, add it here and wire the `<UploadButton endpoint="...">` in the consuming route. Uploaded files return `file.ufsUrl` — lesson videos/thumbnails are persisted into `videos.json` via `updateLessonVideo` rather than into the database.

### Drizzle / Turso

`app/db/index.ts` creates a single libSQL client from env vars and exports `db` with the schema registered, so `db.query.<table>.findFirst/findMany` relational queries are available throughout. Dialect is `turso` in `drizzle.config.ts`. Schema changes workflow: edit `app/db/schema.ts` → `npm run db:generate` → commit the SQL in `drizzle/` → `npm run db:migrate`.

## Conventions

- Server-only modules are suffixed `.server.ts` so the React Router bundler strips them from the client bundle. Keep DB, auth, filesystem, and UploadThing imports inside `.server.ts` files.
- Route types come from the generated `./+types/<route>` modules (produced by `react-router typegen`, invoked as part of `npm run typecheck`). Don't hand-write loader/action arg types.
- Relative dates in lesson markdown templates: `{{user.firstName}}`, `{{user.lastName}}`, `{{user.name}}`, `{{user.email}}` are substituted at render time by `getLessonContent`.
