import wikiLinkPlugin from "remark-wiki-link";
import type { Pluggable } from "unified";

import { blogPostPath, slugify } from "@/lib/slug";

export type WikiLinkTarget = {
  title: string;
  slug: string;
};

export function resolveWikiLinkSlug(
  name: string,
  targets: WikiLinkTarget[],
): string {
  const key = name.trim().toLowerCase();
  if (!key) return slugify(name);

  const bySlug = targets.find((target) => target.slug.toLowerCase() === key);
  if (bySlug) return bySlug.slug;

  const byTitle = targets.find((target) => target.title.toLowerCase() === key);
  if (byTitle) return byTitle.slug;

  return slugify(name);
}

export function createRemarkWikiLink(targets: WikiLinkTarget[] = []): Pluggable {
  const permalinks = targets.map((target) => target.slug);

  // Plugin must run inside unified (uses `this.data()`); do not call wikiLinkPlugin() here.
  return [
    wikiLinkPlugin,
    {
      permalinks,
      aliasDivider: "|",
      pageResolver: (name: string) => [resolveWikiLinkSlug(name, targets)],
      hrefTemplate: (permalink: string) => blogPostPath(permalink),
    },
  ] as unknown as Pluggable;
}
