import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_WIDGETS } from "../lib/widgets";
import { todayKey, weekDays } from "../lib/dates";

const db = new PrismaClient();

const MON = 1,
  THU = 8,
  FRI = 16,
  SAT = 32;

async function ensureSettings() {
  const defaults: Record<string, string> = {
    timezone: process.env.TZ || "Europe/Stockholm",
    default_locale: "sv",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  const hasPin = await db.setting.findUnique({ where: { key: "admin_pin_hash" } });
  if (!hasPin) {
    const pin = process.env.ADMIN_PIN || "1234";
    await db.setting.create({
      data: { key: "admin_pin_hash", value: await bcrypt.hash(pin, 10) },
    });
    console.log(`  seeded admin PIN from ADMIN_PIN (${pin === "1234" ? "default 1234" : "custom"})`);
  }
}

async function seedFamily() {
  if ((await db.person.count()) > 0) {
    console.log("  people already exist — skipping demo data");
    return;
  }

  const [p1, p2, k1, k2] = await Promise.all([
    db.person.create({ data: { name: "Förälder 1", color: "#6c8cff", avatarEmoji: "🧔", sortOrder: 0 } }),
    db.person.create({ data: { name: "Förälder 2", color: "#3ecf8e", avatarEmoji: "👩", sortOrder: 1 } }),
    db.person.create({ data: { name: "Barn 1", color: "#f5b544", avatarEmoji: "🦊", isChild: true, sortOrder: 2 } }),
    db.person.create({ data: { name: "Barn 2", color: "#ff6b6b", avatarEmoji: "🐰", isChild: true, sortOrder: 3 } }),
  ]);

  await db.profile.create({
    data: {
      name: "Familj (vägg)",
      type: "family",
      theme: "dark",
      widgetsJson: JSON.stringify(DEFAULT_WIDGETS.family),
    },
  });
  await db.profile.create({
    data: {
      name: "Admin",
      type: "admin",
      theme: "dark",
      widgetsJson: JSON.stringify(DEFAULT_WIDGETS.admin),
    },
  });
  await db.profile.create({
    data: {
      name: k1.name,
      type: "child",
      theme: "dark",
      personId: k1.id,
      widgetsJson: JSON.stringify(DEFAULT_WIDGETS.child),
    },
  });
  await db.profile.create({
    data: {
      name: k2.name,
      type: "child",
      theme: "dark",
      personId: k2.id,
      widgetsJson: JSON.stringify(DEFAULT_WIDGETS.child),
    },
  });

  await db.chore.createMany({
    data: [
      { title: "Duka bordet", personId: k1.id, recurrence: "daily", sortOrder: 0 },
      { title: "Tömma diskmaskinen", personId: k2.id, recurrence: "daily", sortOrder: 1 },
      { title: "Ta ut soporna", personId: p1.id, recurrence: "weekly", weekdaysMask: MON, sortOrder: 2 },
      { title: "Vattna blommorna", personId: k1.id, recurrence: "custom", weekdaysMask: MON | THU, sortOrder: 3 },
      { title: "Dammsuga", personId: p2.id, recurrence: "weekly", weekdaysMask: FRI, sortOrder: 4 },
      { title: "Städa rummet", personId: k2.id, recurrence: "weekly", weekdaysMask: SAT, sortOrder: 5 },
      { title: "Läsläxa", personId: k1.id, recurrence: "weekdays", sortOrder: 6 },
    ],
  });

  await db.calendarFeed.create({
    data: {
      name: "Proton – familj",
      url: "https://example.com/byt-ut-mot-din-proton-ics-lank.ics",
      color: "#6c8cff",
      enabled: false,
      lastError: "Inte konfigurerad än – klistra in din delade ICS-länk från Proton Calendar.",
    },
  });

  const week = weekDays(todayKey());
  const dinners = [
    "Köttbullar med potatismos",
    "Tacos",
    "Fläskfilé med klyftpotatis",
    "Pannkakor med sylt",
    "Fredagsmys – pizza",
    "Lax med kokt potatis",
    "Söndagsstek",
  ];
  await db.mealPlan.createMany({
    data: week.map((date, i) => ({ date, slot: "dinner", title: dinners[i] })),
  });

  await db.shoppingItem.createMany({
    data: [
      { name: "Mjölk", quantity: "2 l", category: "Mejeri", sortOrder: 0, addedByPersonId: p1.id },
      { name: "Ägg", quantity: "12-pack", category: "Mejeri", sortOrder: 1, addedByPersonId: p1.id },
      { name: "Knäckebröd", category: "Skafferi", sortOrder: 2, addedByPersonId: p2.id },
      { name: "Smör", category: "Mejeri", sortOrder: 3, addedByPersonId: p2.id },
      { name: "Kaffe", category: "Skafferi", sortOrder: 4, addedByPersonId: p1.id },
      { name: "Bananer", quantity: "1 klase", category: "Frukt", checked: true, sortOrder: 5, addedByPersonId: k1.id },
    ],
  });

  console.log("  seeded 4 people, 4 profiles, 7 chores, 1 feed, a week of dinners, 6 shopping items");
}

async function main() {
  console.log("Seeding dagsverket…");
  await ensureSettings();
  await seedFamily();
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
