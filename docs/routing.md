# Routing

These standards are mandatory for all routing work in this app. They complement [`docs/auth.md`](./auth.md), which covers the middleware mechanics in more depth.

## All app functionality lives under `/dashboard`

- **`/dashboard` is the only entry point into the app's functionality.** Every feature route — the dashboard itself and all of its sub-routes (e.g. `/dashboard/workout/new`, `/dashboard/workout/[workoutId]`) — must be nested under `src/app/dashboard/`.
- Do not add feature routes at the app root (`src/app/*`) alongside `/dashboard`. The only routes that belong outside `src/app/dashboard/` are the public marketing/landing page (`src/app/page.tsx`) and Clerk's auth pages (`src/app/sign-in/[[...sign-in]]/page.tsx`, `src/app/sign-up/[[...sign-up]]/page.tsx`), per [`docs/auth.md`](./auth.md).
- When adding a new feature, ask "does this belong under `/dashboard`?" — the answer is almost always yes. If it isn't a public marketing page or an auth page, it goes under `src/app/dashboard/`.

## `/dashboard` and everything under it MUST be a protected route

- `/dashboard` and all of its sub-routes require a signed-in user. There is no such thing as a public page under `/dashboard`.
- Do not build "logged out" states, guest views, or partial content for `/dashboard` routes — a signed-out user must never reach them.

## Route protection happens ONLY in middleware

- Per [`docs/auth.md`](./auth.md), route protection is centralized in `src/proxy.ts` via `clerkMiddleware` and `createRouteMatcher`. All routes are protected by default; only routes explicitly listed in `isPublicRoute` (currently `/sign-in` and `/sign-up`) are exempt.
- Because `/dashboard` routes are protected by default, adding a new page under `src/app/dashboard/` requires **no changes to `src/proxy.ts`** — it's already covered.
- Do not add ad hoc auth checks inside `/dashboard` pages/layouts/Server Components (e.g. manually calling `auth()` and redirecting) as a substitute for or duplicate of middleware protection. The middleware is the single source of truth for whether a request is allowed to reach a route.
- The one place `auth()` is still called inside `/dashboard` code is inside `/data` helper functions, to scope queries to the current user — see [`docs/auth.md`](./auth.md#reading-the-current-user-on-the-server). That is about *which data* is returned, not *whether the route is reachable*, and does not replace middleware protection.
- If a new route genuinely needs to be public, it must be added to the `isPublicRoute` matcher in `src/proxy.ts` and must NOT live under `src/app/dashboard/` — a public route nested under `/dashboard` would be misleading and easy to get wrong.

## Linking to feature routes

- Link to feature routes with Next.js `<Link>` (or `redirect()` on the server) using full `/dashboard/...` paths — do not construct routes that bypass `/dashboard`.
