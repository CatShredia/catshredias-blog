"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { MarkdownContent } from "@/components/markdown/markdown-content";

type MarkdownEditorProps = {
  name: string;
  initialValue?: string;
  draftKey: string;
  label?: string;
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
}: MarkdownEditorProps) {
  const textareaId = useId();
  const [value, setValue] = useState(() => readDraft(draftKey, initialValue));
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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

  const insertAtCursor = useCallback((snippet: string) => {
    setValue((prev) => `${prev}${prev.endsWith("\n") || prev.length === 0 ? "" : "\n"}${snippet}\n`);
  }, []);

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
      insertAtCursor(`[PDF](${data.url})`);
    } else {
      insertAtCursor(`![${file.name}](${data.url})`);
    }
    setMessage("Файл загружен");
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) void uploadFile(file);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={textareaId} className="text-sm font-medium">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-card">
            {uploading ? "Загрузка…" : "Загрузить файл"}
            <input
              type="file"
              accept="image/*,application/pdf"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadFile(file);
              }}
            />
          </label>
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
          id={textareaId}
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onDrop={onDrop}
          onDragOver={(event) => event.preventDefault()}
          rows={18}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 font-mono text-sm"
          placeholder="Пишите Markdown… Перетащите изображение для вставки."
        />
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-2 text-xs font-medium text-muted">Предпросмотр</p>
          <MarkdownContent content={value || "*Пусто*"} />
        </div>
      </div>

      {message ? <p className="text-xs text-muted">{message}</p> : null}
      <p className="text-xs text-muted">
        Автосохранение в localStorage каждые 500 мс.
      </p>
    </div>
  );
}
