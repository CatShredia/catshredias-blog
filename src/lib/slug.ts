export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0400-\u04ff-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Slug из URL (Next иногда отдаёт %D0%... вместо кириллицы). */
export function decodeRouteSlug(segment: string): string {
  let value = segment.trim();
  if (!value) return value;

  for (let i = 0; i < 2 && /%[0-9A-Fa-f]{2}/.test(value); i += 1) {
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) break;
      value = decoded;
    } catch {
      break;
    }
  }

  return value.normalize("NFC");
}

export function encodeRouteSlug(slug: string): string {
  return encodeURIComponent(slug.trim());
}

export function blogPostPath(slug: string): string {
  return `/blog/${encodeRouteSlug(slug)}`;
}

export function libraryBookPath(slug: string): string {
  return `/library/${encodeRouteSlug(slug)}`;
}

export function portfolioProjectPath(slug: string): string {
  return `/portfolio/${encodeRouteSlug(slug)}`;
}

/** Варианты slug для поиска в БД (декодированный и как в URL). */
export function routeSlugCandidates(segment: string): string[] {
  const raw = segment.trim();
  if (!raw) return [];

  const decoded = decodeRouteSlug(raw);
  if (decoded === raw) return [raw];
  return [decoded, raw];
}
