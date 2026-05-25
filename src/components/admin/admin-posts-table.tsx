"use client";

import Link from "next/link";
import { PostStatus } from "@prisma/client";
import { useMemo, useState } from "react";

import { deletePostAction } from "@/app/(admin)/admin/posts/actions";
import { IconEdit, IconTrash } from "@/components/ui/icons";

const statusLabel: Record<PostStatus, string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликован",
  SCHEDULED: "Запланирован",
};

type SortKey = "title" | "status" | "publishedAt" | "updatedAt";
type SortDir = "asc" | "desc";

export type AdminPostRow = {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
  publishedAt: string | null;
  updatedAt: string;
};

function comparePosts(a: AdminPostRow, b: AdminPostRow, key: SortKey, dir: SortDir) {
  let result = 0;

  if (key === "title") {
    result = a.title.localeCompare(b.title, "ru");
  } else if (key === "status") {
    result = a.status.localeCompare(b.status);
  } else {
    const aTime = key === "publishedAt" ? a.publishedAt : a.updatedAt;
    const bTime = key === "publishedAt" ? b.publishedAt : b.updatedAt;
    const aDate = aTime ? new Date(aTime).getTime() : 0;
    const bDate = bTime ? new Date(bTime).getTime() : 0;
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

export function AdminPostsTable({ posts }: { posts: AdminPostRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(
    () =>
      [...posts].sort((a, b) => comparePosts(a, b, sortKey, sortDir)),
    [posts, sortKey, sortDir],
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
                label="Заголовок"
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
                label="Опубликован"
                sortKey="publishedAt"
                activeKey={sortKey}
                dir={sortDir}
                onSort={toggleSort}
              />
            </th>
            <th className="px-4 py-3">
              <SortHeader
                label="Обновлён"
                sortKey="updatedAt"
                activeKey={sortKey}
                dir={sortDir}
                onSort={toggleSort}
              />
            </th>
            <th className="px-4 py-3 text-right font-medium">Действия</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-muted">
                Постов пока нет.
              </td>
            </tr>
          ) : (
            sorted.map((post) => (
              <tr key={post.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{post.title}</p>
                  <p className="text-xs text-muted">/{post.slug}</p>
                </td>
                <td className="px-4 py-3">{statusLabel[post.status]}</td>
                <td className="px-4 py-3 text-muted">
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString("ru-RU")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(post.updatedAt).toLocaleDateString("ru-RU")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-border text-muted hover:bg-card hover:text-foreground"
                      title="Редактировать"
                      aria-label={`Редактировать «${post.title}»`}
                    >
                      <IconEdit />
                    </Link>
                    <form action={deletePostAction.bind(null, post.id)}>
                      <button
                        type="submit"
                        className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-border text-muted hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-600"
                        title="Удалить"
                        aria-label={`Удалить «${post.title}»`}
                        onClick={(event) => {
                          if (!confirm(`Удалить пост «${post.title}»?`)) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <IconTrash />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
