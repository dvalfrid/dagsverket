# Dagsverket

Familjens dashboard för vägg-iPad och barnens iPads. En delad backend på NAS:en,
och per-enhet-profiler så att köksskärmen, förälderns vy och varje barns vy kan
visa olika saker.

**v1 innehåller:** kalender (prenumeration på Proton/ICS), sysslor & veckoschema,
inköpslista och middagsplanering, plus en klocka/vecka-widget. Gränssnittet finns
på svenska och engelska.

## Teknik

| | |
|---|---|
| Ramverk | Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 |
| Databas | SQLite via Prisma – en fil på en Docker-volym |
| Realtid | Server-Sent Events (`/api/stream`) + SWR i klienten |
| i18n | `next-intl` (`sv` standard, `en`) |
| Kalender | `node-ical`, synkas via `node-cron` (varje timme) |
| Auth | Delad admin-PIN (bcrypt), enhets-cookie signerad med `AUTH_SECRET` |

## Kom igång lokalt

```bash
npm install
cp .env.example .env        # sätt AUTH_SECRET och ev. ADMIN_PIN
npx prisma migrate dev      # skapar prisma/dev.db
npm run db:seed             # demodata: 4 personer, 4 profiler, sysslor, middagar
npm run dev                 # http://localhost:3000
```

Första gången visas en **parningskod**. Öppna `/admin` (PIN från `ADMIN_PIN`,
default `1234`), gå till **Enheter**, para skärmen mot en profil – klart.

### Användbara skript

| Skript | Gör |
|---|---|
| `npm run dev` | Utvecklingsserver |
| `npm run build` / `npm start` | Produktionsbygge / -server |
| `npm test` | Vitest (datumlogik, recurrence, ICS-parsning) |
| `npm run db:migrate` | Ny migration i dev |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | Nollställ databasen + seed |

## Distribuera på NAS (Docker)

```bash
# på NAS:en, i repo-mappen
printf 'AUTH_SECRET=%s\nADMIN_PIN=1234\n' "$(openssl rand -hex 32)" > .env
docker compose up -d --build
```

* Data ligger i den namngivna volymen `dagsverket-data` (`/data/dagsverket.db`).
* Containern kör `prisma migrate deploy` och en idempotent seed vid varje start.
* Nå dashboarden på `http://<nas-ip>:3000`.

Byt admin-PIN i **Admin → Inställningar** efter första inloggningen.

## Prenumerera på en Proton-kalender

1. Proton Calendar → kalenderns inställningar → **Dela** → kopiera länken som
   slutar på `.ics`.
2. **Admin → Kalender → Nytt flöde**, klistra in länken, välj färg, spara.
3. Klicka **Synka nu** (annars sker det automatiskt varje timme).

Flödena är skrivskyddade i v1 – händelser skapas i Proton, inte här.

## Så fungerar profiler & enheter

* **Person** – namn, färg, emoji. Sysslor kopplas till personer.
* **Profil** – en uppsättning widgets (typ, storlek, ordning) + tema + språk +
  ev. kopplad person. Typ `child` ger en läsvänlig barnvy; `admin`/`family` når
  hela adminkonsolen.
* **Enhet** – en iPad. Identifieras med en signerad cookie och paras mot en
  profil i adminkonsolen. Byt profil på en enhet när som helst – skärmen laddar
  om sig själv via SSE.

Widgets per profil redigeras under **Admin → Profiler** (kryssa i, dra för att
ordna, välj storlek).

## Projektstruktur

```
app/[locale]/            dashboard, /pair, /admin/*
app/api/                 route handlers (device, stream, chores, calendar, …)
components/widgets/       Clock, Calendar, Chores, Shopping, Meals
components/admin/         adminkonsolen
lib/                      db, auth, device, dates, recurrence, ics, calendar, bus
prisma/schema.prisma      datamodell
messages/{sv,en}.json     översättningar
```

## Miljövariabler

| Variabel | Beskrivning |
|---|---|
| `DATABASE_URL` | SQLite-sökväg. Lokalt `file:./dev.db`, i Docker `file:/data/dagsverket.db` |
| `AUTH_SECRET` | ≥32 tecken. Signerar cookies. **Krävs.** |
| `ADMIN_PIN` | Sätts som PIN vid första start (hashas sedan i databasen) |
| `TZ` | Tidszon, t.ex. `Europe/Stockholm` |
