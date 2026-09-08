import { redirect } from "@/i18n/navigation";
import { resolveDevice } from "@/lib/device";
import { parseWidgets, DEFAULT_WIDGETS } from "@/lib/widgets";
import { Dashboard, type DashboardData } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const device = await resolveDevice();

  if (!device || !device.profile) {
    redirect({ href: "/pair", locale });
  }

  const p = device!.profile!;
  const widgets = parseWidgets(p.widgetsJson);
  const initial: DashboardData = {
    device: { id: device!.id, name: device!.name },
    profile: {
      id: p.id,
      name: p.name,
      type: p.type as DashboardData["profile"]["type"],
      locale: p.locale,
      theme: p.theme as "dark" | "light",
      person: p.person,
      widgets: widgets.length
        ? widgets
        : DEFAULT_WIDGETS[(p.type as keyof typeof DEFAULT_WIDGETS) ?? "family"],
    },
  };

  return <Dashboard initial={initial} />;
}
