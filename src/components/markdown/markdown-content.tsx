import type { ImgHTMLAttributes } from "react";
import rehypeSlug from "rehype-slug";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import { MarkdownImage } from "@/components/markdown/markdown-image";
import { splitMarkdownSpoilers } from "@/lib/markdown-spoiler";

import "highlight.js/styles/github-dark.css";

function markdownImageSrc(
  src: ImgHTMLAttributes<HTMLImageElement>["src"],
): string | undefined {
  return typeof src === "string" ? src : undefined;
}

const markdownComponents: Components = {
  img: ({ src, alt }) => (
    <MarkdownImage src={markdownImageSrc(src)} alt={alt} />
  ),
};

function MarkdownBlock({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight, rehypeSlug]}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  );
}

export function MarkdownContent({
  content,
  parseSpoilers = true,
}: {
  content: string;
  parseSpoilers?: boolean;
}) {
  if (!parseSpoilers) {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <MarkdownBlock content={content} />
      </div>
    );
  }

  const segments = splitMarkdownSpoilers(content);

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      {segments.map((segment, index) =>
        segment.kind === "spoiler" ? (
          <details key={`spoiler-${index}`} className="markdown-spoiler not-prose my-4">
            <summary className="cursor-pointer select-none font-medium text-foreground">
              {segment.title}
            </summary>
            <div className="mt-3 text-muted">
              <MarkdownBlock content={segment.content} />
            </div>
          </details>
        ) : (
          <MarkdownBlock key={`md-${index}`} content={segment.content} />
        ),
      )}
    </div>
  );
}
