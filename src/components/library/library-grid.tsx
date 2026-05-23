"use client";

import Image from "next/image";
import { BookStatus } from "@prisma/client";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { BookListItem } from "@/lib/queries/books";
import { BOOK_STATUS_LABELS } from "@/lib/validations/book";

export function LibraryGrid({
  books,
  tags,
}: {
  books: BookListItem[];
  tags: { name: string; slug: string }[];
}) {
  const [status, setStatus] = useState<BookStatus | "">("");
  const [tag, setTag] = useState("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter((book) => {
      const matchesStatus = !status || book.status === status;
      const matchesTag = !tag || book.tags.some((t) => t.slug === tag);
      const matchesQuery =
        !q ||
        book.title.toLowerCase().includes(q) ||
        (book.author?.toLowerCase().includes(q) ?? false);
      return matchesStatus && matchesTag && matchesQuery;
    });
  }, [books, status, tag, query]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row">
        <input
          type="search"
          placeholder="Поиск по названию или автору…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-11 flex-1 rounded-lg border border-border bg-card px-3 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as BookStatus | "")}
          className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm lg:w-48"
        >
          <option value="">Все статусы</option>
          {Object.entries(BOOK_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm lg:w-48"
        >
          <option value="">Все теги</option>
          {tags.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted">Книг не найдено.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((book) => (
            <li key={book.id}>
              <Card href={`/library/${book.slug}`}>
                {book.coverImage ? (
                  <div className="relative mb-3 h-40 w-full overflow-hidden rounded-lg">
                    <Image
                      src={book.coverImage}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : null}
                <p className="text-xs text-muted">{BOOK_STATUS_LABELS[book.status]}</p>
                <h2 className="mt-1 text-lg font-semibold">{book.title}</h2>
                {book.author ? (
                  <p className="text-sm text-muted">{book.author}</p>
                ) : null}
                {book.rating ? (
                  <p className="mt-2 text-sm">{"★".repeat(book.rating)}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-1">
                  {book.tags.map((t) => (
                    <Badge key={t.slug}>{t.name}</Badge>
                  ))}
                </div>
                {book.reviewPost ? (
                  <p className="mt-2 text-xs text-accent">Есть отзыв в блоге</p>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
