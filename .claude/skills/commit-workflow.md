---
name: commit-workflow
description: Full ceremony for shipping any bug fix or feature in Dagsverket — from opening a GitHub issue through roadmap sync. Run when starting work on a feature/bug or when ready to commit.
---

Mandatory sequence for every bug fix and feature. Do not skip or reorder.

## 1. Open a GitHub issue before starting work

```bash
gh issue create --title "..." --body "..." --label bug
# or: --label enhancement
```

- **Bug:** wrong behaviour, steps to reproduce, expected behaviour.
- **Feature:** the user-visible change and why it's needed.

## 2. Implement the change

Follow [STANDARDS.md](../../STANDARDS.md). Keep it to the smallest change that
solves the issue.

## 3. Verify it works in the running app — required before any commit

```bash
npm run dev        # http://localhost:3000
```

Open the affected UI state (dashboard widget, `/admin` page, `/pair`). Check the
golden path **and** the edge cases. The Next dev overlay and the terminal must be
free of errors. Passing tests prove code correctness, not behaviour.

## 4. Run the checks for what you changed

| Changed                | Run                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `.ts` / `.tsx`         | `npm run lint` + `npm run typecheck`                                                     |
| Anything               | `npm run format:check` (or `npm run format` to write)                                    |
| Logic in `lib/`        | `npm test`                                                                               |
| `prisma/schema.prisma` | `npm run db:migrate` — commit the migration in the same commit                           |
| User-facing string     | added to **both** `messages/sv.json` and `messages/en.json`                              |
| Unsure                 | `npm run format:check && npm run lint && npm run typecheck && npm test && npm run build` |

Zero lint warnings is the bar. If `npm run format` changed files, include them.

## 5. Commit with `Closes #N`

```
<type>(<scope>): <subject>

<optional body>

Closes #N
```

- **type:** `feat`, `fix`, `perf`, `docs`, `refactor`, `test`, `build`, `chore`,
  `style`. Only `feat` / `fix` / `perf` reach the changelog.
- **scope:** lower-case area — `calendar`, `chores`, `shopping`, `meals`, `clock`,
  `dashboard`, `admin`, `pair`, `device`, `auth`, `ics`, `i18n`, `widgets`,
  `docker`, `ci`, `deps`, `readme`.
- **subject:** imperative, lower-case start, no trailing period.
- Breaking change: `feat!:` / `fix!:` or a `BREAKING CHANGE:` footer.

If you forgot `Closes #N`: `gh issue close N --comment "Fixed in <sha>."`

## 6. If the issue is on the roadmap — sync it

If `ROADMAP.md` has a row for this work, in the **same commit** flip its status
(`🔲 Planned` → `✅ Done (vX)`) and adjust the wording. A merged feature whose
roadmap row still says "Planned" is drift.

## 7. Update documentation for feature changes

| What changed                            | Where                     |
| --------------------------------------- | ------------------------- |
| New widget, API route, or `lib/` module | `CLAUDE.md` — Layout      |
| New behaviour / architectural rule      | `CLAUDE.md` — Conventions |
| New deploy step, env var, setup change  | `README.md`               |
| Feature complete / scope change         | `ROADMAP.md`              |

## 8. Push / open the PR

`git push` your branch and open a PR against `main`. CI (`verify` + `image`)
must pass. Release Please folds the commit into the next release by type.
