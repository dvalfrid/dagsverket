@AGENTS.md

# Dagsverket — project notes

Family dashboard. One backend on a NAS (Docker), many iPads, each device paired
to a **profile** that decides which widgets it shows. See `README.md` for setup.

**Before coding:** [`CONTRIBUTING.md`](CONTRIBUTING.md) (workflow + commit format)
and [`STANDARDS.md`](STANDARDS.md) (code rules). Commits are
[Conventional Commits](https://www.conventionalcommits.org/) — Release Please
parses them for `CHANGELOG.md` + version bump; always end with `Closes #N`. Full
ceremony: the `/commit-workflow` skill.

## Stack facts worth remembering

- **Next.js 16** (App Router, Turbopack). Read `node_modules/next/dist/docs/` — APIs differ from older Next.
- **Prisma 6** (`prisma@6.19.3`) with **SQLite**. Prisma 7 was tried and reverted (mandatory driver adapters + no `.env` autoload). Keep on 6.x.
- `next-intl` v4, `[locale]` segment, `sv` default (no prefix), `en` at `/en`. Middleware still `middleware.ts` (Next 16 warns "use proxy"; next-intl doesn't support `proxy.ts` yet — the warning is expected).
- npm 11.19 defers package install scripts ("not yet covered by allowScripts"). If Prisma/native deps look half-installed, run plain `npm install` again.

## Layout

- `app/[locale]/` — `page.tsx` (dashboard), `pair/`, `admin/*`
- `app/api/**/route.ts` — all handlers use `handler()` from `lib/http.ts` (JSON errors + `{ admin: true }` gate)
- `lib/` — `db`, `auth` (cookie session + PIN) + `signing` (HMAC, no Next imports), `device` (pairing), `dates` (UTC date-key math, Monday-first, ISO week), `recurrence`, `ics` + `calendar` (feed sync), `calendarLayout` (week-view lane packing), `bus` (SSE), `widgets` (config schema + defaults), `useLiveData` (SWR + SSE), `format`, `http` (`handler()` wrapper)
- `components/widgets/` — Clock, Calendar, Chores, Shopping, Meals; registered in `DashboardGrid.tsx`
- `components/admin/` — console; `ProfileEditor.tsx` has the dnd-kit widget editor

## Conventions

- Mutations `publish(...keys)` on `lib/bus`; clients revalidate matching SWR keys via `/api/stream`.
- Dates are `"YYYY-MM-DD"` keys everywhere chores/meals are involved; helpers in `lib/dates.ts` (all UTC-based, no DST traps).
- Chore recurrence: `daily | weekdays | weekly | custom`; `weekdaysMask` bit 0 = Monday.
- Admin-only APIs gated by `isAdmin()`; shopping + chore-toggle are intentionally open (kids' devices have no login).

## Checks

`npm run format:check` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run build`
(CI `verify` runs all of these + a Prisma migration-drift check; `image` builds/pushes the Docker image.)
