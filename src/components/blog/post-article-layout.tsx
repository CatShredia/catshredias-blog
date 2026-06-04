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
    <>
      <MarkdownFloatingToc
        content={content}
        placement="fixed"
        storageKey="blog-post-toc"
      />
      <div className="min-w-0">
        {children}
        {beforeContent ? <div className="mt-6">{beforeContent}</div> : null}
        <div className="mt-8">
          <MarkdownContent content={content} linkTargets={linkTargets} />
        </div>
      </div>
    </>
  );
}
