"use client";

import { PostTrackType } from "@prisma/client";
import { useState } from "react";

import { ImageUploadField } from "@/components/ui/image-upload-field";
import { parseAudioMetadata } from "@/lib/audio-metadata";
import { trackEmbedInputFromStored } from "@/lib/post-track";

const trackTypeOptions: { value: PostTrackType; label: string }[] = [
  { value: PostTrackType.NONE, label: "Без трека" },
  { value: PostTrackType.UPLOAD, label: "Загрузить на сервер" },
  { value: PostTrackType.YANDEX_MUSIC, label: "Яндекс Музыка" },
  { value: PostTrackType.YOUTUBE_MUSIC, label: "YouTube Music" },
];

type PostTrackFieldProps = {
  initialType?: PostTrackType;
  initialAudioUrl?: string | null;
  initialTitle?: string | null;
  initialArtist?: string | null;
  initialCoverImage?: string | null;
  initialEmbedSrc?: string | null;
};

async function uploadAdminFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error ?? "Ошибка загрузки");
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}

export function PostTrackField({
  initialType = PostTrackType.NONE,
  initialAudioUrl = "",
  initialTitle = "",
  initialArtist = "",
  initialCoverImage = "",
  initialEmbedSrc = null,
}: PostTrackFieldProps) {
  const [trackType, setTrackType] = useState(initialType);
  const [audioUrl, setAudioUrl] = useState(initialAudioUrl ?? "");
  const [trackTitle, setTrackTitle] = useState(initialTitle ?? "");
  const [trackArtist, setTrackArtist] = useState(initialArtist ?? "");
  const [coverImage, setCoverImage] = useState(initialCoverImage ?? "");
  const [embedInput, setEmbedInput] = useState(
    trackEmbedInputFromStored(initialType, initialEmbedSrc),
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function clearUploadMeta() {
    setAudioUrl("");
    setTrackTitle("");
    setTrackArtist("");
    setCoverImage("");
  }

  function selectType(next: PostTrackType) {
    setTrackType(next);
    setError(null);
    if (next === PostTrackType.NONE) {
      clearUploadMeta();
      setEmbedInput("");
    } else if (next !== PostTrackType.UPLOAD) {
      clearUploadMeta();
    } else {
      setEmbedInput("");
    }
  }

  function applyMetadata(meta: {
    title?: string;
    artist?: string;
  }) {
    if (meta.title) setTrackTitle(meta.title);
    if (meta.artist) setTrackArtist(meta.artist);
  }

  async function uploadAudio(file: File) {
    setUploading(true);
    setError(null);

    try {
      const meta = await parseAudioMetadata(file);
      applyMetadata(meta);

      const url = await uploadAdminFile(file);
      setAudioUrl(url);
      setTrackType(PostTrackType.UPLOAD);

      if (meta.coverFile) {
        try {
          const coverUrl = await uploadAdminFile(meta.coverFile);
          setCoverImage(coverUrl);
        } catch {
          /* обложка из тегов опциональна */
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  const showEmbedField =
    trackType === PostTrackType.YANDEX_MUSIC ||
    trackType === PostTrackType.YOUTUBE_MUSIC;

  return (
    <fieldset className="space-y-3 rounded-xl border border-border p-4">
      <legend className="px-1 text-sm font-medium">Трек к посту</legend>

      <input type="hidden" name="trackType" value={trackType} />
      <input type="hidden" name="trackAudioUrl" value={audioUrl} />
      {trackType !== PostTrackType.UPLOAD ? (
        <>
          <input type="hidden" name="trackTitle" value="" />
          <input type="hidden" name="trackArtist" value="" />
          <input type="hidden" name="trackCoverImage" value="" />
        </>
      ) : null}
      {!showEmbedField ? (
        <input type="hidden" name="trackEmbedInput" value="" />
      ) : null}

      <div className="flex flex-wrap gap-2">
        {trackTypeOptions.map((option) => (
          <label
            key={option.value}
            className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs ${
              trackType === option.value
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border hover:bg-card"
            }`}
          >
            <input
              type="radio"
              name="trackTypeChoice"
              className="sr-only"
              checked={trackType === option.value}
              onChange={() => selectType(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>

      {trackType === PostTrackType.UPLOAD ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-card">
              {uploading ? "Загрузка…" : "Выбрать аудио *"}
              <input
                type="file"
                accept="audio/mpeg,audio/mp3,audio/ogg,audio/wav,audio/webm,audio/mp4,audio/x-m4a,.mp3,.ogg,.wav,.webm,.m4a"
                className="sr-only"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadAudio(file);
                  event.target.value = "";
                }}
              />
            </label>
            {audioUrl ? (
              <button
                type="button"
                className="text-xs text-muted underline"
                onClick={() => setAudioUrl("")}
              >
                Удалить аудио
              </button>
            ) : null}
          </div>

          {audioUrl ? (
            <audio controls preload="metadata" src={audioUrl} className="w-full" />
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium">Название трека *</label>
              <input
                name="trackTitle"
                required
                value={trackTitle}
                onChange={(event) => setTrackTitle(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Исполнитель *</label>
              <input
                name="trackArtist"
                required
                value={trackArtist}
                onChange={(event) => setTrackArtist(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
              />
            </div>
          </div>

          <ImageUploadField
            name="trackCoverImage"
            label="Обложка альбома"
            value={coverImage}
            onChange={setCoverImage}
            aspect="square"
            urlPlaceholder="https://… или /api/uploads/…"
          />

          <p className="text-xs text-muted">
            После выбора аудио название и исполнитель подставляются из метаданных
            файла (можно изменить). Обложку можно загрузить, взять из тегов MP3 или
            указать публичную ссылку https://.
          </p>
        </div>
      ) : null}

      {trackType === PostTrackType.YANDEX_MUSIC ? (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted">
            Код вставки или ссылка iframe
          </label>
          <textarea
            name="trackEmbedInput"
            rows={5}
            value={embedInput}
            onChange={(event) => setEmbedInput(event.target.value)}
            placeholder='<iframe src="https://music.yandex.ru/iframe/album/…/track/…" …></iframe>'
            className="admin-markdown-textarea w-full rounded-lg border border-border bg-card px-3 py-2 text-xs"
          />
          <p className="text-xs text-muted">
            В Яндекс Музыке: «Поделиться» → «Код для вставки» — вставьте iframe
            целиком или только URL из атрибута src.
          </p>
        </div>
      ) : null}

      {trackType === PostTrackType.YOUTUBE_MUSIC ? (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted">
            Ссылка на трек или embed
          </label>
          <textarea
            name="trackEmbedInput"
            rows={3}
            value={embedInput}
            onChange={(event) => setEmbedInput(event.target.value)}
            placeholder="https://music.youtube.com/watch?v=… или https://www.youtube.com/embed/…"
            className="admin-markdown-textarea w-full rounded-lg border border-border bg-card px-3 py-2 text-xs"
          />
          <p className="text-xs text-muted">
            Подойдут ссылки watch, youtu.be или готовый /embed/… с YouTube / YouTube
            Music.
          </p>
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </fieldset>
  );
}
