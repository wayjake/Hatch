# Repository Guidelines

## Project Structure & Module Organization

The app lives in `app/`, with route modules in `app/routes/`, shared UI in `app/components/`, server-only helpers in `app/lib/*.server.ts`, and database code in `app/db/`. React Router uses an explicit route map in `app/routes.ts`, so adding or renaming a route file also requires updating that file.

Course content is file-based, not database-backed. Keep course metadata in `content/courses/<slug>/course.json`, lesson bodies in `content/courses/<slug>/modules/<module>/<lesson>.md`, and lesson video metadata in `assets/videos/videos.json`. Drizzle migrations are committed under `drizzle/`. Static assets belong in `public/`.

## Build, Test, and Development Commands

- `npm run dev` starts the React Router dev server with HMR.
- `npm run build` creates the production server/client build.
- `npm run start` serves the built app from `build/server/index.js`.
- `npm run typecheck` regenerates route types and runs strict TypeScript checks.
- `npm run db:generate` creates a migration from `app/db/schema.ts`.
- `npm run db:migrate` applies committed migrations.
- `npm run db:push` pushes schema changes directly to the configured database.

## Coding Style & Naming Conventions

Use TypeScript with strict typing, 2-space indentation, semicolons, and double quotes, matching the existing codebase. Prefer the `~/` path alias for imports from `app/`. Keep filesystem, auth, DB, and UploadThing logic in `.server.ts` files so it stays out of the client bundle.

Route filenames follow React Router conventions already used here, for example `admin.lesson.tsx` and `api.enroll.ts`. Keep content slugs lowercase and hyphenated.

## Testing Guidelines

There is no dedicated automated test suite yet. Treat `npm run typecheck` as the required verification step for every change, especially after editing loaders, actions, or routes. For content and UI changes, manually verify the affected page in `npm run dev`.

## Commit & Pull Request Guidelines

Recent commits use short, imperative subjects such as `Add admin lesson editor...` and `Fix Clerk auth setup...`. Follow that pattern: start with a verb, keep the subject specific, and group related changes in one commit.

PRs should explain the user-visible impact, call out schema or content changes, and include screenshots for UI updates. Link the related issue when one exists, and note any required environment variables such as Clerk, Turso, or UploadThing credentials.
