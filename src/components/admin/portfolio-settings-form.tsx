"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { savePortfolioSettingsAction } from "@/app/(admin)/admin/portfolio-settings/actions";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/ui/file-upload-field";

export function PortfolioSettingsForm({
  hhUrl,
  resumePdf,
  lookingForWork,
}: {
  hhUrl: string;
  resumePdf: string;
  lookingForWork: boolean;
}) {
  const router = useRouter();
  const [hh, setHh] = useState(hhUrl);
  const [pdf, setPdf] = useState(resumePdf);
  const [seeking, setSeeking] = useState(lookingForWork);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const formData = new FormData();
    formData.set("hhUrl", hh);
    formData.set("resumePdf", pdf);
    formData.set("lookingForWork", seeking ? "true" : "false");

    const result = await savePortfolioSettingsAction(formData);
    setSaving(false);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Сохранено");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-6">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Ищу работу</legend>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name="lookingForWorkUi"
            checked={seeking}
            onChange={() => setSeeking(true)}
          />
          Да
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name="lookingForWorkUi"
            checked={!seeking}
            onChange={() => setSeeking(false)}
          />
          Нет
        </label>
      </fieldset>

      <div>
        <label htmlFor="hhUrl" className="mb-1 block text-sm font-medium">
          Ссылка на hh.ru
        </label>
        <input
          id="hhUrl"
          type="url"
          value={hh}
          onChange={(event) => setHh(event.target.value)}
          placeholder="https://hh.ru/resume/..."
          className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
        />
      </div>

      <FileUploadField
        name="resumePdf"
        label="Резюме (PDF)"
        value={pdf}
        onChange={setPdf}
        accept="application/pdf"
        uploadLabel="Загрузить PDF"
        urlPlaceholder="/api/uploads/... или https://..."
      />

      <Button type="submit" disabled={saving}>
        {saving ? "Сохранение…" : "Сохранить"}
      </Button>

      {message ? (
        <p className={`text-sm ${message === "Сохранено" ? "text-muted" : "text-red-600"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
