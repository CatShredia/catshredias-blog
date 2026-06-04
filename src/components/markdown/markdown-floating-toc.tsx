"use client";

import { useCallback, useMemo, useState, type RefObject } from "react";

import {
  extractMarkdownHeadings,
  headingIndentClass,
  type MarkdownHeading,
} from "@/lib/markdown-headings";

type MarkdownFloatingTocProps = {
  content: string;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  defaultOpen?: boolean;
  /** absolute — внутри родителя (редактор); fixed — поверх страницы (блог) */
  placement?: "overlay" | "fixed";
  /** Ключ для сохранения состояния открыто/скрыто в localStorage */
  storageKey?: string;
};

function readStoredOpen(storageKey: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(`${storageKey}:open`);
  if (raw === "0") return false;
  if (raw === "1") return true;
  return fallback;
}

function HeadingList({
  headings,
  onSelect,
}: {
  headings: MarkdownHeading[];
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="space-y-1.5 text-sm">
      {headings.map((heading, index) => (
        <li
          key={`${heading.id}-${index}`}
          className={headingIndentClass(heading.level)}
        >
          <button
            type="button"
            onClick={() => onSelect(heading.id)}
            className="w-full text-left text-muted hover:text-foreground"
          >
            {heading.text}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function MarkdownFloatingToc({
  content,
  scrollContainerRef,
  defaultOpen = true,
  placement = "overlay",
  storageKey = "markdown-floating-toc",
}: MarkdownFloatingTocProps) {
  const headings = useMemo(() => extractMarkdownHeadings(content), [content]);
  const [open, setOpen] = useState(() =>
    readStoredOpen(storageKey, defaultOpen),
  );

  const persistOpen = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (typeof window !== "undefined") {
        localStorage.setItem(`${storageKey}:open`, next ? "1" : "0");
      }
    },
    [storageKey],
  );

  if (headings.length === 0) return null;

  const scrollToHeading = (id: string) => {
    const root = scrollContainerRef?.current ?? document;
    const target = root.querySelector(`#${CSS.escape(id)}`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const panelPositionClass =
    placement === "fixed"
      ? "fixed top-24 right-4 z-40"
      : "absolute top-2 right-2";

  const togglePositionClass =
    placement === "fixed"
      ? "fixed bottom-6 right-4 z-40"
      : "absolute bottom-2 right-2";

  return (
    <>
      {open ? (
        <nav
          aria-label="Содержание"
          className={`markdown-floating-toc-panel pointer-events-auto flex w-52 max-w-[min(90vw,420px)] flex-col rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm ${panelPositionClass}`}
        >
          <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
            <p className="text-xs font-semibold">Содержание</p>
            <button
              type="button"
              onClick={() => persistOpen(false)}
              className="text-xs text-muted hover:text-foreground"
              aria-label="Скрыть содержание"
            >
              Скрыть
            </button>
          </div>
          <div className="markdown-floating-toc-list min-h-0 overflow-y-auto pr-1">
            <HeadingList headings={headings} onSelect={scrollToHeading} />
          </div>
        </nav>
      ) : (
        <button
          type="button"
          onClick={() => persistOpen(true)}
          className={`pointer-events-auto rounded-full border border-border bg-card/95 px-3 py-1.5 text-xs shadow-md backdrop-blur-sm hover:bg-background ${togglePositionClass}`}
        >
          Содержание
        </button>
      )}
    </>
  );
}
