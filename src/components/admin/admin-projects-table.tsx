"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { deleteProjectAction } from "@/app/(admin)/admin/projects/actions";
import { IconEdit, IconTrash } from "@/components/ui/icons";

type SortKey = "title" | "updatedAt";
type SortDir = "asc" | "desc";

export type AdminProjectRow = {
  id: string;
  title: string;
  slug: string;
  stack: string[];
  updatedAt: string;
};

function compareProjects(
  a: AdminProjectRow,
  b: AdminProjectRow,
  key: SortKey,
  dir: SortDir,
) {
  let result = 0;
  if (key === "title") {
    result = a.title.localeCompare(b.title, "ru");
  } else {
    result = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
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

export function AdminProjectsTable({ projects }: { projects: AdminProjectRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(
    () => [...projects].sort((a, b) => compareProjects(a, b, sortKey, sortDir)),
    [projects, sortKey, sortDir],
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
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border bg-card">
          <tr>
            <th className="px-4 py-3">
              <SortHeader
                label="Название"
                sortKey="title"
                activeKey={sortKey}
                dir={sortDir}
                onSort={toggleSort}
              />
            </th>
            <th className="px-4 py-3 font-medium">Стек</th>
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
              <td colSpan={4} className="px-4 py-6 text-muted">
                Проектов пока нет.
              </td>
            </tr>
          ) : (
            sorted.map((project) => (
              <tr key={project.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{project.title}</p>
                  <p className="text-xs text-muted">/{project.slug}</p>
                </td>
                <td className="px-4 py-3 text-muted">
                  {project.stack.slice(0, 3).join(", ")}
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(project.updatedAt).toLocaleDateString("ru-RU")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/projects/${project.id}/edit`}
                      className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-border text-muted hover:bg-card hover:text-foreground"
                      title="Редактировать"
                      aria-label={`Редактировать «${project.title}»`}
                    >
                      <IconEdit />
                    </Link>
                    <form action={deleteProjectAction.bind(null, project.id)}>
                      <button
                        type="submit"
                        className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-border text-muted hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-600"
                        title="Удалить"
                        aria-label={`Удалить «${project.title}»`}
                        onClick={(event) => {
                          if (!confirm(`Удалить проект «${project.title}»?`)) {
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
