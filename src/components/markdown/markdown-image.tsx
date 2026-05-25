"use client";

import { useState } from "react";

type MarkdownImageProps = {
  src?: string;
  alt?: string;
};

export function MarkdownImage({ src, alt }: MarkdownImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className="my-4 flex min-h-24 items-center justify-center rounded-lg border border-dashed border-border bg-card px-4 text-sm text-muted">
        Изображение недоступно
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ""}
      className="my-4 max-w-full rounded-lg border border-border"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
