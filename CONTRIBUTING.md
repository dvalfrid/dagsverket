# Contributing to Dagsverket

Thanks for helping improve Dagsverket. This guide covers setup, the change
workflow, the commit convention, and the checks your change must pass.

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Development workflow](#development-workflow)
- [Commit message format](#commit-message-format)
- [Code standards](#code-standards)
- [Testing your change](#testing-your-change)
- [Documentation requirements](#documentation-requirements)
- [Opening a pull request](#opening-a-pull-request)
- [Continuous integration](#continuous-integration)
- [Releases](#releases)
- [Project layout](#project-layout)

## Code of conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful and
constructive, assume good faith, keep discussion on the code.

## Prerequisites

- **Node.js 20.9+** (CI runs 24 — see `.nvmrc`)
- **npm** (bundled with Node)
- No OS lock-in — the app runs on Linux/macOS/Windows; the deploy target is a
  Linux Docker host (NAS).

## Getting started

```bash
git clone https://github.com/dvalfrid/dagsverket.git
cd dagsverket
npm install
cp .env.example .env          # set AUTH_SECRET (>=16 chars) and ADMIN_PIN
npx prisma migrate dev        # creates prisma/dev.db
npm run db:seed               # demo people, profiles, chores, meals
npm run dev                   # http://localhost:3000
```

First load shows a pairing code. Open `/admin` (PIN from `ADMIN_PIN`, default
`1234`), go to **Enheter**, pair the screen to a profile.

## Development workflow

Every bug fix and feature follows this sequence. The `/commit-workflow` skill
runs the full ceremony.

1. **Open a GitHub issue first** — describe the bug (wrong behaviour, repro steps,
   expected behaviour) or the feature (user-visible change and why).
2. **Branch** from `main`.
3. **Implement** the change.
4. **Verify it works in the running app** (`npm run dev`) — the golden path _and_
   the edge cases. Passing tests prove code correctness, not behaviour.
5. **Run the checks** for what you changed (table below).
6. **Update documentation** — see [Documentation requirements](#documentation-requirements).
7. **Commit** with a [Conventional Commits](#commit-message-format) message that
   ends with `Closes #N`.
8. **Open a pull request** against `main`.

### Checks after a code change

Run these before opening a PR — do not wait to be asked.

| Changed                | Run                                                                      |
| ---------------------- | ------------------------------------------------------------------------ |
| Any `.ts` / `.tsx`     | `npm run lint` and `npm run typecheck`                                   |
| Formatting of anything | `npm run format` (writes) or `npm run format:check`                      |
| Logic in `lib/`        | `npm test`                                                               |
| `prisma/schema.prisma` | `npm run db:migrate` — commit the generated migration in the same commit |
| Any user-facing string | add the key to **both** `messages/sv.json` and `messages/en.json`        |
| Unsure                 | `npm run lint && npm run typecheck && npm test && npm run build`         |

`npm run lint` must be clean — zero warnings. If `npm run format` changes files,
include them in the same commit. Do not add `// eslint-disable` without a short
reason comment.

## Commit message format

**Mandatory** — [Release Please](https://github.com/googleapis/release-please)
parses commit subjects to generate `CHANGELOG.md` and bump the version. A commit
that does not follow this format is silently dropped from the changelog.

```
<type>(<scope>): <subject>

<optional body>

Closes #N
```

- **type**: `feat`, `fix`, `perf`, `docs`, `refactor`, `test`, `build`, `chore`,
  `style`. Only `feat` / `fix` / `perf` surface in the changelog.
- **scope**: lower-case area, e.g. `calendar`, `chores`, `shopping`, `meals`,
  `clock`, `dashboard`, `admin`, `pair`, `device`, `auth`, `ics`, `i18n`,
  `widgets`, `docker`, `ci`, `deps`, `readme`. Optional but expected.
- **subject**: imperative, lower-case start, no trailing period.
- **Breaking change**: `feat!:` / `fix!:` or a `BREAKING CHANGE:` footer.
- Always include `Closes #N` so GitHub closes the issue automatically on push to
  `main`. Forgot it? `gh issue close N --comment "Fixed in <sha>."`

Examples:

```
feat(calendar): add week timetable view with per-feed toggles
fix(device): stop minting a new device on every /pair poll over HTTP
docs(readme): document the prebuilt Docker image
```

For the full issue → implement → test → commit → roadmap-sync flow, run
`/commit-workflow`.

## Code standards

Full rules are in [STANDARDS.md](STANDARDS.md). The essentials:

- **TypeScript / React** — 2-space indent, double quotes, semicolons, trailing
  commas, ~100 col (Prettier enforces). `camelCase` values, `PascalCase`
  components/types. Server Components by default; `"use client"` only when you
  need state/effects/events. No `any` — use `unknown` and narrow.
- **API routes** wrap the handler with `handler()` from `lib/http.ts`, validate
  the body with Zod, and call `publish(...)` on `lib/bus` after a mutation.
- **Prisma** — the schema is the source of truth; every schema change ships with
  a migration (CI enforces this). Import the client only from `lib/db.ts`.
- **Dates** — always `"YYYY-MM-DD"` keys via `lib/dates.ts` (UTC-based). Never do
  `new Date()` arithmetic in components.
- **i18n** — every user-facing string goes through `next-intl`; add the key to
  both locale files (`sv` is default). CI fails on key drift.
- **Styling** — use the design tokens in `app/globals.css` (`bg-surface`,
  `text-text-muted`, `border-border`, `accent`, …); no raw hex in `className`.
- **Keep it simple.** Prefer the smallest change that solves the issue. No new
  dependencies without discussion. Don't restructure modules or rename files
  unless the issue calls for it.

AI-assisted code is welcome and held to the exact same standards.

## Testing your change

Do not commit until the change is confirmed working in `npm run dev`. Then:

```bash
npm test            # vitest — lib/ logic (dates, recurrence, ICS, signing, …)
npm run typecheck   # tsc --noEmit
npm run build       # full Next build (also type-checks)
```

Vitest specs live in `tests/`. Run one file with `npx vitest run tests/dates.test.ts`.

## Documentation requirements

Keep these consistent with the code before opening a PR:

| What changed                              | Where to update                   |
| ----------------------------------------- | --------------------------------- |
| New widget, API route, or `lib/` module   | `CLAUDE.md` — Layout section      |
| New user-visible feature or scope change  | `ROADMAP.md` — mark done / adjust |
| New deploy step, env var, or setup change | `README.md`                       |
| New behaviour or architectural rule       | `CLAUDE.md` — Conventions section |

## Opening a pull request

1. Push your branch and open a PR against `dvalfrid/dagsverket:main`.
2. Reference the issue (`Closes #N` in a commit; mention it in the PR body).
3. Describe the user-visible change and how you verified it in the running app.
4. The **CI** check must pass.

Release Please folds merged commits into the next release automatically based on
the commit type.

## Continuous integration

`.github/workflows/ci.yml` runs on every push and PR:

- `verify` — `npm ci`, `prisma generate`, migration-drift check,
  `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`,
  `npm run build`.
- `image` — builds the Dockerfile; pushes `ghcr.io/dvalfrid/dagsverket` on
  `main` / `v*` tags after `verify` passes.

## Releases

Merges to `main` update an open **Release Please** PR. Merging that PR tags
`vX.Y.Z`, writes `CHANGELOG.md`, bumps `package.json`, and triggers the versioned
Docker image build. Version bump follows the commits: `fix`/`perf` → patch,
`feat` → minor, `!`/`BREAKING CHANGE` → major (pre-1.0: minor).

## Project layout

| Path                  | Contents                                                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/[locale]/`       | dashboard, `pair/`, `admin/*` pages                                                                                                            |
| `app/api/**/route.ts` | route handlers (all via `handler()` in `lib/http.ts`)                                                                                          |
| `components/widgets/` | Clock, Calendar, Chores, Shopping, Meals                                                                                                       |
| `components/admin/`   | admin console + `ProfileEditor` (dnd widget editor)                                                                                            |
| `lib/`                | `db`, `auth`/`signing`, `device`, `dates`, `recurrence`, `ics`/`calendar`, `bus`, `widgets`, `calendarLayout`, `useLiveData`, `format`, `http` |
| `messages/`           | `sv.json` (default) + `en.json`                                                                                                                |
| `prisma/`             | `schema.prisma`, `migrations/`, `seed.ts`                                                                                                      |
| `tests/`              | Vitest unit specs                                                                                                                              |

Deeper notes: [CLAUDE.md](CLAUDE.md).
