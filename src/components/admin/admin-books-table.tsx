"use client";

import Link from "next/link";
import { BookStatus } from "@prisma/client";
import { useMemo, useState } from "react";

import { formatDateRu } from "@/lib/dates";
import { formatStarRating } from "@/lib/book-rating";
import { BOOK_STATUS_LABELS } from "@/lib/validations/book";

type SortKey = "title" | "status" | "rating" | "readAt";
type SortDir = "asc" | "desc";

export type AdminBookRow = {
  id: string;
  title: string;
  author: string | null;
  status: BookStatus;
  rating: number | null;
  readAt: string | null;
  reviewTitle: string | null;
};

function compareBooks(a: AdminBookRow, b: AdminBookRow, key: SortKey, dir: SortDir) {
  let result = 0;

  if (key === "title") {
    const aTitle = a.author ? `${a.title} ${a.author}` : a.title;
    const bTitle = b.author ? `${b.title} ${b.author}` : b.title;
    result = aTitle.localeCompare(bTitle, "ru");
  } else if (key === "status") {
    result = a.status.localeCompare(b.status);
  } else if (key === "rating") {
    result = (a.rating ?? 0) - (b.rating ?? 0);
  } else {
    const aDate = a.readAt ? new Date(a.readAt).getTime() : 0;
    const bDate = b.readAt ? new Date(b.readAt).getTime() : 0;
    result = aDate - bDate;
  }

  return dir === "asc" ? result : -result;
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  const arrow = active ? (dir === "asc" ? " ↑" : " ↓") : "";

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 font-medium hover:text-foreground"
    >
      {label}
      <span className="text-xs text-muted">{arrow}</span>
    </button>
  );
}

export function AdminBooksTable({ books }: { books: AdminBookRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("readAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(
    () => [...books].sort((a, b) => compareBooks(a, b, sortKey, sortDir)),
    [books, sortKey, sortDir],
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "title" ? "asc" : "desc");
  }

  return (
    <div className="mt-8 overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border bg-card">
          <tr>
            <th className="px-4 py-3">
              <SortHeader
                label="Книга"
                sortKey="title"
                activeKey={sortKey}
                dir={sortDir}
                onSort={toggleSort}
              />
            </th>
            <th className="px-4 py-3">
              <SortHeader
                label="Статус"
                sortKey="status"
                activeKey={sortKey}
                dir={sortDir}
                onSort={toggleSort}
              />
            </th>
            <th className="px-4 py-3">
              <SortHeader
                label="Рейтинг"
                sortKey="rating"
                activeKey={sortKey}
                dir={sortDir}
                onSort={toggleSort}
              />
            </th>
            <th className="px-4 py-3">
              <SortHeader
                label="Дата прочтения"
                sortKey="readAt"
                activeKey={sortKey}
                dir={sortDir}
                onSort={toggleSort}
              />
            </th>
            <th className="px-4 py-3 font-medium">Отзыв</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-muted">
                Книг пока нет.
              </td>
            </tr>
          ) : (
            sorted.map((book) => (
              <tr key={book.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{book.title}</p>
                  {book.author ? (
                    <p className="text-xs text-muted">{book.author}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">{BOOK_STATUS_LABELS[book.status]}</td>
                <td className="px-4 py-3">
                  {book.rating ? formatStarRating(book.rating) : "—"}
                </td>
                <td className="px-4 py-3 text-muted">
                  {book.readAt ? formatDateRu(book.readAt) : "—"}
                </td>
                <td className="px-4 py-3 text-muted">
                  {book.reviewTitle ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/books/${book.id}/edit`}
                    className="text-accent underline"
                  >
                    Редактировать
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
