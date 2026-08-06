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

## Architecture

- Next.js App Router (`src/app/`), TypeScript, React 19.
- Path alias `@/*` maps to `src/*` (see `tsconfig.json`).
- Styling via Tailwind CSS v4 (`@tailwindcss/postcss` in `postcss.config.mjs`, styles in `src/app/globals.css`).
- ESLint uses `eslint-config-next`'s flat config (`core-web-vitals` + `typescript` rulesets).
