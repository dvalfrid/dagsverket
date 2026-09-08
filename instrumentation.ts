/**
 * Boot-time hook. Runs the ICS calendar sync on a schedule so subscribed
 * Proton/other feeds stay fresh without any user action.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const g = globalThis as unknown as { __dvCron?: boolean };
  if (g.__dvCron) return;
  g.__dvCron = true;

  const cron = (await import("node-cron")).default;
  const { syncAllFeeds } = await import("@/lib/calendar");

  const run = () => {
    syncAllFeeds().catch((err) => console.warn("[calendar] scheduled sync failed:", err));
  };

  // A few minutes past every hour, plus once shortly after startup.
  cron.schedule("7 * * * *", run);
  setTimeout(run, 8_000);
}
