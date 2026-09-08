import { redirect } from "@/i18n/navigation";
import { resolveDevice } from "@/lib/device";
import { PairScreen } from "@/components/PairScreen";

export const dynamic = "force-dynamic";

export default async function PairPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const device = await resolveDevice();
  if (device?.profile) redirect({ href: "/", locale });

  return <PairScreen />;
}
