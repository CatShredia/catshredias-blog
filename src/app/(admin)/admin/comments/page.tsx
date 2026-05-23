import Link from "next/link";
import { CommentStatus } from "@prisma/client";

import {
  approveCommentForm,
  rejectCommentForm,
  removeCommentForm,
} from "@/app/(admin)/admin/comments/actions";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { listCommentsForModeration } from "@/lib/queries/comments";

const filters = [
  { label: "На модерации", value: CommentStatus.PENDING },
  { label: "Одобренные", value: CommentStatus.APPROVED },
  { label: "Отклонённые", value: CommentStatus.REJECTED },
  { label: "Все", value: undefined },
] as const;

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status =
    params.status && params.status in CommentStatus
      ? (params.status as CommentStatus)
      : CommentStatus.PENDING;

  const comments = await listCommentsForModeration(
    params.status === "all" ? undefined : status,
  );

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold">Модерация комментариев</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.label}
            href={
              filter.value
                ? `/admin/comments?status=${filter.value}`
                : "/admin/comments?status=all"
            }
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-card"
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <ul className="mt-8 space-y-4">
        {comments.length === 0 ? (
          <li className="text-muted">Комментариев нет.</li>
        ) : (
          comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{comment.authorName}</p>
                  <p className="text-xs text-muted">{comment.authorEmail}</p>
                  <p className="mt-1 text-xs text-muted">
                    К посту:{" "}
                    <Link
                      href={`/blog/${comment.post.slug}`}
                      className="text-accent underline"
                    >
                      {comment.post.title}
                    </Link>
                  </p>
                </div>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                  {comment.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed">{comment.content}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {comment.status === CommentStatus.PENDING ? (
                  <>
                    <form action={approveCommentForm}>
                      <input type="hidden" name="id" value={comment.id} />
                      <Button type="submit">Одобрить</Button>
                    </form>
                    <form action={rejectCommentForm}>
                      <input type="hidden" name="id" value={comment.id} />
                      <Button type="submit" variant="secondary">
                        Отклонить
                      </Button>
                    </form>
                  </>
                ) : null}
                <form action={removeCommentForm}>
                  <input type="hidden" name="id" value={comment.id} />
                  <Button type="submit" variant="ghost">
                    Удалить
                  </Button>
                </form>
              </div>
            </li>
          ))
        )}
      </ul>
    </Container>
  );
}
