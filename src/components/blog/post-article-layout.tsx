"use client";

import { useMemo, useState } from "react";

import { MarkdownContent } from "@/components/markdown/markdown-content";
import { extractMarkdownHeadings } from "@/lib/markdown-headings";

type PostArticleLayoutProps = {
  content: string;
  children: React.ReactNode;
};

export function PostArticleLayout({ content, children }: PostArticleLayoutProps) {
  const headings = useMemo(() => extractMarkdownHeadings(content), [content]);
  const [tocOpen, setTocOpen] = useState(true);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  const hasToc = headings.length > 0;

  return (
    <div className="relative">
      {hasToc ? (
        <div className="mb-4 xl:hidden">
          <button
            type="button"
            onClick={() => setMobileTocOpen((prev) => !prev)}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-card"
          >
            {mobileTocOpen ? "Скрыть содержание" : "Содержание"}
          </button>
          {mobileTocOpen ? (
            <nav
              aria-label="Содержание статьи"
              className="mt-3 rounded-xl border border-border bg-card p-4"
            >
              <ul className="space-y-2 text-sm">
                {headings.map((heading) => (
                  <li
                    key={heading.id}
                    className={heading.level === 3 ? "pl-3" : undefined}
                  >
                    <a
                      href={`#${heading.id}`}
                      className="text-muted hover:text-foreground"
                      onClick={() => setMobileTocOpen(false)}
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-start gap-8 xl:gap-10">
        <div className="min-w-0 flex-1">
          {children}
          <div className="mt-8">
            <MarkdownContent content={content} />
          </div>
        </div>

        {hasToc && tocOpen ? (
          <aside className="hidden w-56 shrink-0 xl:block">
            <nav
              aria-label="Содержание статьи"
              className="sticky top-24 rounded-xl border border-border bg-card p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Содержание</p>
                <button
                  type="button"
                  onClick={() => setTocOpen(false)}
                  className="text-xs text-muted hover:text-foreground"
                  aria-label="Скрыть содержание"
                >
                  Скрыть
                </button>
              </div>
              <ul className="max-h-[calc(100vh-8rem)] space-y-2 overflow-y-auto text-sm">
                {headings.map((heading) => (
                  <li
                    key={heading.id}
                    className={heading.level === 3 ? "pl-3" : undefined}
                  >
                    <a
                      href={`#${heading.id}`}
                      className="text-muted hover:text-foreground"
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        ) : null}
      </div>

      {hasToc && !tocOpen ? (
        <button
          type="button"
          onClick={() => setTocOpen(true)}
          className="fixed bottom-6 right-4 z-40 hidden rounded-full border border-border bg-card px-4 py-2 text-sm shadow-lg hover:bg-background xl:block"
        >
          Содержание
        </button>
      ) : null}
    </div>
  );
}
