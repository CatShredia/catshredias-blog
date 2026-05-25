"use client";

import Image from "next/image";
import { useState } from "react";

type SafeImageProps = {
  src: string;
  alt?: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  objectFit?: "cover" | "contain";
};

export function SafeImage({
  src,
  alt = "",
  className = "",
  fill,
  width,
  height,
  priority,
  sizes,
  objectFit = "cover",
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-card text-xs text-muted ${className}`}
        role="img"
        aria-label={alt || "Изображение недоступно"}
      >
        Нет изображения
      </div>
    );
  }

  const fitClass = objectFit === "contain" ? "object-contain" : "object-cover";

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={`${fitClass} ${className}`}
        unoptimized
        priority={priority}
        sizes={sizes}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 800}
      height={height ?? 450}
      className={`${fitClass} ${className}`}
      unoptimized
      priority={priority}
      sizes={sizes}
      onError={() => setFailed(true)}
    />
  );
}
