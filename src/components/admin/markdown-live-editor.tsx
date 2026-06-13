"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { MarkdownCodemirror } from "@/components/admin/markdown-codemirror";
import type { MarkdownCodemirrorHandle } from "@/components/admin/markdown-codemirror";
import { MarkdownContent } from "@/components/markdown/markdown-content";
import {
  appendMarkdownBlock,
  replaceMarkdownBlock,
  splitMarkdownBlocks,
} from "@/lib/markdown-blocks";
import type { WikiLinkTarget } from "@/lib/markdown-wikilink";

export type MarkdownLiveEditorHandle = {
  appendSnippet: (snippet: string) => void;
  focus: () => void;
};

type MarkdownLiveEditorProps = {
  value: string;
  onChange: (value: string) => void;
  linkTargets?: WikiLinkTarget[];
  minHeight?: string;
  onScroll?: () => void;
  scrollContainerRef?: (element: HTMLElement | null) => void;
};

const INTERACTIVE_SELECTOR =
  "a, button, input, textarea, select, summary, .markdown-code-block-copy";

function isInteractivePreviewTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement && Boolean(target.closest(INTERACTIVE_SELECTOR))
  );
}

export const MarkdownLiveEditor = forwardRef<
  MarkdownLiveEditorHandle,
  MarkdownLiveEditorProps
>(function MarkdownLiveEditor(
  {
    value,
    onChange,
    linkTargets = [],
    minHeight = "min(70vh, 720px)",
    onScroll,
    scrollContainerRef,
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const blockEditorRef = useRef<MarkdownCodemirrorHandle>(null);
  const pendingFocusIndexRef = useRef<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const blocks = useMemo(() => splitMarkdownBlocks(value).blocks, [value]);

  useEffect(() => {
    scrollContainerRef?.(rootRef.current);
  }, [scrollContainerRef]);

  useEffect(() => {
    if (pendingFocusIndexRef.current === null) return;
    const index = pendingFocusIndexRef.current;
    pendingFocusIndexRef.current = null;
    setEditingIndex(index);
  }, [blocks.length, value]);

  useEffect(() => {
    if (editingIndex === null) return;
    requestAnimationFrame(() => {
      blockEditorRef.current?.focus();
    });
  }, [editingIndex]);

  const updateBlock = useCallback(
    (index: number, content: string) => {
      onChange(replaceMarkdownBlock(value, index, content));
    },
    [onChange, value],
  );

  const appendSnippet = useCallback(
    (snippet: string) => {
      const nextValue = appendMarkdownBlock(value, snippet);
      onChange(nextValue);
      pendingFocusIndexRef.current = splitMarkdownBlocks(nextValue).blocks.length - 1;
    },
    [onChange, value],
  );

  useImperativeHandle(
    ref,
    () => ({
      appendSnippet,
      focus() {
        rootRef.current?.focus();
      },
    }),
    [appendSnippet],
  );

  const startEditing = useCallback((index: number) => {
    setEditingIndex(index);
  }, []);

  const stopEditing = useCallback(() => {
    setEditingIndex(null);
  }, []);

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      onScroll={onScroll}
      style={{ minHeight }}
      className="markdown-live-editor prose prose-neutral dark:prose-invert min-w-0 max-w-none overflow-y-auto rounded-lg border border-border bg-card p-4 outline-none"
    >
      {blocks.map((block, index) =>
        editingIndex === index ? (
          <div
            key={`edit-${index}`}
            className="markdown-live-block markdown-live-block--editing not-prose"
          >
            <MarkdownCodemirror
              ref={blockEditorRef}
              value={block}
              onChange={(next) => updateBlock(index, next)}
              minHeight="6rem"
              wikiLinkTargets={linkTargets}
              placeholder="Markdown блок…"
              onBlur={stopEditing}
              onEscape={stopEditing}
            />
          </div>
        ) : (
          <div
            key={`preview-${index}`}
            role="button"
            tabIndex={0}
            className="markdown-live-block markdown-live-block--preview"
            onClick={(event) => {
              if (isInteractivePreviewTarget(event.target)) return;
              startEditing(index);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              startEditing(index);
            }}
          >
            {block.trim() ? (
              <MarkdownContent
                content={block}
                linkTargets={linkTargets}
                wrapProse={false}
              />
            ) : (
              <p className="text-sm italic text-muted">
                Пустой блок — нажмите, чтобы редактировать
              </p>
            )}
          </div>
        ),
      )}
    </div>
  );
});
