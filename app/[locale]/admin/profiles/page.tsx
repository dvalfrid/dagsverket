"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLiveData, apiFetch } from "@/lib/useLiveData";
import { Button, inputClass } from "@/components/ui";
import { PageTitle } from "@/components/admin/parts";
import { ProfileEditor, type AdminProfile } from "@/components/admin/ProfileEditor";

interface Person { id: string; name: string; avatarEmoji: string }

export default function ProfilesAdmin() {
  const t = useTranslations("admin.profiles");
  const { data, mutate } = useLiveData<AdminProfile[]>("/api/profiles");
  const { data: people } = useLiveData<Person[]>("/api/people");
  const [name, setName] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await apiFetch("/api/profiles", { json: { name, type: "family" } });
    setName("");
    mutate();
  }

  return (
    <>
      <PageTitle>{t("title")}</PageTitle>

      <div className="space-y-4">
        {(data ?? []).map((profile) => (
          <ProfileEditor
            key={profile.id + profile.widgets.length}
            profile={profile}
            people={people ?? []}
            onChanged={mutate}
          />
        ))}
      </div>

      <form onSubmit={add} className="card mt-4 flex items-end gap-3 p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("name")}
          className={inputClass("min-w-48")}
        />
        <Button type="submit" variant="primary">{t("add")}</Button>
      </form>
    </>
  );
}
