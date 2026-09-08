# Roadmap

Rough priority order. Each item is a self-contained change.

## Status overview

| Area                                                                      | Status                                                             |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Device pairing + per-profile widget layouts                               | ✅ Done (v1)                                                       |
| Widgets: clock, calendar, chores, shopping, meals                         | ✅ Done (v1)                                                       |
| Calendar: ICS feed subscription (Proton), hourly sync                     | ✅ Done (v1)                                                       |
| Calendar: agenda + week/timetable view, per-feed toggles, event detail    | ✅ Done (v1)                                                       |
| Admin console (people, devices, profiles, chores, feeds, meals, settings) | ✅ Done (v1)                                                       |
| i18n (sv default, en)                                                     | ✅ Done (v1)                                                       |
| Docker image published to GHCR + compose quickstart                       | ✅ Done (v1)                                                       |
| API / route-handler integration tests                                     | 🔲 Planned — [#1](https://github.com/dvalfrid/dagsverket/issues/1) |
| End-to-end tests (Playwright)                                             | 🔲 Planned — [#2](https://github.com/dvalfrid/dagsverket/issues/2) |
| ICS parser edge cases (TZID, multi-day all-day, RECURRENCE-ID)            | 🔲 Planned — [#3](https://github.com/dvalfrid/dagsverket/issues/3) |
| Local calendar events (create/edit in Dagsverket, not just subscribe)     | 🔲 Planned (v2)                                                    |
| Weather widget + location setting                                         | 🔲 Planned (v2)                                                    |
| Chore points / rewards                                                    | 🔲 Planned (v2)                                                    |
| Recipe / ingredient library for meal planning                             | 🔲 Planned (v2)                                                    |
| Photo slideshow widget                                                    | 🔲 Planned (v2)                                                    |
| Per-person PINs (instead of one shared admin PIN)                         | 🔲 Planned (v2)                                                    |
| Offline service worker for the wall display                               | 🔲 Planned (v2)                                                    |
| Multi-arch Docker image (`linux/arm64` for ARM NAS units)                 | 🔲 Planned                                                         |

## Notes

- The data model already carries `source` (`ics` \| `local`) and nullable
  `feedId` on `CalendarEvent` so local events can land without a schema break.
- v2 items are not committed scope — open an issue before starting one.
