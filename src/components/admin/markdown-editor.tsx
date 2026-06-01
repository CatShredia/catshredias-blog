"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { MarkdownContent } from "@/components/markdown/markdown-content";
import { ImageCropDialog } from "@/components/ui/image-crop-dialog";
import { SPOILER_MARKDOWN_SNIPPET } from "@/lib/markdown-spoiler";

type MarkdownEditorProps = {
  name: string;
  initialValue?: string;
  draftKey: string;
  label?: string;
  required?: boolean;
};

function readDraft(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) ?? fallback;
}

export function MarkdownEditor({
  name,
  initialValue = "",
  draftKey,
  label = "Содержимое (Markdown)",
  required = false,
}: MarkdownEditorProps) {
  const textareaId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(() => readDraft(draftKey, initialValue));
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      localStorage.setItem(draftKey, value);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, draftKey]);

  useEffect(() => {
    if (cursor == null) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    textarea.setSelectionRange(cursor, cursor);
    setCursor(null);
  }, [value, cursor]);

  const insertSnippet = useCallback((snippet: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setValue(
        (prev) =>
          `${prev}${prev.endsWith("\n") || prev.length === 0 ? "" : "\n"}${snippet}\n`,
      );
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const needsLeadingNewline = before.length > 0 && !before.endsWith("\n");
    const needsTrailingNewline = after.length > 0 && !after.startsWith("\n");
    const insertion = `${needsLeadingNewline ? "\n" : ""}${snippet}${needsTrailingNewline ? "\n" : ""}`;
    const next = `${before}${insertion}${after}`;
    const nextCursor = before.length + insertion.length;

    setValue(next);
    setCursor(nextCursor);
  }, [value]);

  async function uploadFile(file: File) {
    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload", {
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
    if (file.type === "application/pdf") {
      insertSnippet(`[PDF](${data.url})`);
    } else {
      const alt = file.name.replace(/\.[^.]+$/, "") || "image";
      insertSnippet(`![${alt}](${data.url})`);
    }
    setMessage("Файл вставлен в текст");
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  function handleFile(file: File) {
    if (file.type.startsWith("image/")) {
      setPendingName(file.name);
      setCropSrc(URL.createObjectURL(file));
      return;
    }
    void uploadFile(file);
  }

  function onPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (!item.type.startsWith("image/")) continue;
      const file = item.getAsFile();
      if (!file) continue;
      event.preventDefault();
      handleFile(file);
      return;
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={textareaId} className="text-sm font-medium">
          {label}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-card disabled:opacity-50"
            disabled={uploading}
            onClick={() => imageInputRef.current?.click()}
          >
            {uploading ? "Загрузка…" : "Вставить изображение"}
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
              event.target.value = "";
            }}
          />
          <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-card">
            PDF
            <input
              type="file"
              accept="application/pdf"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadFile(file);
                event.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-card"
            onClick={() => insertSnippet(SPOILER_MARKDOWN_SNIPPET)}
          >
            Спойлер
          </button>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-card"
            onClick={() => {
              localStorage.removeItem(draftKey);
              setValue(initialValue);
              setMessage("Черновик очищен");
            }}
          >
            Сбросить черновик
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <textarea
          ref={textareaRef}
          id={textareaId}
          name={name}
          required={required}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onDrop={onDrop}
          onDragOver={(event) => event.preventDefault()}
          onPaste={onPaste}
          rows={18}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 font-mono text-sm"
          placeholder="Пишите Markdown… Перетащите или вставьте (Ctrl+V) изображение."
        />
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-2 text-xs font-medium text-muted">Предпросмотр</p>
          <MarkdownContent content={value || "*Пусто*"} />
        </div>
      </div>

      {message ? <p className="text-xs text-muted">{message}</p> : null}
      {cropSrc ? (
        <ImageCropDialog
          imageSrc={cropSrc}
          onCancel={() => {
            URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
            setPendingName(null);
          }}
          onComplete={(file) => {
            URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
            const named = pendingName
              ? new File([file], pendingName, { type: file.type })
              : file;
            setPendingName(null);
            void uploadFile(named);
          }}
        />
      ) : null}
      <p className="text-xs text-muted">
        Изображения: кнопка, drag-and-drop или Ctrl+V. Спойлер: кнопка «Спойлер» или блок
        :::spoiler Заголовок … :::. Автосохранение каждые 500 мс.
      </p>
    </div>
  );
}
