# Data Fetching

## ALL data fetching MUST happen in server components

This is a strict, non-negotiable rule for this app:

- Data fetching must be done **ONLY** via React Server Components.
- Data must **NOT** be fetched via Route Handlers (`route.ts`).
- Data must **NOT** be fetched via Client Components (no `fetch` in `"use client"` files, no client-side `useEffect`/SWR/React Query data fetching).
- Data must **NOT** be fetched any other way (no third-party data-fetching libraries, no API layer called from the client).

Client components may only receive data as props from a server component ancestor. If a client component needs data, lift the fetch to the nearest server component and pass the result down as props.

## Database access MUST go through `/data` helper functions

- All database queries must be implemented as helper functions inside the `/data` directory.
- These helper functions must use **Drizzle ORM** to query the database.
- **Raw SQL is forbidden.** Do not use raw SQL strings, `sql\`...\`` escape hatches, or any raw query mechanism to read or write data.
- Server components call these `/data` helper functions to fetch data — they must not construct or run queries inline.

## Data access MUST be scoped to the logged-in user

This is critically important:

- A logged-in user must **ONLY** ever be able to access their own data.
- A logged-in user must **NEVER** be able to access another user's data, under any circumstance.
- Every helper function in `/data` that reads or writes user-owned data must filter/scope the query by the authenticated user's identity (e.g. a `userId`/owner column matched against the current session's user id). There is no helper function that returns or mutates rows without this scoping.
- Never trust a user-supplied id (route param, query param, form field) as the sole filter for "whose data to return." Always intersect it with the authenticated user's own id.
