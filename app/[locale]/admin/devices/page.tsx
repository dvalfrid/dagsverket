"use client";

import { useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { useLiveData, apiFetch } from "@/lib/useLiveData";
import { Button, inputClass, cn } from "@/components/ui";
import { PageTitle, ListCard, ListRow, DeleteButton } from "@/components/admin/parts";

interface Device {
  id: string;
  name: string;
  pairingCode: string | null;
  lastSeenAt: string | null;
  profile?: { id: string; name: string } | null;
}
interface Profile {
  id: string;
  name: string;
  type: string;
}

export default function DevicesAdmin() {
  const t = useTranslations("admin.devices");
  const f = useFormatter();
  const { data, mutate } = useLiveData<{ pending: Device[]; paired: Device[] }>("/api/devices");
  const { data: profiles } = useLiveData<Profile[]>("/api/profiles");

  return (
    <>
      <PageTitle>{t("title")}</PageTitle>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-subtle">
          {t("pending")}
        </h2>
        {data && data.pending.length > 1 ? (
          <button
            onClick={() => apiFetch("/api/devices/prune", { method: "POST" }).then(() => mutate())}
            className="text-xs text-text-subtle hover:text-danger"
          >
            {t("clearPending")}
          </button>
        ) : null}
      </div>
      <ListCard>
        {data?.pending.length ? (
          data.pending.map((d) => (
            <PendingRow key={d.id} device={d} profiles={profiles ?? []} onDone={mutate} />
          ))
        ) : (
          <ListRow className="text-sm text-text-subtle">–</ListRow>
        )}
      </ListCard>

      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-text-subtle">
        {t("paired")}
      </h2>
      <ListCard>
        {data?.paired.length ? (
          data.paired.map((d) => (
            <ListRow key={d.id}>
              <input
                defaultValue={d.name}
                onBlur={(e) =>
                  e.target.value !== d.name &&
                  apiFetch(`/api/devices/${d.id}`, {
                    method: "PATCH",
                    json: { name: e.target.value },
                  }).then(() => mutate())
                }
                className={inputClass("flex-1")}
              />
              <select
                value={d.profile?.id ?? ""}
                onChange={(e) =>
                  apiFetch(`/api/devices/${d.id}`, {
                    method: "PATCH",
                    json: { profileId: e.target.value || null },
                  }).then(() => mutate())
                }
                className={inputClass("w-44")}
              >
                {(profiles ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <span className="w-32 shrink-0 text-right text-xs text-text-subtle">
                {d.lastSeenAt ? f.relativeTime(new Date(d.lastSeenAt)) : t("never")}
              </span>
              <DeleteButton
                onConfirm={() =>
                  apiFetch(`/api/devices/${d.id}`, { method: "DELETE" }).then(() => mutate())
                }
              />
            </ListRow>
          ))
        ) : (
          <ListRow className="text-sm text-text-subtle">–</ListRow>
        )}
      </ListCard>
    </>
  );
}

function PendingRow({
  device,
  profiles,
  onDone,
}: {
  device: Device;
  profiles: Profile[];
  onDone: () => void;
}) {
  const t = useTranslations("admin.devices");
  const [profileId, setProfileId] = useState(profiles[0]?.id ?? "");
  const [name, setName] = useState(device.name === "Ny enhet" ? "" : device.name);
  const [busy, setBusy] = useState(false);

  async function pair() {
    if (!device.pairingCode || !profileId) return;
    setBusy(true);
    try {
      await apiFetch("/api/devices/pair", {
        json: { code: device.pairingCode, profileId, name: name || undefined },
      });
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <ListRow>
      <span
        className={cn(
          "shrink-0 rounded-lg bg-surface-2 px-2.5 py-1 font-mono text-sm tracking-widest",
        )}
      >
        {device.pairingCode}
      </span>
      <input
        placeholder={t("rename")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={inputClass("flex-1")}
      />
      <select
        value={profileId}
        onChange={(e) => setProfileId(e.target.value)}
        className={inputClass("w-44")}
      >
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <Button variant="primary" onClick={pair} disabled={busy || !profileId}>
        {t("approve")}
      </Button>
    </ListRow>
  );
}
