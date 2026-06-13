"use client";

import { useActionState } from "react";

import { AdminTaxonomyPostsPanel } from "@/components/admin/admin-taxonomy-posts-panel";
import type { TaxonomyFormState, TaxonomyTransferState } from "@/lib/validations/taxonomy";
import type { TaxonomyKind, TaxonomyPostSummary } from "@/lib/taxonomy-posts";
import { Button } from "@/components/ui/button";
import { IconTrash } from "@/components/ui/icons";

const initialState: TaxonomyFormState = {};

type TaxonomyTarget = {
  id: string;
  name: string;
};

type TaxonomyRow = {
  id: string;
  name: string;
  slug: string;
  postsCount: number;
  updateAction: (
    prev: TaxonomyFormState,
    formData: FormData,
  ) => Promise<TaxonomyFormState>;
};

function TaxonomyTableRow({
  row,
  kind,
  targets,
  deleteAction,
  loadPosts,
  transferAction,
}: {
  row: TaxonomyRow;
  kind: TaxonomyKind;
  targets: TaxonomyTarget[];
  deleteAction: (formData: FormData) => Promise<void>;
  loadPosts: (id: string) => Promise<TaxonomyPostSummary[]>;
  transferAction: (
    prev: TaxonomyTransferState,
    formData: FormData,
  ) => Promise<TaxonomyTransferState>;
}) {
  const [state, formAction, pending] = useActionState(row.updateAction, initialState);

  return (
    <tr className="border-b border-border last:border-0 align-top">
      <td className="px-3 py-3" colSpan={4}>
        <div className="grid gap-3 lg:grid-cols-[minmax(12rem,1fr)_8rem_4rem_auto] lg:items-start">
          <form action={formAction} id={`taxonomy-edit-${row.id}`} className="space-y-1">
            <input type="hidden" name="id" value={row.id} />
            <input
              name="name"
              required
              defaultValue={row.name}
              className="min-h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            />
            {state.fieldErrors?.name ? (
              <p className="text-xs text-red-600">{state.fieldErrors.name[0]}</p>
            ) : null}
            {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
          </form>

          <div className="font-mono text-xs text-muted lg:pt-2.5">{row.slug}</div>

          <div className="text-center text-sm tabular-nums lg:pt-2.5">
            {row.postsCount}
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button
              type="submit"
              form={`taxonomy-edit-${row.id}`}
              variant="secondary"
              disabled={pending}
            >
              {pending ? "…" : "Сохранить"}
            </Button>
            <form action={deleteAction}>
              <input type="hidden" name="id" value={row.id} />
              <button
                type="submit"
                className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-border text-muted hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={row.postsCount > 0}
                title={
                  row.postsCount > 0
                    ? "Сначала перенесите или снимите метку с постов"
                    : "Удалить"
                }
                aria-label={`Удалить «${row.name}»`}
                onClick={(event) => {
                  if (row.postsCount > 0) return;
                  if (!window.confirm(`Удалить «${row.name}»?`)) {
                    event.preventDefault();
                  }
                }}
              >
                <IconTrash />
              </button>
            </form>
          </div>
        </div>

        <AdminTaxonomyPostsPanel
          kind={kind}
          source={{ id: row.id, name: row.name }}
          targets={targets.filter((target) => target.id !== row.id)}
          postsCount={row.postsCount}
          loadPosts={loadPosts}
          transferAction={transferAction}
        />
      </td>
    </tr>
  );
}

export function AdminTaxonomyTable({
  rows,
  kind,
  targets,
  deleteAction,
  loadPosts,
  transferAction,
}: {
  rows: TaxonomyRow[];
  kind: TaxonomyKind;
  targets: TaxonomyTarget[];
  deleteAction: (formData: FormData) => Promise<void>;
  loadPosts: (id: string) => Promise<TaxonomyPostSummary[]>;
  transferAction: (
    prev: TaxonomyTransferState,
    formData: FormData,
  ) => Promise<TaxonomyTransferState>;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">Записей пока нет.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-card/80">
            <th className="px-3 py-3 font-medium" colSpan={4}>
              {kind === "category" ? "Категории" : "Теги"}
            </th>
          </tr>
          <tr className="border-b border-border bg-card/50 text-xs text-muted">
            <th className="px-3 py-2 font-medium">Название</th>
            <th className="px-3 py-2 font-medium">Slug</th>
            <th className="px-3 py-2 text-center font-medium">Постов</th>
            <th className="px-3 py-2 text-right font-medium">Действия</th>
          </tr>
        </thead>
        <tbody className="bg-card">
          {rows.map((row) => (
            <TaxonomyTableRow
              key={row.id}
              row={row}
              kind={kind}
              targets={targets}
              deleteAction={deleteAction}
              loadPosts={loadPosts}
              transferAction={transferAction}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
