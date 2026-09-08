import { ensureDevice } from "@/lib/device";
import { parseWidgets, DEFAULT_WIDGETS } from "@/lib/widgets";
import { handler, ok } from "@/lib/http";

/** Resolve (or register) the calling device and return its profile + widgets. */
export const GET = handler(async (req) => {
  const device = await ensureDevice(req.headers.get("user-agent") ?? undefined);

  if (!device.profile) {
    return ok({
      paired: false,
      pairingCode: device.pairingCode,
      device: { id: device.id, name: device.name },
    });
  }

  const p = device.profile;
  const widgets = parseWidgets(p.widgetsJson);

  return ok({
    paired: true,
    device: { id: device.id, name: device.name },
    profile: {
      id: p.id,
      name: p.name,
      type: p.type,
      locale: p.locale,
      theme: p.theme,
      person: p.person,
      widgets: widgets.length
        ? widgets
        : DEFAULT_WIDGETS[(p.type as keyof typeof DEFAULT_WIDGETS) ?? "family"] ??
          DEFAULT_WIDGETS.family,
    },
  });
});
