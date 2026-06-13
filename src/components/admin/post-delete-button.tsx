"use client";

import { IconTrash } from "@/components/ui/icons";

type PostDeleteButtonProps = {
  action: () => void | Promise<void>;
  postTitle: string;
};

export function PostDeleteButton({ action, postTitle }: PostDeleteButtonProps) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-border text-muted hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-600"
        title="Удалить пост"
        aria-label={`Удалить «${postTitle}»`}
        onClick={(event) => {
          if (!window.confirm(`Удалить пост «${postTitle}»?`)) {
            event.preventDefault();
          }
        }}
      >
        <IconTrash />
      </button>
    </form>
  );
}
