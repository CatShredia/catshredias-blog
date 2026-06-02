import Link from "next/link";

import { Badge } from "@/components/ui/badge";

type TaxonomyItem = { name: string; slug: string };

export function PostTaxonomyBadges({
  categories,
  tags,
}: {
  categories: TaxonomyItem[];
  tags: TaxonomyItem[];
}) {
  if (categories.length === 0 && tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {categories.map((category) => (
        <Link
          key={`category-${category.slug}`}
          href={`/blog?category=${encodeURIComponent(category.slug)}`}
          className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
        >
          {category.name}
        </Link>
      ))}
      {tags.map((tag) => (
        <Link
          key={tag.slug}
          href={`/blog?tag=${encodeURIComponent(tag.slug)}`}
          className="transition-opacity hover:opacity-80"
        >
          <Badge>{tag.name}</Badge>
        </Link>
      ))}
    </div>
  );
}
