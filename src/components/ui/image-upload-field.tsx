"use client";

import { useState } from "react";

import { ImageCropDialog } from "@/components/ui/image-crop-dialog";
import { SafeImage } from "@/components/ui/safe-image";

type ImageUploadFieldProps = {
  name: string;
  label: string;
  value?: string;
  onChange: (url: string) => void;
  aspect?: "square" | "wide" | "free";
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
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const cropAspect =
    aspect === "square" ? 1 : aspect === "wide" ? 16 / 9 : undefined;

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

  function openCrop(file: File) {
    const url = URL.createObjectURL(file);
    setCropSrc(url);
  }

  function closeCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.type.startsWith("image/")) {
      openCrop(file);
      return;
    }
    void upload(file);
  }

  const previewClass =
    aspect === "square" ? "h-24 w-24" : "h-32 w-full max-w-md";

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <input type="hidden" name={name} value={value} />
      {value ? (
        <div className={`relative overflow-hidden rounded-lg border border-border ${previewClass}`}>
          <SafeImage src={value} alt="" fill />
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
              handleFile(event.target.files?.[0]);
              event.target.value = "";
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
        type="text"
        placeholder="или путь /api/uploads/... / полный URL"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      {cropSrc ? (
        <ImageCropDialog
          imageSrc={cropSrc}
          aspect={cropAspect}
          onCancel={closeCrop}
          onComplete={(file) => {
            closeCrop();
            void upload(file);
          }}
        />
      ) : null}
    </div>
  );
}
