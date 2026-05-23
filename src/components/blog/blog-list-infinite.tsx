"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { PostListItem } from "@/lib/queries/posts";

type CategoryOption = { name: string; slug: string };

type ApiResponse = {
  items: PostListItem[];
  nextCursor: string | null;
};

export function BlogListInfinite({
  categories,
  initialItems,
  initialCursor,
}: {
  categories: CategoryOption[];
  initialItems: PostListItem[];
  initialCursor: string | null;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const skipSearchEffect = useRef(true);

  const fetchPosts = useCallback(
    async (opts: {
      reset: boolean;
      nextCursor?: string | null;
      q?: string;
      categorySlug?: string;
    }) => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("limit", "6");
      if (opts.nextCursor) params.set("cursor", opts.nextCursor);
      if (opts.q) params.set("q", opts.q);
      if (opts.categorySlug) params.set("category", opts.categorySlug);

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
      void fetchPosts({ reset: true, q: query, categorySlug: category });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, category, fetchPosts]);

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
          });
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, loading, query, category, fetchPosts]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Поиск</span>
          <input
            type="search"
            placeholder="Поиск по заголовку и тексту…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"
          />
        </label>
        <label>
          <span className="sr-only">Категория</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm sm:w-48"
          >
            <option value="">Все категории</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
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
              <Card href={`/blog/${post.slug}`}>
                <time
                  dateTime={post.publishedAt?.toISOString()}
                  className="text-xs text-muted"
                >
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString("ru-RU")
                    : ""}
                </time>
                <h2 className="mt-2 text-xl font-semibold">{post.title}</h2>
                <p className="mt-2 text-sm text-muted">{post.excerpt}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag.slug}>{tag.name}</Badge>
                  ))}
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
