"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { mockCategories, mockPosts } from "@/data/mock/posts";

export function BlogList() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mockPosts.filter((post) => {
      const matchesQuery =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q);
      const matchesCategory =
        !category || post.categories.includes(category);
      return matchesQuery && matchesCategory;
    });
  }, [query, category]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Поиск</span>
          <input
            type="search"
            placeholder="Поиск по заголовку и описанию…"
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
            {mockCategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted">Ничего не найдено.</p>
      ) : (
        <ul className="grid gap-4">
          {filtered.map((post) => (
            <li key={post.slug}>
              <Card href={`/blog/${post.slug}`}>
                <time
                  dateTime={post.publishedAt}
                  className="text-xs text-muted"
                >
                  {post.publishedAt}
                </time>
                <h2 className="mt-2 text-xl font-semibold">{post.title}</h2>
                <p className="mt-2 text-sm text-muted">{post.excerpt}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-muted">
        Infinite scroll и API — на{" "}
        <Link href="/blog" className="underline">
          этапе 4
        </Link>
        .
      </p>
    </div>
  );
}
