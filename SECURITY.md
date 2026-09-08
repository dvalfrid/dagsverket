# Security Policy

## Supported Versions

Only the latest release receives security fixes.

| Version        | Supported |
| -------------- | --------- |
| Latest release | ✅        |
| Older versions | ❌        |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Use one of these private channels:

- **GitHub private vulnerability reporting** —
  [Report a vulnerability](https://github.com/dvalfrid/dagsverket/security/advisories/new)
  (preferred)
- **Email** — daniel@valfridsson.net

Include as much of the following as possible:

- Type of issue (e.g. auth bypass, cookie forgery, SSRF via ICS URL, injection)
- Steps to reproduce
- Affected version
- Potential impact

## Response Timeline

|                 | Target                                      |
| --------------- | ------------------------------------------- |
| Acknowledgement | Within 7 days                               |
| Patch release   | Within 14 days of a confirmed vulnerability |

## Scope and threat model

Dagsverket is designed to run on a **trusted home LAN**, reachable by paired
family iPads, with no authentication for kids' devices by design. Security
issues most relevant to this project:

- **Cookie forgery** — bypassing the HMAC-signed `dv_device` / `dv_admin`
  cookies (`lib/signing.ts`).
- **Admin gate bypass** — reaching an `{ admin: true }` route without a valid
  admin session.
- **Secret handling** — `AUTH_SECRET`, `ADMIN_PIN`, and subscribed calendar ICS
  URLs are secrets; they must never end up in logs, the client bundle, or the
  repo. `.env` and `prisma/*.db` are git-ignored.
- **SSRF** — the ICS sync fetches an admin-supplied URL server-side; consider the
  blast radius on a LAN.
- **Dependency / supply-chain** issues in the published Docker image.

Out of scope: attacks that require already having a shell on the host or a
trusted position on the LAN; the intentionally open shopping / chore-toggle
endpoints; running the app directly on the public internet without a proxy
(unsupported deployment).
