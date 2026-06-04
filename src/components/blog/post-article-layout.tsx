"use client";

import { MarkdownContent } from "@/components/markdown/markdown-content";
import { MarkdownFloatingToc } from "@/components/markdown/markdown-floating-toc";
import type { WikiLinkTarget } from "@/lib/markdown-wikilink";

type PostArticleLayoutProps = {
  content: string;
  children: React.ReactNode;
  /** Плеер / блок перед текстом статьи */
  beforeContent?: React.ReactNode;
  linkTargets?: WikiLinkTarget[];
};

export function PostArticleLayout({
  content,
  children,
  beforeContent,
  linkTargets = [],
}: PostArticleLayoutProps) {
  return (
    <div className="min-w-0">
      {children}
      <MarkdownFloatingToc
        content={content}
        placement="sticky-top"
        stickyTopClass="top-24"
        defaultOpen={false}
        storageKey="blog-post-toc"
      />
      {beforeContent ? <div className="mt-6">{beforeContent}</div> : null}
      <div className="mt-8">
        <MarkdownContent content={content} linkTargets={linkTargets} />
      </div>
    </div>
  );
}
