"use client";

import type { ImgHTMLAttributes, ReactNode } from "react";
import rehypeSlug from "rehype-slug";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { remarkAlert } from "remark-github-blockquote-alert";
import remarkGfm from "remark-gfm";
import { useMemo } from "react";
import type { Pluggable } from "unified";

import { MarkdownCallout } from "@/components/markdown/markdown-callout";
import { MarkdownCodeBlock } from "@/components/markdown/markdown-code-block";
import { MarkdownImage } from "@/components/markdown/markdown-image";
import { remarkTags } from "@/lib/markdown-tags";
import { remarkTextStyle, rehypeTextStyle } from "@/lib/markdown-text-style";
import { splitMarkdownSpoilers } from "@/lib/markdown-spoiler";
import {
  createRemarkWikiLink,
  type WikiLinkTarget,
} from "@/lib/markdown-wikilink";

import "highlight.js/styles/github-dark.css";

const EMPTY_LINK_TARGETS: WikiLinkTarget[] = [];

const markdownComponents = createMarkdownComponents();

function markdownImageSrc(
  src: ImgHTMLAttributes<HTMLImageElement>["src"],
): string | undefined {
  return typeof src === "string" ? src : undefined;
}

function createMarkdownComponents(): Components {
  return {
    img: ({ src, alt }) => (
      <MarkdownImage src={markdownImageSrc(src)} alt={alt} />
    ),
    div: ({ className, children, ...props }) => {
      if (className?.includes("markdown-alert")) {
        return (
          <MarkdownCallout className={className} {...props}>
            {children}
          </MarkdownCallout>
        );
      }
      return (
        <div className={className} {...props}>
          {children}
        </div>
      );
    },
    a: ({ href, children, ...props }) => (
      <a href={href} className="text-accent hover:underline" {...props}>
        {children}
      </a>
    ),
    pre: ({ children, ...props }) => (
      <MarkdownCodeBlock {...props}>{children}</MarkdownCodeBlock>
    ),
    span: ({ className, children, ...props }) => {
      if (className?.startsWith("markdown-text-")) {
        return (
          <span className={className} {...props}>
            {children}
          </span>
        );
      }
      return (
        <span className={className} {...props}>
          {children}
        </span>
      );
    },
  };
}

export function MarkdownBlock({
  content,
  linkTargets,
}: {
  content: string;
  linkTargets: WikiLinkTarget[];
}) {
  const linkTargetsKey = useMemo(
    () => linkTargets.map((t) => `${t.slug}:${t.title}`).join("|"),
    [linkTargets],
  );

  const remarkPlugins = useMemo(
    (): Pluggable[] => [
      remarkGfm,
      createRemarkWikiLink(linkTargets),
      remarkTags,
      remarkTextStyle,
      remarkAlert,
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable when slugs/titles unchanged
    [linkTargetsKey],
  );

  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      remarkRehypeOptions={{ allowDangerousHtml: true }}
      rehypePlugins={[rehypeTextStyle, rehypeHighlight, rehypeSlug]}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
}

export function MarkdownContent({
  content,
  parseSpoilers = true,
  linkTargets = EMPTY_LINK_TARGETS,
  wrapProse = true,
}: {
  content: string;
  parseSpoilers?: boolean;
  linkTargets?: WikiLinkTarget[];
  wrapProse?: boolean;
}) {
  const body = (children: ReactNode) =>
    wrapProse ? (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        {children}
      </div>
    ) : (
      children
    );

  if (!parseSpoilers) {
    return body(<MarkdownBlock content={content} linkTargets={linkTargets} />);
  }

  const segments = splitMarkdownSpoilers(content);

  return body(
    segments.map((segment, index) =>
      segment.kind === "spoiler" ? (
        <details key={`spoiler-${index}`} className="markdown-spoiler not-prose my-4">
          <summary className="cursor-pointer select-none font-medium text-foreground">
            {segment.title}
          </summary>
          <div className="mt-3 text-muted">
            <MarkdownBlock content={segment.content} linkTargets={linkTargets} />
          </div>
        </details>
      ) : (
        <MarkdownBlock
          key={`md-${index}`}
          content={segment.content}
          linkTargets={linkTargets}
        />
      ),
    ),
  );
}
