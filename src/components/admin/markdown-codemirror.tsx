"use client";

import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { autocompletion, type CompletionContext } from "@codemirror/autocomplete";
import {
  defaultHighlightStyle,
  foldGutter,
  foldService,
  syntaxHighlighting,
} from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type RefObject,
} from "react";

import { useTheme } from "@/components/theme-provider";
import type { WikiLinkTarget } from "@/lib/markdown-wikilink";

export type MarkdownCodemirrorHandle = {
  insertAtSelection: (snippet: string, replaceSelection?: boolean) => void;
  getSelection: () => { from: number; to: number; text: string };
  focus: () => void;
};

type MarkdownCodemirrorProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  wikiLinkTargets?: WikiLinkTarget[];
  onScroll?: (event: Event) => void;
  scrollContainerRef?: (element: HTMLElement | null) => void;
  onDrop?: (event: DragEvent) => boolean | void;
  onDragOver?: (event: DragEvent) => boolean | void;
  onPaste?: (event: ClipboardEvent) => boolean | void;
};

function wikiLinkCompletionSource(targetsRef: RefObject<WikiLinkTarget[]>) {
  return (context: CompletionContext) => {
    const match = context.matchBefore(/\[\[[^\]|]*/);
    if (!match || match.from === match.to) return null;

    const query = match.text.slice(2).toLowerCase();
    const targets = targetsRef.current ?? [];
    const options = targets
      .filter(
        (target) =>
          !query ||
          target.title.toLowerCase().includes(query) ||
          target.slug.toLowerCase().includes(query),
      )
      .slice(0, 20)
      .map((target) => ({
        label: target.title,
        detail: target.slug,
        apply: `[[${target.title}]]`,
        type: "text" as const,
      }));

    if (options.length === 0) return null;

    return {
      from: match.from + 2,
      options,
      validFor: /^\[\[[^\]|]*$/,
    };
  };
}

const markdownHeadingFold = foldService.of((state, lineStart) => {
  const line = state.doc.lineAt(lineStart);
  const text = line.text;
  const headingMatch = /^(#{1,6})\s/.exec(text);
  if (!headingMatch) return null;

  let end = line.to;
  const level = headingMatch[1].length;
  let lineNumber = line.number + 1;

  while (lineNumber <= state.doc.lines) {
    const nextLine = state.doc.line(lineNumber);
    const nextMatch = /^(#{1,6})\s/.exec(nextLine.text);
    if (nextMatch && nextMatch[1].length <= level) break;
    end = nextLine.to;
    lineNumber += 1;
  }

  return end > line.to ? { from: line.to, to: end } : null;
});

const adminEditorTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: "var(--fg)",
    fontSize: "0.875rem",
    lineHeight: "1.625",
  },
  ".cm-content": {
    fontFamily:
      'var(--font-geist-mono), ui-monospace, "Cascadia Mono", Consolas, monospace',
    fontVariantLigatures: "none",
    fontFeatureSettings: '"liga" 0, "calt" 0',
    caretColor: "var(--fg)",
    padding: "0.5rem 0.75rem",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "var(--muted)",
    border: "none",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "color-mix(in srgb, var(--border) 40%, transparent)",
  },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in srgb, var(--border) 25%, transparent)",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--fg)",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor: "color-mix(in srgb, var(--accent) 25%, transparent) !important",
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "var(--border)",
    border: "none",
    color: "var(--muted)",
  },
});

export const MarkdownCodemirror = forwardRef<
  MarkdownCodemirrorHandle,
  MarkdownCodemirrorProps
>(function MarkdownCodemirror(
  {
    id,
    value,
    onChange,
    placeholder,
    minHeight = "320px",
    className,
    wikiLinkTargets = [],
    onScroll,
    scrollContainerRef,
    onDrop,
    onDragOver,
    onPaste,
  },
  ref,
) {
  const viewRef = useRef<EditorView | null>(null);
  const wikiLinkTargetsRef = useRef(wikiLinkTargets);
  const onDropRef = useRef(onDrop);
  const onDragOverRef = useRef(onDragOver);
  const onPasteRef = useRef(onPaste);
  const onScrollRef = useRef(onScroll);
  const scrollContainerRefCallback = useRef(scrollContainerRef);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    wikiLinkTargetsRef.current = wikiLinkTargets;
  }, [wikiLinkTargets]);

  useEffect(() => {
    onDropRef.current = onDrop;
    onDragOverRef.current = onDragOver;
    onPasteRef.current = onPaste;
    onScrollRef.current = onScroll;
    scrollContainerRefCallback.current = scrollContainerRef;
  }, [onDrop, onDragOver, onPaste, onScroll, scrollContainerRef]);

  const extensions = useMemo(() => {
    const eventHandlers = EditorView.domEventHandlers({
      drop(event) {
        return onDropRef.current?.(event) ?? false;
      },
      dragover(event) {
        return onDragOverRef.current?.(event) ?? false;
      },
      paste(event) {
        return onPasteRef.current?.(event) ?? false;
      },
      scroll(event, view) {
        onScrollRef.current?.(event);
        scrollContainerRefCallback.current?.(view.scrollDOM);
        return false;
      },
    });

    return [
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      foldGutter(),
      markdownHeadingFold,
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      EditorView.lineWrapping,
      adminEditorTheme,
      eventHandlers,
      autocompletion({
        override: [wikiLinkCompletionSource(wikiLinkTargetsRef)],
      }),
    ];
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      insertAtSelection(snippet, replaceSelection = false) {
        const view = viewRef.current;
        if (!view) return;

        const { from, to } = view.state.selection.main;
        const before = view.state.doc.sliceString(0, from);
        const after = view.state.doc.sliceString(to);
        const needsLeadingNewline = before.length > 0 && !before.endsWith("\n");
        const needsTrailingNewline = after.length > 0 && !after.startsWith("\n");
        const insertion = replaceSelection
          ? snippet
          : `${needsLeadingNewline ? "\n" : ""}${snippet}${needsTrailingNewline ? "\n" : ""}`;
        const nextCursor = replaceSelection
          ? from + snippet.length
          : from + insertion.length;

        view.dispatch({
          changes: { from, to, insert: insertion },
          selection: EditorSelection.cursor(nextCursor),
        });
        view.focus();
      },
      getSelection() {
        const view = viewRef.current;
        if (!view) return { from: 0, to: 0, text: "" };
        const { from, to } = view.state.selection.main;
        return {
          from,
          to,
          text: view.state.doc.sliceString(from, to),
        };
      },
      focus() {
        viewRef.current?.focus();
      },
    }),
    [],
  );

  return (
    <CodeMirror
      id={id}
      value={value}
      height={minHeight}
      className={`admin-markdown-codemirror ${className ?? ""}`.trim()}
      theme={resolvedTheme}
      extensions={extensions}
      onChange={onChange}
      placeholder={placeholder}
      basicSetup={{
        foldGutter: false,
        lineNumbers: false,
        highlightActiveLine: true,
        highlightSelectionMatches: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: false,
      }}
      onCreateEditor={(view) => {
        viewRef.current = view;
        scrollContainerRefCallback.current?.(view.scrollDOM);
      }}
    />
  );
});
