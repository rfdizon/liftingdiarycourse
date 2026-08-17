# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Docs first

Before generating or modifying any code, ALWAYS check the `/docs` directory for a relevant doc file first and follow its guidance. If no relevant doc exists, proceed using the guidance below and general best practices.

## Project status

This is a freshly bootstrapped Next.js app (via `create-next-app`) for a "lifting diary" course project. It currently contains only the default scaffold (`src/app/layout.tsx`, `src/app/page.tsx`) — no application-specific features, routes, or data layer exist yet.

## Commands

- `npm run dev` — start the dev server (Next.js, with Turbopack) at http://localhost:3000
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — run ESLint (flat config in `eslint.config.mjs`)

There is no test runner configured yet.

## Code Generation Guidelines

Documentation files in `/docs` (see "Docs first" above for how to use them):

- [`docs/auth.md`](docs/auth.md) — authentication and authorization standards (Clerk only).
- [`docs/data-fetching.md`](docs/data-fetching.md) — data fetching standards (must happen in server components).
- [`docs/data-mutations.md`](docs/data-mutations.md) — data mutation (create/update/delete) standards.
- [`docs/routing.md`](docs/routing.md) — routing standards (all app functionality under `/dashboard`, protected via middleware).
- [`docs/server-components.md`](docs/server-components.md) — Server Component standards for this Next.js 15 app.
- [`docs/ui.md`](docs/ui.md) — UI coding standards (shadcn/ui only).

This list is kept in sync automatically by the `docs-index-updater` subagent whenever a file is added to `/docs`.

## Architecture

- Next.js App Router (`src/app/`), TypeScript, React 19.
- Path alias `@/*` maps to `src/*` (see `tsconfig.json`).
- Styling via Tailwind CSS v4 (`@tailwindcss/postcss` in `postcss.config.mjs`, styles in `src/app/globals.css`).
- ESLint uses `eslint-config-next`'s flat config (`core-web-vitals` + `typescript` rulesets).
