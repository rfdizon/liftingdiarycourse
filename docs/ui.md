# UI Coding Standards

These standards are mandatory for all UI work in this project. They exist to keep the UI consistent, maintainable, and free of one-off styling drift.

## Components: shadcn/ui only

- **ONLY [shadcn/ui](https://ui.shadcn.com) components may be used to build UI in this project.**
- **ABSOLUTELY NO custom components may be created.** Do not hand-roll buttons, inputs, cards, dialogs, dropdowns, tables, or any other UI primitives.
- If a needed component does not yet exist in `src/components/ui`, install it via the shadcn CLI:

  ```
  npx shadcn@latest add <component>
  ```

  Do not write it by hand as a substitute.
- Composition of shadcn components (e.g. combining `Card`, `Button`, and `Input` to build a form) is expected and encouraged. What is not allowed is introducing new bespoke UI primitives outside of what shadcn provides.
- If shadcn genuinely has no component that fits a requirement, stop and raise it rather than silently writing a custom one.
- Icons should come from `lucide-react`, matching shadcn's default icon set.

## Date formatting

- All date formatting must use [`date-fns`](https://date-fns.org/).
- Dates must be displayed with an ordinal day, abbreviated month, and full year, formatted as:

  ```
  1st Sep 2025
  2nd Aug 2025
  3rd Jan 2026
  4th Jun 2024
  ```

- Use the `date-fns` `format` function with the pattern `do MMM yyyy`:

  ```ts
  import { format } from "date-fns";

  format(new Date(), "do MMM yyyy"); // e.g. "4th Aug 2026"
  ```

- Do not use `Date.prototype.toLocaleDateString`, `Intl.DateTimeFormat`, or any other date library (e.g. `moment`, `dayjs`, `luxon`) for formatting dates shown in the UI.
