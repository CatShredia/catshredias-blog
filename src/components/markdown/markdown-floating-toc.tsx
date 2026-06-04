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
  /**
   * overlay — плавающая панель в углу родителя (редактор);
   * fixed — поверх viewport в углу (устаревший вариант для блога);
   * sticky-top — в потоке страницы, прилипает под шапкой при прокрутке
   */
  placement?: "overlay" | "fixed" | "sticky-top";
  /** Отступ sticky-top (top-24 — под шапкой сайта, top-0 — внутри скролла превью) */
  stickyTopClass?: string;
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
  defaultOpen = false,
  placement = "overlay",
  stickyTopClass = "top-24",
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

  const isStickyTop = placement === "sticky-top";

  const stickyTopPositionClass = `sticky ${stickyTopClass} z-40 mb-4 w-full`;

  const panelPositionClass = isStickyTop
    ? stickyTopPositionClass
    : placement === "fixed"
      ? "fixed top-24 right-4 z-40"
      : "absolute top-2 right-2";

  const togglePositionClass = isStickyTop
    ? stickyTopPositionClass
    : placement === "fixed"
      ? "fixed bottom-6 right-4 z-40"
      : "absolute bottom-2 right-2";

  const panelSizeClass = isStickyTop
    ? "max-w-none"
    : "w-52 max-w-[min(90vw,420px)]";

  const listMaxHeightClass = isStickyTop
    ? "max-h-[min(40vh,280px)]"
    : "";

  if (isStickyTop) {
    return (
      <div className={open ? panelPositionClass : togglePositionClass}>
        {open ? (
          <nav
            aria-label="Содержание"
            className={`markdown-floating-toc-panel markdown-floating-toc-panel--sticky flex flex-col rounded-xl border border-border bg-card/95 p-3 shadow-sm backdrop-blur-sm ${panelSizeClass}`}
          >
            <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
              <p className="text-xs font-semibold">Содержание</p>
              <button
                type="button"
                onClick={() => persistOpen(false)}
                className="text-xs text-muted hover:text-foreground"
                aria-label="Свернуть содержание"
              >
                Свернуть
              </button>
            </div>
            <div
              className={`markdown-floating-toc-list min-h-0 overflow-y-auto pr-1 ${listMaxHeightClass}`}
            >
              <HeadingList headings={headings} onSelect={scrollToHeading} />
            </div>
          </nav>
        ) : (
          <button
            type="button"
            onClick={() => persistOpen(true)}
            className="w-full rounded-xl border border-border bg-card/95 px-3 py-2 text-left text-xs shadow-sm backdrop-blur-sm hover:bg-background"
          >
            Содержание ({headings.length})
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {open ? (
        <nav
          aria-label="Содержание"
          className={`markdown-floating-toc-panel pointer-events-auto flex flex-col rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm ${panelPositionClass} ${panelSizeClass}`}
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
          <div
            className={`markdown-floating-toc-list min-h-0 overflow-y-auto pr-1 ${listMaxHeightClass}`}
          >
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
