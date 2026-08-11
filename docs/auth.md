# Auth

These standards are mandatory for all authentication and authorization work in this project.

## Clerk only

- **[Clerk](https://clerk.com) (`@clerk/nextjs`) is the only authentication provider for this app.**
- Do not add, wire up, or hand-roll any other auth mechanism (custom sessions/cookies, JWT libraries, NextAuth/Auth.js, Passport, Supabase Auth, etc.).
- Do not call Clerk's REST/Backend API directly for things the `@clerk/nextjs` SDK already covers. Use the SDK's hooks, components, and server helpers.

## `ClerkProvider` and header UI

- `ClerkProvider` wraps the whole app in `src/app/layout.tsx` and must stay there — do not add a second `ClerkProvider` lower in the tree.
- Signed-in/signed-out UI must be built with Clerk's `<Show when="signed-in">` / `<Show when="signed-out">` components (see `src/app/layout.tsx`), not with manual conditionals on a hand-rolled auth state.
- Use Clerk's own components for auth actions/UI: `<SignInButton>`, `<SignUpButton>`, `<UserButton>`, `<SignIn>`, `<SignOut>`. Per [`docs/ui.md`](./ui.md), do not build custom buttons/menus in front of these — compose shadcn primitives only where Clerk doesn't already provide the component.

## Route protection MUST happen in middleware

- Route protection is centralized in `src/proxy.ts` using `clerkMiddleware` and `createRouteMatcher`.
- All routes are protected (`auth.protect()`) by default. Public routes (e.g. `/sign-in`, `/sign-up`) must be explicitly listed in `isPublicRoute`.
- When adding a new public route, add it to the `isPublicRoute` matcher in `src/proxy.ts` — do not implement ad hoc auth checks inside individual pages/layouts as a substitute for middleware protection.
- Do not modify the `config.matcher` to exclude paths from the Clerk middleware unless those paths are genuinely static/public assets.

## Sign-in / sign-up pages

- Sign-in and sign-up live at `src/app/sign-in/[[...sign-in]]/page.tsx` and `src/app/sign-up/[[...sign-up]]/page.tsx`, rendering Clerk's `<SignIn />` / `<SignUp />` components directly.
- Do not build custom sign-in/sign-up forms (custom email/password fields, custom OAuth buttons, etc.) — use Clerk's own `<SignIn />` / `<SignUp />` components as-is, styled only via Clerk's [appearance/theme API](https://clerk.com/docs/customization/overview) if styling changes are needed.

## Reading the current user on the server

- Per [`docs/data-fetching.md`](./data-fetching.md), all data access happens in `/data` helper functions called from Server Components.
- Every `/data` helper that reads or writes user-owned data must get the current user via `auth()` from `@clerk/nextjs/server`, and must throw if `userId` is missing:

  ```ts
  import "server-only";
  import { auth } from "@clerk/nextjs/server";

  export async function getSomethingForCurrentUser() {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Not authenticated");
    }

    // scope every query by userId — see docs/data-fetching.md
  }
  ```

- Never accept a caller-supplied user id (route param, query param, form field, client prop) as the identity used to scope a query. The `userId` must always come from Clerk's `auth()`, never from client input.
- Do not read the current user via `currentUser()`/`auth()` inside Client Components. If a Client Component needs identity-derived data, it must be passed down as props from a Server Component, per [`docs/data-fetching.md`](./data-fetching.md).
