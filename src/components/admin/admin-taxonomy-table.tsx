"use client";

import { useActionState } from "react";

import type { TaxonomyFormState } from "@/lib/validations/taxonomy";
import { Button } from "@/components/ui/button";

const initialState: TaxonomyFormState = {};

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
  deleteAction,
}: {
  row: TaxonomyRow;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const [state, formAction, pending] = useActionState(row.updateAction, initialState);

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-3 align-top">
        <form action={formAction} id={`taxonomy-edit-${row.id}`} className="space-y-1">
          <input type="hidden" name="id" value={row.id} />
          <input
            name="name"
            required
            defaultValue={row.name}
            className="min-h-10 w-full min-w-[12rem] rounded-lg border border-border bg-background px-3 text-sm"
          />
          {state.fieldErrors?.name ? (
            <p className="text-xs text-red-600">{state.fieldErrors.name[0]}</p>
          ) : null}
          {state.error ? (
            <p className="text-xs text-red-600">{state.error}</p>
          ) : null}
        </form>
      </td>
      <td className="px-3 py-3 align-middle font-mono text-xs text-muted">
        {row.slug}
      </td>
      <td className="px-3 py-3 align-middle text-center text-sm tabular-nums">
        {row.postsCount}
      </td>
      <td className="px-3 py-3 align-middle">
        <div className="flex flex-wrap justify-end gap-2">
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
            <Button
              type="submit"
              variant="ghost"
              disabled={row.postsCount > 0}
              title={
                row.postsCount > 0
                  ? "Сначала уберите из постов"
                  : "Удалить"
              }
            >
              Удалить
            </Button>
          </form>
        </div>
      </td>
    </tr>
  );
}

export function AdminTaxonomyTable({
  rows,
  deleteAction,
}: {
  rows: TaxonomyRow[];
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">Записей пока нет.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-card/80">
            <th className="px-3 py-3 font-medium">Название</th>
            <th className="px-3 py-3 font-medium">Slug</th>
            <th className="px-3 py-3 text-center font-medium">Постов</th>
            <th className="px-3 py-3 text-right font-medium">Действия</th>
          </tr>
        </thead>
        <tbody className="bg-card">
          {rows.map((row) => (
            <TaxonomyTableRow key={row.id} row={row} deleteAction={deleteAction} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
