import { slugify } from "@/lib/slug";

export function randomSlugSuffix(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length);
}

export function stripPostSlugSuffix(slug: string): string {
  return slug.replace(/-[a-f0-9]{6,8}$/i, "");
}

/** Базовая часть slug без случайного суффикса. */
export function normalizeSlugBase(base: string, fallback = "item"): string {
  return slugify(stripPostSlugSuffix(base)) || slugify(base) || fallback;
}
/** Slug с суффиксом для предпросмотра в форме (посты, книги, проекты). */
export function generatePostSlug(text: string): string {
  const base = normalizeSlugBase(text, "");
  if (!base) return randomSlugSuffix(8);
  return `${base}-${randomSlugSuffix()}`;
}

export async function uniqueSlugWithSuffix(
  base: string,
  exists: (slug: string) => Promise<boolean>,
  fallback = "item",
): Promise<string> {
  const normalized = normalizeSlugBase(base, fallback);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const slug = `${normalized}-${randomSlugSuffix()}`;
    if (!(await exists(slug))) return slug;
  }

  throw new Error("Не удалось сгенерировать уникальный slug");
}
