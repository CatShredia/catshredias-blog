"use client";

import rehypeSlug from "rehype-slug";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import { MarkdownImage } from "@/components/markdown/markdown-image";

import "highlight.js/styles/github-dark.css";

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeSlug]}
        components={{
          img: ({ src, alt }) => (
            <MarkdownImage src={typeof src === "string" ? src : undefined} alt={alt} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
