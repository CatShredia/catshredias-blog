"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
} from "react-resizable-panels";

import {
  MarkdownCodemirror,
  type MarkdownCodemirrorHandle,
} from "@/components/admin/markdown-codemirror";
import { MarkdownContent } from "@/components/markdown/markdown-content";
import { MarkdownFloatingToc } from "@/components/markdown/markdown-floating-toc";
import { ImageCropDialog } from "@/components/ui/image-crop-dialog";
import {
  clearEditorDraft,
  readEditorDraft,
  writeEditorDraft,
} from "@/lib/editor-draft";
import { CALLOUT_MARKDOWN_SNIPPET } from "@/lib/markdown-callout";
import { TABLE_MARKDOWN_SNIPPET } from "@/lib/markdown-table";
import {
  buildSpoilerMarkdown,
  SPOILER_MARKDOWN_SNIPPET,
} from "@/lib/markdown-spoiler";
import type { WikiLinkTarget } from "@/lib/markdown-wikilink";

type EditorMode = "source" | "split" | "preview";

type MarkdownEditorProps = {
  name: string;
  initialValue?: string;
  draftKey: string;
  label?: string;
  required?: boolean;
  /** @deprecated черновик больше не сбрасывается автоматически */
  resetDraftOnMount?: boolean;
  /** После успешного сохранения — подтянуть контент с сервера, не из черновика */
  syncFromServerOnMount?: boolean;
  /** Расширенный макет для страницы поста в админке */
  layout?: "default" | "wide";
  /** Цели для wikilink в preview (если не задано — загрузка из API админки) */
  linkTargets?: WikiLinkTarget[];
};

function loadDraftValue(
  draftKey: string,
  initialValue: string,
  options: { syncFromServerOnMount?: boolean },
) {
  if (typeof window === "undefined") return initialValue;

  if (options.syncFromServerOnMount) {
    clearEditorDraft(draftKey);
    return initialValue;
  }

  return readEditorDraft(draftKey, initialValue);
}

function modeButtonClass(active: boolean) {
  return `rounded-lg border px-2.5 py-1 text-xs ${
    active
      ? "border-accent bg-accent/10 text-foreground"
      : "border-border hover:bg-card"
  }`;
}

