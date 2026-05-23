"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { formatDateRu, toIsoString } from "@/lib/dates";

export type CommentItem = {
  id: string;
  authorName: string;
  authorImage?: string | null;
  content: string;
  createdAt: Date | string;
  replies: CommentItem[];
};

export function CommentSection({
  postId,
  postSlug,
  initialComments,
}: {
  postId: string;
  postSlug: string;
  initialComments: CommentItem[];
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/blog/${postSlug}`)}`;
  const registerHref = `/register?callbackUrl=${encodeURIComponent(`/blog/${postSlug}`)}`;

  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string>();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.user) return;

    setSubmitting(true);
    setStatusMessage(null);

    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content, turnstileToken }),
    });

    setSubmitting(false);

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setStatusMessage(data.error ?? "Ошибка отправки");
      return;
    }

    const data = (await response.json()) as {
      comment: CommentItem;
      message: string;
    };

    setComments((prev) => [...prev, data.comment]);
    setContent("");
    setTurnstileToken(undefined);
    setStatusMessage(data.message);
    router.refresh();
  }

  async function submitReport(commentId: string) {
    if (!session?.user || reportReason.length < 5) return;

    const response = await fetch(`/api/comments/${commentId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reportReason }),
    });

    const data = (await response.json()) as { error?: string; message?: string };
    if (!response.ok) {
      setStatusMessage(data.error ?? "Не удалось отправить жалобу");
      return;
    }

    setReportingId(null);
    setReportReason("");
    setStatusMessage(data.message ?? "Жалоба отправлена");
  }

  return (
    <section className="mt-12 border-t border-border pt-10">
      <h2 className="text-xl font-semibold">Комментарии</h2>

      {comments.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Пока нет комментариев.</p>
      ) : (
        <ul className="mt-6 space-y-6">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              isLoggedIn={!!session?.user}
              reportingId={reportingId}
              reportReason={reportReason}
              onReportOpen={(id) => {
                setReportingId(id);
                setReportReason("");
              }}
              onReportCancel={() => setReportingId(null)}
              onReportReasonChange={setReportReason}
              onReportSubmit={() => void submitReport(comment.id)}
            />
          ))}
        </ul>
      )}

      <div className="mt-8">
        {status === "loading" ? (
          <p className="text-sm text-muted">Загрузка…</p>
        ) : session?.user ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <h3 className="font-medium">Оставить комментарий</h3>
            <p className="text-sm text-muted">
              Вы вошли как{" "}
              <span className="font-medium text-foreground">
                {session.user.name ?? session.user.email}
              </span>
            </p>
            <textarea
              required
              rows={4}
              placeholder="Текст комментария"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            />
            {siteKey ? (
              <Turnstile
                siteKey={siteKey}
                onSuccess={setTurnstileToken}
                onExpire={() => setTurnstileToken(undefined)}
              />
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-60"
            >
              {submitting ? "Отправка…" : "Отправить"}
            </button>
          </form>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted">
              Войдите или зарегистрируйтесь, чтобы комментировать.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={loginHref}
                className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground"
              >
                Войти
              </Link>
              <Link href={registerHref} className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm">
                Регистрация
              </Link>
            </div>
          </div>
        )}
        {statusMessage ? (
          <p className="mt-4 text-sm text-muted" role="status">
            {statusMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function CommentCard({
  comment,
  isLoggedIn,
  reportingId,
  reportReason,
  onReportOpen,
  onReportCancel,
  onReportReasonChange,
  onReportSubmit,
}: {
  comment: CommentItem;
  isLoggedIn: boolean;
  reportingId: string | null;
  reportReason: string;
  onReportOpen: (id: string) => void;
  onReportCancel: () => void;
  onReportReasonChange: (v: string) => void;
  onReportSubmit: () => void;
}) {
  return (
    <li className="rounded-lg border border-border p-4">
      <div className="flex items-start gap-3">
        {comment.authorImage ? (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
            <Image src={comment.authorImage} alt="" fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-sm font-medium">
            {comment.authorName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium">{comment.authorName}</p>
          <time dateTime={toIsoString(comment.createdAt)} className="text-xs text-muted">
            {formatDateRu(comment.createdAt)}
          </time>
          <p className="mt-2 text-sm leading-relaxed">{comment.content}</p>
          {isLoggedIn ? (
            <button
              type="button"
              className="mt-2 text-xs text-muted underline-offset-4 hover:underline"
              onClick={() => onReportOpen(comment.id)}
            >
              Пожаловаться
            </button>
          ) : null}
          {reportingId === comment.id ? (
            <div className="mt-3 space-y-2 rounded-lg border border-border bg-background p-3">
              <textarea
                rows={2}
                placeholder="Причина жалобы"
                value={reportReason}
                onChange={(e) => onReportReasonChange(e.target.value)}
                className="w-full rounded border border-border bg-card px-2 py-1 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onReportSubmit}
                  className="rounded bg-accent px-3 py-1 text-xs text-accent-foreground"
                >
                  Отправить
                </button>
                <button type="button" onClick={onReportCancel} className="text-xs text-muted">
                  Отмена
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {comment.replies.length > 0 ? (
        <ul className="mt-4 space-y-3 border-l-2 border-border pl-4">
          {comment.replies.map((reply) => (
            <li key={reply.id}>
              <p className="text-sm font-medium">{reply.authorName}</p>
              <p className="text-sm text-muted">{reply.content}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
