"use client";

import { useActionState } from "react";

import type { TaxonomyFormState } from "@/lib/validations/taxonomy";
import { Button } from "@/components/ui/button";

const initialState: TaxonomyFormState = {};

export function AdminTaxonomyCreateForm({
  label,
  action,
}: {
  label: string;
  action: (
    prev: TaxonomyFormState,
    formData: FormData,
  ) => Promise<TaxonomyFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="min-w-[200px] flex-1">
        <label className="mb-1 block text-sm font-medium">{label}</label>
        <input
          name="name"
          required
          placeholder="Название"
          className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
        />
        {state.fieldErrors?.name ? (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.name[0]}</p>
        ) : null}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "…" : "Добавить"}
      </Button>
      {state.error ? (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      ) : null}
    </form>
  );
}

export function AdminTaxonomyRowForm({
  id,
  name,
  slug,
  postsCount,
  updateAction,
  deleteAction,
}: {
  id: string;
  name: string;
  slug: string;
  postsCount: number;
  updateAction: (
    prev: TaxonomyFormState,
    formData: FormData,
  ) => Promise<TaxonomyFormState>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const [state, formAction, pending] = useActionState(updateAction, initialState);

  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="id" value={id} />
        <div className="min-w-[200px] flex-1">
          <input
            name="name"
            required
            defaultValue={name}
            className="min-h-11 w-full rounded-lg border border-border bg-background px-3"
          />
          <p className="mt-1 font-mono text-xs text-muted">slug: {slug}</p>
          {state.fieldErrors?.name ? (
            <p className="mt-1 text-sm text-red-600">
              {state.fieldErrors.name[0]}
            </p>
          ) : null}
        </div>
        <span className="text-sm text-muted">постов: {postsCount}</span>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "…" : "Сохранить"}
        </Button>
        {state.error ? (
          <p className="w-full text-sm text-red-600">{state.error}</p>
        ) : null}
      </form>
      <form action={deleteAction} className="mt-3">
        <input type="hidden" name="id" value={id} />
        <Button
          type="submit"
          variant="ghost"
          disabled={postsCount > 0}
          title={
            postsCount > 0
              ? "Сначала уберите из постов"
              : "Удалить"
          }
        >
          Удалить
        </Button>
      </form>
    </li>
  );
}
