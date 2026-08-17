# Server Components

These standards are mandatory for all Server Component work in this app. They complement [`docs/data-fetching.md`](./data-fetching.md).

## This is a Next.js 15 app: `params` and `searchParams` are Promises

- In Next.js 15, the `params` and `searchParams` props passed to page/layout/route Server Components are **Promises**, not plain objects.
- They **MUST be awaited** before any of their properties are read. Do not destructure or index into them synchronously, and do not pass the unresolved promise down to a helper expecting a plain object.
- Type them as `Promise<{ ... }>` and `await` them at the top of the component body.

  ```tsx
  // Correct
  // src/app/dashboard/workout/[workoutId]/page.tsx
  export default async function EditWorkoutPage({
    params,
  }: {
    params: Promise<{ workoutId: string }>
  }) {
    const { workoutId } = await params

    // ...
  }
  ```

  ```tsx
  // Forbidden — params is a Promise, not a plain object
  export default function EditWorkoutPage({
    params,
  }: {
    params: { workoutId: string }
  }) {
    const workoutId = params.workoutId // TypeError at runtime

    // ...
  }
  ```

- The same applies to `searchParams` on page components — type it as `Promise<{ [key: string]: string | string[] | undefined }>` and `await` it before use.
- Because `params`/`searchParams` must be awaited, the component that reads them must be an `async` function.

## Route params are user-supplied input

- A route param (e.g. `workoutId` from `/dashboard/workout/[workoutId]`) comes straight from the URL and must be treated as untrusted input.
- Per [`docs/data-fetching.md`](./data-fetching.md), never use an awaited route param as the sole filter for "whose data to return" — always intersect it with the authenticated user's id inside the `/data` helper.

## Everything else in `docs/data-fetching.md` still applies

- Data fetching happens only in Server Components, only via `/data` helper functions, using Drizzle ORM — no raw SQL, no fetching in Client Components.
- Once `params`/`searchParams` are awaited, pass the resolved values (e.g. `workoutId`) into a `/data` helper — don't fetch data inline in the component.
