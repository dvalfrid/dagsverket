"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLiveData, apiFetch } from "@/lib/useLiveData";
import { Button, Field, inputClass } from "@/components/ui";
import { PageTitle } from "@/components/admin/parts";

export default function SettingsAdmin() {
  const t = useTranslations("admin.settings");
  const { data, mutate } = useLiveData<{ timezone: string; defaultLocale: string }>(
    "/api/admin/settings",
  );
  const [newPin, setNewPin] = useState("");
  const [saved, setSaved] = useState(false);

  async function save(body: Record<string, unknown>) {
    await apiFetch("/api/admin/settings", { method: "PATCH", json: body });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    mutate();
  }

  return (
    <>
      <PageTitle>{t("title")}</PageTitle>

      <div className="card max-w-md space-y-4 p-5">
        <Field label={t("timezone")}>
          <input
            defaultValue={data?.timezone ?? ""}
            onBlur={(e) =>
              e.target.value &&
              e.target.value !== data?.timezone &&
              save({ timezone: e.target.value })
            }
            className={inputClass()}
          />
        </Field>

        <Field label={t("defaultLocale")}>
          <select
            value={data?.defaultLocale ?? "sv"}
            onChange={(e) => save({ defaultLocale: e.target.value })}
            className={inputClass()}
          >
            <option value="sv">Svenska</option>
            <option value="en">English</option>
          </select>
        </Field>

        <div className="border-t border-border pt-4">
          <Field label={t("newPin")}>
            <div className="flex gap-2">
              <input
                type="password"
                inputMode="numeric"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className={inputClass("tracking-[0.3em]")}
              />
              <Button
                variant="primary"
                disabled={!/^\d{4,10}$/.test(newPin)}
                onClick={() => {
                  save({ newPin });
                  setNewPin("");
                }}
              >
                {t("changePin")}
              </Button>
            </div>
          </Field>
        </div>

        {saved ? <p className="text-sm text-success">✓</p> : null}
      </div>
    </>
  );
}
