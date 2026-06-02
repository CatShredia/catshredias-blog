"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Card } from "@/components/ui/card";
import { PostTaxonomyBadges } from "@/components/blog/post-taxonomy-badges";
import { formatDateRu, toIsoString } from "@/lib/dates";
import type { PostListItem } from "@/lib/queries/posts";
import { blogPostPath } from "@/lib/slug";

type FilterOption = { name: string; slug: string };

type ApiResponse = {
  items: PostListItem[];
  nextCursor: string | null;
};

type SortOption = "newest" | "oldest";

export function BlogListInfinite({
  categories,
  tags,
  initialItems,
  initialCursor,
  initialCategory,
  initialTag,
}: {
  categories: FilterOption[];
  tags: FilterOption[];
  initialItems: PostListItem[];
  initialCursor: string | null;
  initialCategory?: string;
  initialTag?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory ?? "");
  const [tag, setTag] = useState(initialTag ?? "");
  const [sort, setSort] = useState<SortOption>("newest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const skipSearchEffect = useRef(!(initialCategory || initialTag));

  const fetchPosts = useCallback(
    async (opts: {
      reset: boolean;
      nextCursor?: string | null;
      q?: string;
      categorySlug?: string;
      tagSlug?: string;
      sort?: SortOption;
    }) => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("limit", "6");
      if (opts.nextCursor) params.set("cursor", opts.nextCursor);
      if (opts.q) params.set("q", opts.q);
      if (opts.categorySlug) params.set("category", opts.categorySlug);
      if (opts.tagSlug) params.set("tag", opts.tagSlug);
      if (opts.sort) params.set("sort", opts.sort);

      const response = await fetch(`/api/posts?${params}`);
      if (!response.ok) {
        setError("Не удалось загрузить посты");
        setLoading(false);
        return;
      }

      const data = (await response.json()) as ApiResponse;
      setItems((prev) => (opts.reset ? data.items : [...prev, ...data.items]));
      setCursor(data.nextCursor);
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    if (skipSearchEffect.current) {
      skipSearchEffect.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void fetchPosts({
        reset: true,
        q: query,
        categorySlug: category,
        tagSlug: tag,
        sort,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, category, tag, sort, fetchPosts]);

  useEffect(() => {
    if (!cursor || loading) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && cursor && !loading) {
          void fetchPosts({
            reset: false,
            nextCursor: cursor,
            q: query,
            categorySlug: category,
            tagSlug: tag,
            sort,
          });
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, loading, query, category, tag, sort, fetchPosts]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        <label className="min-w-0 flex-1 sm:min-w-[12rem]">
          <span className="sr-only">Поиск</span>
          <input
            type="search"
            placeholder="Поиск по заголовку и тексту…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          />
        </label>
        <label className="sm:w-44">
          <span className="sr-only">Категория</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="">Все категории</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="sm:w-44">
          <span className="sr-only">Тег</span>
          <select
            value={tag}
            onChange={(event) => setTag(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="">Все теги</option>
            {tags.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="sm:w-48">
          <span className="sr-only">Сортировка по дате</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
          </select>
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {items.length === 0 && !loading ? (
        <p className="text-muted">Ничего не найдено.</p>
      ) : (
        <ul className="grid gap-4">
          {items.map((post) => (
            <li key={post.id}>
              <Card href={blogPostPath(post.slug)}>
                <time
                  dateTime={toIsoString(post.publishedAt)}
                  className="text-xs text-muted"
                >
                  {formatDateRu(post.publishedAt)}
                </time>
                <h2 className="mt-2 text-xl font-semibold">{post.title}</h2>
                <p className="mt-2 text-sm text-muted">{post.excerpt}</p>
                <div className="mt-3">
                  <PostTaxonomyBadges
                    categories={post.categories}
                    tags={post.tags}
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <div ref={sentinelRef} className="h-4" aria-hidden />
      {loading ? (
        <p className="text-center text-sm text-muted">Загрузка…</p>
      ) : null}
      {!cursor && items.length > 0 ? (
        <p className="text-center text-sm text-muted">Все посты загружены</p>
      ) : null}
    </div>
  );
}
