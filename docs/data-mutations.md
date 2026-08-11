# Data Mutations

These standards are mandatory for all data mutation (create/update/delete) work in this app. They complement [`docs/data-fetching.md`](./data-fetching.md), which covers reads.

## Mutations MUST go through `/data` helper functions

- All database mutations must be implemented as helper functions inside the `/data` directory, alongside the read helpers described in [`docs/data-fetching.md`](./data-fetching.md).
- These helper functions must use **Drizzle ORM** to perform the mutation (`db.insert`, `db.update`, `db.delete`, etc.).
- **Raw SQL is forbidden.** Do not use raw SQL strings, `sql\`...\`` escape hatches, or any raw query mechanism to write data.
- Nothing outside of `/data` may call `db.insert`/`db.update`/`db.delete` directly — server actions call the `/data` helper, never Drizzle itself.
- Like read helpers, every mutation helper that touches user-owned data must be scoped to the authenticated user (via `auth()` from `@clerk/nextjs/server`, per [`docs/auth.md`](./auth.md)) — never trust a caller-supplied id as the sole filter for which row to update/delete.

  ```ts
  // src/data/workouts.ts
  import "server-only";
  import { auth } from "@clerk/nextjs/server";
  import { db } from "@/db";
  import { workouts } from "@/db/schema";
  import { and, eq } from "drizzle-orm";

  export async function deleteWorkoutForCurrentUser(workoutId: string) {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Not authenticated");
    }

    await db
      .delete(workouts)
      .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
  }
  ```

## Mutations MUST be triggered via Server Actions in colocated `actions.ts` files

- All data mutations from the UI must be triggered via Next.js **Server Actions**.
- Server actions must live in a file named `actions.ts`, colocated with the route/component that uses them (e.g. `src/app/dashboard/actions.ts`).
- Each `actions.ts` file must start with `"use server"`.
- A server action's job is to validate its input and call the relevant `/data` helper — it must not construct or run queries itself.

  ```ts
  // src/app/dashboard/actions.ts
  "use server";

  import { deleteWorkoutForCurrentUser } from "@/data/workouts";
  ```

## Server action parameters MUST be typed — never `FormData`

- Every server action must declare explicitly typed parameters.
- Server actions must **NOT** accept a `FormData` parameter. Do not use the `action={serverAction}` form pattern that hands a raw `FormData` object to the action.
- Call server actions with plain typed arguments from client code instead (e.g. `onClick`/`onSubmit` handlers that build a typed object and call the action directly).

  ```ts
  // Correct
  export async function updateWorkoutName(workoutId: string, name: string) {
    /* ... */
  }
  ```

  ```ts
  // Forbidden
  export async function updateWorkoutName(formData: FormData) {
    /* ... */
  }
  ```

## Every server action MUST validate its arguments with Zod

- Every server action must validate all of its incoming arguments using [Zod](https://zod.dev) before doing anything else (before calling a `/data` helper).
- Define a Zod schema for the action's arguments and parse (not just type-check) them at the top of the action. Do not rely on TypeScript types alone — TypeScript types are erased at runtime and give no protection against a malicious or malformed client call.

  ```ts
  // src/app/dashboard/actions.ts
  "use server";

  import { z } from "zod";
  import { deleteWorkoutForCurrentUser } from "@/data/workouts";

  const deleteWorkoutSchema = z.object({
    workoutId: z.string().uuid(),
  });

  export async function deleteWorkout(workoutId: string) {
    const { workoutId: validatedWorkoutId } = deleteWorkoutSchema.parse({
      workoutId,
    });

    await deleteWorkoutForCurrentUser(validatedWorkoutId);
  }
  ```

- Let `.parse()` throw on invalid input rather than silently swallowing or coercing bad data — a failed validation must abort the mutation.
