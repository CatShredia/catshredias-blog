"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { TaxonomyKind, TaxonomyPostSummary } from "@/lib/taxonomy-posts";
import type { TaxonomyTransferState } from "@/lib/validations/taxonomy";

type TaxonomyTarget = {
  id: string;
  name: string;
};

type AdminTaxonomyPostsPanelProps = {
  kind: TaxonomyKind;
  source: TaxonomyTarget;
  targets: TaxonomyTarget[];
  postsCount: number;
  loadPosts: (id: string) => Promise<TaxonomyPostSummary[]>;
  transferAction: (
    prev: TaxonomyTransferState,
    formData: FormData,
  ) => Promise<TaxonomyTransferState>;
};

const initialTransferState: TaxonomyTransferState = {};

const kindLabel = {
  category: "категорию",
  tag: "тег",
} as const;

const statusLabel: Record<string, string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликован",
  SCHEDULED: "Запланирован",
};

export function AdminTaxonomyPostsPanel({
  kind,
  source,
  targets,
  postsCount,
  loadPosts,
  transferAction,
}: AdminTaxonomyPostsPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [posts, setPosts] = useState<TaxonomyPostSummary[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<"replace" | "add" | "remove">("replace");
  const [targetId, setTargetId] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, startLoading] = useTransition();
  const [state, formAction, pending] = useActionState(
    transferAction,
    initialTransferState,
  );
  const loadPostsRef = useRef(loadPosts);
  const wasPendingRef = useRef(false);

  useEffect(() => {
    loadPostsRef.current = loadPosts;
  }, [loadPosts]);

  const refreshPosts = useCallback(() => {
    startLoading(async () => {
      setLoadError(null);
      try {
        const nextPosts = await loadPostsRef.current(source.id);
        setPosts(nextPosts);
        setSelectedIds(nextPosts.map((post) => post.id));
      } catch {
        setLoadError("Не удалось загрузить посты");
      }
    });
  }, [source.id]);

  useEffect(() => {
    if (!open) return;
    refreshPosts();
  }, [open, source.id, refreshPosts]);

  useEffect(() => {
    if (pending) {
      wasPendingRef.current = true;
      return;
    }

    if (!wasPendingRef.current || !state.success) return;

    wasPendingRef.current = false;
    refreshPosts();
    router.refresh();
  }, [pending, state.success, refreshPosts, router]);

  const allSelected = posts.length > 0 && selectedIds.length === posts.length;
  const targetRequired = mode !== "remove";

  return (
    <div className="mt-2">
      <button
        type="button"
        className="text-xs text-accent hover:underline"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Скрыть посты" : `Посты (${postsCount})`}
      </button>

      {open ? (
        <div className="mt-3 rounded-lg border border-border bg-background p-3">
          {isLoading ? <p className="text-xs text-muted">Загрузка постов…</p> : null}
          {loadError ? <p className="text-xs text-red-600">{loadError}</p> : null}

          {!isLoading && !loadError && posts.length === 0 ? (
            <p className="text-xs text-muted">Постов с этой меткой пока нет.</p>
          ) : null}

          {posts.length > 0 ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(event) => {
                      setSelectedIds(
                        event.target.checked ? posts.map((post) => post.id) : [],
                      );
                    }}
                  />
                  Выбрать все
                </label>
                <span className="text-xs text-muted">
                  Выбрано: {selectedIds.length} из {posts.length}
                </span>
              </div>

              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                {posts.map((post) => (
                  <li key={post.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedIds.includes(post.id)}
                      onChange={(event) => {
                        setSelectedIds((current) =>
                          event.target.checked
                            ? [...current, post.id]
                            : current.filter((id) => id !== post.id),
                        );
                      }}
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="font-medium text-accent hover:underline"
                      >
                        {post.title}
                      </Link>
                      <p className="text-xs text-muted">
                        {statusLabel[post.status] ?? post.status} · {post.slug}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <form action={formAction} className="mt-3 space-y-3">
                <input type="hidden" name="sourceId" value={source.id} />
                {selectedIds.map((postId) => (
                  <input key={postId} type="hidden" name="postIds" value={postId} />
                ))}

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs">
                    <span className="mb-1 block text-muted">Действие</span>
                    <select
                      name="mode"
                      value={mode}
                      onChange={(event) =>
                        setMode(event.target.value as "replace" | "add" | "remove")
                      }
                      className="min-h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                    >
                      <option value="replace">
                        Заменить {kindLabel[kind]} на другую
                      </option>
                      <option value="add">Добавить ещё одну метку</option>
                      <option value="remove">Снять эту метку с постов</option>
                    </select>
                  </label>

                  {targetRequired ? (
                    <label className="block text-xs">
                      <span className="mb-1 block text-muted">
                        {mode === "replace" ? "Новая метка" : "Добавить метку"}
                      </span>
                      <select
                        name="targetId"
                        required
                        value={targetId}
                        onChange={(event) => setTargetId(event.target.value)}
                        className="min-h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                      >
                        <option value="">Выберите…</option>
                        {targets.map((target) => (
                          <option key={target.id} value={target.id}>
                            {target.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>

                {state.error ? (
                  <p className="text-xs text-red-600">{state.error}</p>
                ) : null}
                {state.success ? (
                  <p className="text-xs text-muted" role="status">
                    {state.success}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  variant="secondary"
                  disabled={pending || selectedIds.length === 0}
                >
                  {pending ? "Применение…" : "Применить к выбранным"}
                </Button>
              </form>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