export function MarkdownEditor({
  name,
  initialValue = "",
  draftKey,
  label = "Содержимое (Markdown)",
  required = false,
  syncFromServerOnMount = false,
  layout = "default",
  linkTargets: linkTargetsProp,
}: MarkdownEditorProps) {
  const editorId = useId();
  const editorRef = useRef<MarkdownCodemirrorHandle>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const editorScrollRef = useRef<HTMLElement | null>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const syncingScrollRef = useRef(false);
  const [value, setValue] = useState(() =>
    loadDraftValue(draftKey, initialValue, { syncFromServerOnMount }),
  );
  const [mode, setMode] = useState<EditorMode>("split");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);
  const [fetchedLinkTargets, setFetchedLinkTargets] = useState<WikiLinkTarget[]>(
    [],
  );
  const [splitDirection, setSplitDirection] = useState<"horizontal" | "vertical">(
    "horizontal",
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevDraftKeyRef = useRef(draftKey);
  const linkTargets = linkTargetsProp ?? fetchedLinkTargets;

  const editorMinHeight =
    layout === "wide" ? "min(70vh, 720px)" : "420px";

  useEffect(() => {
    if (linkTargetsProp) return;

    let cancelled = false;
    void fetch("/api/admin/link-targets")
      .then((response) => (response.ok ? response.json() : []))
      .then((data: WikiLinkTarget[]) => {
        if (!cancelled && Array.isArray(data)) setFetchedLinkTargets(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [linkTargetsProp]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => {
      setSplitDirection(media.matches ? "vertical" : "horizontal");
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (prevDraftKeyRef.current === draftKey) return;
    prevDraftKeyRef.current = draftKey;
    setValue(readEditorDraft(draftKey, initialValue));
  }, [draftKey, initialValue]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      writeEditorDraft(draftKey, value);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, draftKey]);

  const insertSnippet = useCallback((snippet: string) => {
    editorRef.current?.insertAtSelection(snippet, false);
  }, []);

  const insertSpoiler = useCallback(() => {
    const handle = editorRef.current;
    if (!handle) {
      insertSnippet(SPOILER_MARKDOWN_SNIPPET);
      return;
    }

    const { text } = handle.getSelection();
    if (!text.trim()) {
      handle.insertAtSelection(SPOILER_MARKDOWN_SNIPPET, false);
      return;
    }

    handle.insertAtSelection(buildSpoilerMarkdown(text), true);
  }, [insertSnippet]);

  const insertCallout = useCallback(() => {
    editorRef.current?.insertAtSelection(CALLOUT_MARKDOWN_SNIPPET, false);
  }, []);

  const insertTable = useCallback(() => {
    editorRef.current?.insertAtSelection(TABLE_MARKDOWN_SNIPPET, false);
  }, []);

  const syncPreviewScroll = useCallback((source: "editor" | "preview") => {
    if (mode !== "split") return;

    const editorEl = editorScrollRef.current;
    const previewEl = previewScrollRef.current;
    if (!editorEl || !previewEl || syncingScrollRef.current) return;

    syncingScrollRef.current = true;
    const sourceEl = source === "editor" ? editorEl : previewEl;
    const targetEl = source === "editor" ? previewEl : editorEl;
    const maxSource = sourceEl.scrollHeight - sourceEl.clientHeight;
    const ratio = maxSource > 0 ? sourceEl.scrollTop / maxSource : 0;
    const maxTarget = targetEl.scrollHeight - targetEl.clientHeight;
    const nextScrollTop = ratio * maxTarget;

    if (Math.abs(targetEl.scrollTop - nextScrollTop) > 1) {
      targetEl.scrollTop = nextScrollTop;
    }

    requestAnimationFrame(() => {
      syncingScrollRef.current = false;
    });
  }, [mode]);

  const uploadFile = useCallback(async (file: File) => {
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
      editorRef.current?.insertAtSelection(`[PDF](${data.url})`, false);
    } else {
      const alt = file.name.replace(/\.[^.]+$/, "") || "image";
      editorRef.current?.insertAtSelection(`![${alt}](${data.url})`, false);
    }
    setMessage("Файл вставлен в текст");
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type.startsWith("image/")) {
        setPendingName(file.name);
        setCropSrc(URL.createObjectURL(file));
        return;
      }
      void uploadFile(file);
    },
    [uploadFile],
  );

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const file = event.dataTransfer?.files[0];
      if (file) handleFile(file);
      return true;
    },
    [handleFile],
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    return true;
  }, []);

  const onPaste = useCallback(
    (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return false;

      for (const item of items) {
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (!file) continue;
        event.preventDefault();
        handleFile(file);
        return true;
      }
      return false;
    },
    [handleFile],
  );

  const handleEditorScrollContainer = useCallback(
    (element: HTMLElement | null) => {
      editorScrollRef.current = element;
    },
    [],
  );

  const handleEditorScroll = useCallback(() => {
    syncPreviewScroll("editor");
  }, [syncPreviewScroll]);

  const handlePreviewScroll = useCallback(() => {
    syncPreviewScroll("preview");
  }, [syncPreviewScroll]);

  const showEditor = mode === "source" || mode === "split";
  const showPreview = mode === "preview" || mode === "split";

  const splitGroupHeightClass =
    splitDirection === "vertical"
      ? "min-h-[min(80vh,720px)]"
      : layout === "wide"
        ? "h-[min(70vh,720px)]"
        : "h-[min(60vh,520px)] min-h-[420px]";

  const splitLayoutId = `markdown-editor-split-${layout}-${splitDirection}`;
  const { defaultLayout, onLayoutChanged: persistSplitLayout } = useDefaultLayout({
    id: splitLayoutId,
    panelIds: ["editor", "preview"],
  });

  const handleSplitLayoutChanged = useCallback(
    (layout: Record<string, number>) => {
      persistSplitLayout(layout);
      editorRef.current?.refreshLayout();
    },
    [persistSplitLayout],
  );

  const handleSplitLayout = useCallback(() => {
    editorRef.current?.refreshLayout();
  }, []);

  const editorPane = (
    <MarkdownCodemirror
      ref={editorRef}
      id={editorId}
      value={value}
      onChange={setValue}
      minHeight={editorMinHeight}
      fillHeight={mode === "split"}
      wikiLinkTargets={linkTargets}
      placeholder="Пишите Markdown… Перетащите или вставьте (Ctrl+V) изображение. Wikilinks: [[Заголовок поста]]"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onPaste={onPaste}
      scrollContainerRef={handleEditorScrollContainer}
      onScroll={handleEditorScroll}
    />
  );

  const previewBody = (
    <>
      <p className="mb-2 shrink-0 text-xs font-medium text-muted">Предпросмотр</p>
      <div className="markdown-editor-preview prose prose-neutral dark:prose-invert min-w-0 max-w-none">
        <MarkdownContent content={value || "*Пусто*"} linkTargets={linkTargets} />
      </div>
    </>
  );

  const previewShell = (scrollClassName: string) => (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
        <MarkdownFloatingToc
          content={value}
          scrollContainerRef={previewScrollRef}
          storageKey={`admin-markdown-toc-${layout}`}
        />
      <div
        ref={previewScrollRef}
        onScroll={handlePreviewScroll}
        className={scrollClassName}
      >
        {previewBody}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={value} required={required} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={editorId} className="text-sm font-medium">
          {label}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
            <button
              type="button"
              className={modeButtonClass(mode === "source")}
              onClick={() => setMode("source")}
            >
              Source
            </button>
            <button
              type="button"
              className={modeButtonClass(mode === "split")}
              onClick={() => setMode("split")}
            >
              Split
            </button>
            <button
              type="button"
              className={modeButtonClass(mode === "preview")}
              onClick={() => setMode("preview")}
            >
              Preview
            </button>
          </div>
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
            onClick={insertTable}
          >
            Таблица
          </button>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-card"
            onClick={insertCallout}
          >
            Callout
          </button>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-card"
            onClick={insertSpoiler}
          >
            Спойлер
          </button>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-card"
            onClick={() => {
              clearEditorDraft(draftKey);
              setValue(initialValue);
              setMessage("Черновик очищен");
            }}
          >
            Сбросить черновик
          </button>
        </div>
      </div>

      {mode === "split" ? (
        <Group
          orientation={splitDirection}
          id={splitLayoutId}
          defaultLayout={defaultLayout}
          onLayoutChange={handleSplitLayout}
          onLayoutChanged={handleSplitLayoutChanged}
          className={`markdown-editor-split-group min-w-0 ${splitGroupHeightClass}`}
        >
          <Panel
            id="editor"
            minSize={25}
            defaultSize={layout === "wide" ? 55 : 50}
            className="min-w-0"
          >
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
              {editorPane}
            </div>
          </Panel>
          <Separator
            className="markdown-editor-split-handle"
            title="Перетащите, чтобы изменить ширину колонок"
          />
          <Panel id="preview" minSize={25} className="min-w-0">
            {previewShell("flex min-h-0 flex-1 flex-col overflow-y-auto p-4")}
          </Panel>
        </Group>
      ) : (
        <div className="grid min-w-0 gap-4">
          {showEditor ? (
            <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-card">
              {editorPane}
            </div>
          ) : null}

          {showPreview ? (
            previewShell(
              mode === "preview"
                ? "min-h-[min(70vh,720px)] flex-1 overflow-y-auto p-4"
                : "max-h-[480px] overflow-y-auto p-4",
            )
          ) : null}
        </div>
      )}

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
        CodeMirror: подсветка, сворачивание заголовков и блоков кода. В режиме Split
        перетащите границу между колонками. Wikilinks{" "}
        <code className="text-[0.7rem]">[[пост|alias]]</code>, callouts{" "}
        <code className="text-[0.7rem]">{`> [!note]`}</code>, теги{" "}
        <code className="text-[0.7rem]">#tag</code>, спойлеры{" "}
        <code className="text-[0.7rem]">:::spoiler</code>. Автосохранение каждые
        500 мс.
      </p>
    </div>
  );
}
