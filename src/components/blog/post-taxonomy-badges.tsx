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
        <span
          key={`category-${category.slug}`}
          className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent"
        >
          {category.name}
        </span>
      ))}
      {tags.map((tag) => (
        <Badge key={tag.slug}>{tag.name}</Badge>
      ))}
    </div>
  );
}
