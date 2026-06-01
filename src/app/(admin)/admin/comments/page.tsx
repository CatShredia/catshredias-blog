import Link from "next/link";
import { CommentStatus } from "@prisma/client";

import {
  deleteCommentAction,
  hideCommentAction,
  markAllSeenAction,
  markSeenAction,
} from "@/app/(admin)/admin/comments/actions";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { formatDateRu } from "@/lib/dates";
import { blogPostPath } from "@/lib/slug";
import { mapCommentAuthor } from "@/lib/deleted-user";
import { countPendingReports, listAdminComments } from "@/lib/queries/comments";

export default async function AdminCommentsPage() {
  const [comments, pendingReports] = await Promise.all([
    listAdminComments(),
    countPendingReports(),
  ]);

  const unseen = comments.filter((c) => !c.adminSeenAt).length;

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Комментарии</h1>
          <p className="mt-1 text-sm text-muted">
            Новых: {unseen} · Жалоб на рассмотрении: {pendingReports}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={markAllSeenAction}>
            <Button type="submit" variant="secondary">
              Отметить все просмотренными
            </Button>
          </form>
          <ButtonLink href="/admin/reports" variant="secondary">
            Жалобы ({pendingReports})
          </ButtonLink>
        </div>
      </div>

      <ul className="mt-8 space-y-4">
        {comments.map((comment) => {
          const author = mapCommentAuthor(comment.user, comment.authorName);
          return (
          <li
            key={comment.id}
            className={`rounded-xl border p-4 ${
              !comment.adminSeenAt
                ? "border-accent/50 bg-accent/5"
                : "border-border bg-card"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {author.authorName}
                  {!comment.adminSeenAt ? (
                    <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">
                      новый
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-muted">
                  {formatDateRu(comment.createdAt)} ·{" "}
                  <Link
                    href={blogPostPath(comment.post.slug)}
                    className="underline"
                  >
                    {comment.post.title}
                  </Link>
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded border border-border px-2 py-0.5">
                  {comment.status}
                </span>
                {comment._count.reports > 0 ? (
                  <span className="rounded bg-red-500/10 px-2 py-0.5 text-red-600">
                    жалоб: {comment._count.reports}
                  </span>
                ) : null}
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed">{comment.content}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {!comment.adminSeenAt ? (
                <form action={markSeenAction}>
                  <input type="hidden" name="id" value={comment.id} />
                  <Button type="submit" variant="secondary">
                    Просмотрено
                  </Button>
                </form>
              ) : null}
              {comment.status === CommentStatus.APPROVED ? (
                <form action={hideCommentAction}>
                  <input type="hidden" name="id" value={comment.id} />
                  <Button type="submit" variant="ghost">
                    Скрыть
                  </Button>
                </form>
              ) : null}
              <form action={deleteCommentAction}>
                <input type="hidden" name="id" value={comment.id} />
                <Button type="submit" variant="ghost">
                  Удалить
                </Button>
              </form>
            </div>
          </li>
          );
        })}
      </ul>
    </Container>
  );
}

function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const cls =
    variant === "secondary"
      ? "inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm hover:bg-card"
      : "inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm text-accent-foreground";
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
