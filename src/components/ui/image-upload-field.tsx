"use client";

import Image from "next/image";
import { useState } from "react";

type ImageUploadFieldProps = {
  name: string;
  label: string;
  value?: string;
  onChange: (url: string) => void;
  aspect?: "square" | "wide";
};

export function ImageUploadField({
  name,
  label,
  value = "",
  onChange,
  aspect = "wide",
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    setUploading(false);

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Ошибка загрузки");
      return;
    }

    const data = (await response.json()) as { url: string };
    onChange(data.url);
  }

  const previewClass =
    aspect === "square" ? "h-24 w-24" : "h-32 w-full max-w-md";

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <input type="hidden" name={name} value={value} />
      {value ? (
        <div className={`relative overflow-hidden rounded-lg border border-border ${previewClass}`}>
          <Image
            src={value}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-card">
          {uploading ? "Загрузка…" : "Выбрать файл"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
        </label>
        {value ? (
          <button
            type="button"
            className="text-xs text-muted underline"
            onClick={() => onChange("")}
          >
            Удалить
          </button>
        ) : null}
      </div>
      <input
        type="url"
        placeholder="или вставьте URL изображения"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
