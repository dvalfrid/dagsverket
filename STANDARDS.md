# Code Standards

Coding, formatting, and architectural rules for Dagsverket. All contributors and
AI assistants follow these when writing, changing, or reviewing code. The goal is
a predictable codebase that is easy to reason about.

## Contents

- [Tools and commands](#tools-and-commands)
- [TypeScript and React](#typescript-and-react)
- [Next.js 16 (App Router)](#nextjs-16-app-router)
- [API route handlers](#api-route-handlers)
- [Prisma and the database](#prisma-and-the-database)
- [Dates and recurrence](#dates-and-recurrence)
- [Internationalisation](#internationalisation)
- [Styling (Tailwind v4)](#styling-tailwind-v4)
- [Tests](#tests)
- [AI-generated code](#ai-generated-code)

---

## Tools and commands

| Purpose                | Command                 |
| ---------------------- | ----------------------- |
| Format (write)         | `npm run format`        |
| Check formatting (CI)  | `npm run format:check`  |
| Lint                   | `npm run lint`          |
| Lint with auto-fix     | `npm run lint -- --fix` |
| Type-check             | `npm run typecheck`     |
| Unit tests             | `npm test`              |
| Production build       | `npm run build`         |
| Validate Prisma schema | `npx prisma validate`   |
| Format Prisma schema   | `npx prisma format`     |

Run `npm run format:check && npm run lint && npm run typecheck` before every commit.

---

## TypeScript and React

Formatting is enforced by Prettier (`.prettierrc.json`) and lint rules by
`eslint.config.mjs` (`eslint-config-next` + `eslint-config-prettier`).

### Formatting

- **2-space indent**, **double quotes**, **semicolons**, **trailing commas**
  (multiline), print width **100**. Never format by hand — `npm run format`.

### Naming

| Kind                                | Convention             | Example                        |
| ----------------------------------- | ---------------------- | ------------------------------ |
| Variables, functions, hooks         | `camelCase`            | `todayKey`, `useLiveData`      |
| React components, types, interfaces | `PascalCase`           | `CalendarWeek`, `WidgetConfig` |
| Module-scope constants              | `SCREAMING_SNAKE_CASE` | `DEVICE_TTL_S`, `WIDGET_TYPES` |
| Component files                     | `PascalCase.tsx`       | `ChoresWidget.tsx`             |
| Non-component modules               | `camelCase.ts`         | `calendarLayout.ts`            |

### Types

- **No `any`.** Use `unknown` and narrow, or a precise type. `as` casts need a
  reason.
- Prefer `interface` for object shapes, `type` for unions/aliases.
- Validate every external input (request bodies, `widgetsJson`, env) with **Zod**;
  do not trust `JSON.parse` results.

### Comments

- Comment _why_, not _what_. A 1–3 line comment at the top of a non-obvious module
  describing its responsibility. No JSDoc on internal helpers.

### Error handling

- Client mutations go through `apiFetch` from `lib/useLiveData.ts` — it throws
  `ApiError`. Always `try/catch` or `.catch()` around it.
- An empty catch is fine only when the failure is genuinely non-critical — add a
  comment: `catch { /* offline is fine, SWR will retry */ }`.
- Server code throws; the `handler()` wrapper turns it into a JSON error response.

---

## Next.js 16 (App Router)

> This is not the Next.js in your training data. Check `node_modules/next/dist/docs/`
> before using an API you're unsure about.

- **Server Components by default.** Add `"use client"` only for state, effects,
  refs, event handlers, or browser APIs. Keep client components small and push
  them to the leaves.
- Request APIs are **async**: `await cookies()`, `await headers()`,
  `await params`, `await searchParams`.
- `middleware.ts` stays as-is (next-intl needs it; the Next 16 "use proxy"
  deprecation warning is expected).
- Dashboard/admin pages are `export const dynamic = "force-dynamic"` — they read
  the device cookie per request.

---

## API route handlers

Every `app/api/**/route.ts` handler:

- Wraps its body in **`handler()`** from `lib/http.ts` — this gives JSON error
  handling and the `{ admin: true }` gate. Never hand-roll the try/catch.
- Parses the request body with **`readJson(req, zodSchema)`**.
- Calls **`publish(...keys)`** on `lib/bus` after any mutation so connected
  dashboards revalidate over SSE.
- Returns via `ok(data)` / `bad(message, status)`.
- Admin-only endpoints pass `{ admin: true }`. `shopping` and `chores/toggle`
  are intentionally open (kids' devices have no login).

---

## Prisma and the database

- **`prisma/schema.prisma` is the source of truth.** Every schema change ships
  with a migration in the _same commit_ (`npm run db:migrate`). CI fails on drift
  (`prisma migrate diff --exit-code`).
- Import the client **only** from `lib/db.ts` (the shared singleton). Never
  `new PrismaClient()` elsewhere.
- SQLite has **no enums** — model them as `String` with an inline comment listing
  the allowed values (`// "daily" | "weekdays" | "weekly" | "custom"`).
- Keep on **Prisma 6.x** — see `CLAUDE.md` for why 7 was reverted.
- Date-key columns (chores, meals) are `String` in `"YYYY-MM-DD"` form, not
  `DateTime`.

---

## Dates and recurrence

- All day-level math goes through **`lib/dates.ts`** — `todayKey`, `weekStart`,
  `weekDays`, `addDays`, `isoWeek`, `weekdayIndex`. These are **UTC-based** with
  no DST traps.
- Never construct dates or do `+ 86400000` arithmetic inside a component.
- Week is **Monday-first**, ISO week numbers.
- Chore recurrence: `daily | weekdays | weekly | custom`; `weekdaysMask` **bit 0
  = Monday**.

---

## Internationalisation

- Every user-facing string comes from **`next-intl`** (`useTranslations`,
  `useFormatter`). No hard-coded UI text.
- Add each new key to **both** `messages/sv.json` and `messages/en.json`. The
  `tests/messages.test.ts` parity check fails the build otherwise.
- `sv` is the default locale (served without a prefix); `en` lives at `/en`.
- Format dates/times/numbers with `useFormatter`, not manual string building.

---

## Styling (Tailwind v4)

- Tailwind v4, configured in `app/globals.css` via `@theme` — there is no
  `tailwind.config`.
- **Use the design tokens**: `bg-bg`, `bg-surface`, `bg-surface-2`,
  `text-text`, `text-text-muted`, `text-text-subtle`, `border-border`,
  `accent` / `accent-soft`, `success` / `warning` / `danger`, radii
  `rounded-xl` / `rounded-2xl`. **No raw hex in `className`.**
- Per-person / per-feed colours come from data — apply them as inline
  `style={{ backgroundColor: hexToRgba(color, 0.2) }}` (`hexToRgba` in
  `lib/format.ts`), never as arbitrary Tailwind values.
- Dark is the default (`:root`); a profile opts into light with
  `data-theme="light"` on a wrapper.
- Dashboard widgets are touch targets — interactive elements ≥ 44px, and each
  widget scrolls its own overflow (never pushes the grid).

---

## Tests

- Pure logic in `lib/` gets a Vitest spec in `tests/` (`*.test.ts`, node env).
- Extract testable logic out of components (see `lib/calendarLayout.ts`) rather
  than reaching for a DOM testing setup.
- A `fix` commit should add a test that fails before the fix.

---

## AI-generated code

AI assistants may be used, but generated code meets the same bar as hand-written:

- Keep it simple and concrete — no speculative abstractions, generics, or
  indirection.
- Must pass `npm run format:check`, `npm run lint`, `npm run typecheck`, and
  `npm test` with zero warnings.
- Follow every naming, formatting, and structure rule above.
- No new dependencies without explicit approval — prefer what's already here.
- Do not restructure modules, rename files, or change architecture unless the
  issue calls for it.
- Reviewed with the same scrutiny as human-written code.
