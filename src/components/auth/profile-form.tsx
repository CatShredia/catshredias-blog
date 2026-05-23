"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ProfileForm({
  name: initialName,
  image: initialImage,
}: {
  name: string;
  image: string;
}) {
  const router = useRouter();
  const { update } = useSession();
  const [name, setName] = useState(initialName);
  const [image, setImage] = useState(initialImage);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function uploadAvatar(file: File) {
    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/user/avatar", {
      method: "POST",
      body: formData,
    });
    setUploading(false);

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setMessage(data.error ?? "Ошибка загрузки");
      return;
    }

    const data = (await response.json()) as { url: string };
    setImage(data.url);
    await update({ image: data.url });
    setMessage("Аватар обновлён");
    router.refresh();
  }

  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const response = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      setMessage("Не удалось сохранить имя");
      return;
    }
    await update({ name });
    setMessage("Профиль сохранён");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-border bg-card">
          {image ? (
            <Image src={image} alt="" fill className="object-cover" unoptimized />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-medium">
              {name.charAt(0).toUpperCase() || "?"}
            </span>
          )}
        </div>
        <label className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm hover:bg-card">
          {uploading ? "Загрузка…" : "Сменить аватар"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadAvatar(file);
            }}
          />
        </label>
      </div>

      <form onSubmit={saveName} className="space-y-3">
        <label className="block text-sm font-medium">Отображаемое имя</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
          required
          minLength={2}
        />
        <Button type="submit">Сохранить имя</Button>
      </form>

      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
