"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { SafeImage } from "@/components/ui/safe-image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { MAX_COMMENT_DEPTH } from "@/lib/comments-tree";
import { DELETED_USER_DISPLAY_NAME } from "@/lib/deleted-user";
import { formatDateRu, toIsoString } from "@/lib/dates";

export type CommentItem = {
  id: string;
  authorName: string;
  authorImage?: string | null;
  content: string;
  createdAt: Date | string;
  replies: CommentItem[];
};

function addReplyToTree(
  comments: CommentItem[],
  parentId: string,
  reply: CommentItem,
): CommentItem[] {
  return comments.map((comment) => {
    if (comment.id === parentId) {
      return { ...comment, replies: [...comment.replies, reply] };
    }
    if (comment.replies.length > 0) {
      return {
        ...comment,
        replies: addReplyToTree(comment.replies, parentId, reply),
      };
    }
    return comment;
  });
}

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

  async function submitComment(payload: {
    content: string;
    parentId?: string;
    turnstileToken?: string;
  }) {
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId,
        content: payload.content,
        parentId: payload.parentId,
        turnstileToken: payload.turnstileToken,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      throw new Error(data.error ?? "Ошибка отправки");
    }

    return (await response.json()) as {
      comment: CommentItem;
      message: string;
    };
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.user) return;

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const data = await submitComment({ content, turnstileToken });
      setComments((prev) => [...prev, data.comment]);
      setContent("");
      setTurnstileToken(undefined);
      setStatusMessage(data.message);
      router.refresh();
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Ошибка отправки",
      );
    } finally {
      setSubmitting(false);
    }
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
        <ul className="mt-6 space-y-4">
          {comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              depth={1}
              isLoggedIn={!!session?.user}
              siteKey={siteKey}
              reportingId={reportingId}
              reportReason={reportReason}
              onReportOpen={(id) => {
                setReportingId(id);
                setReportReason("");
              }}
              onReportCancel={() => setReportingId(null)}
              onReportReasonChange={setReportReason}
              onReportSubmit={submitReport}
              onReply={async (parentId, replyContent, token) => {
                const data = await submitComment({
                  content: replyContent,
                  parentId,
                  turnstileToken: token,
                });
                setComments((prev) =>
                  addReplyToTree(prev, parentId, data.comment),
                );
                setStatusMessage(data.message);
                router.refresh();
              }}
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
              <Link
                href={registerHref}
                className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm"
              >
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

function CommentAvatar({
  authorName,
  authorImage,
  sizeClass,
}: {
  authorName: string;
  authorImage?: string | null;
  sizeClass: string;
}) {
  const isDeleted = authorName === DELETED_USER_DISPLAY_NAME;

  if (!isDeleted && authorImage) {
    return (
      <div
        className={`relative ${sizeClass} shrink-0 overflow-hidden rounded-full ring-2 ring-background`}
      >
        <SafeImage src={authorImage} alt="" fill />
      </div>
    );
  }

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full ring-2 ring-background ${
        isDeleted
          ? "bg-muted text-muted"
          : "bg-accent/15 font-medium text-accent"
      }`}
      aria-hidden
    >
      {isDeleted ? (
        <svg
          viewBox="0 0 24 24"
          className="h-1/2 w-1/2 opacity-70"
          fill="currentColor"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      ) : (
        authorName.charAt(0).toUpperCase()
      )}
    </div>
  );
}

function CommentThread({
  comment,
  depth,
  isLoggedIn,
  siteKey,
  reportingId,
  reportReason,
  onReportOpen,
  onReportCancel,
  onReportReasonChange,
  onReportSubmit,
  onReply,
}: {
  comment: CommentItem;
  depth: number;
  isLoggedIn: boolean;
  siteKey?: string;
  reportingId: string | null;
  reportReason: string;
  onReportOpen: (id: string) => void;
  onReportCancel: () => void;
  onReportReasonChange: (v: string) => void;
  onReportSubmit: (id: string) => void | Promise<void>;
  onReply: (
    parentId: string,
    content: string,
    turnstileToken?: string,
  ) => Promise<void>;
}) {
  const canReply = isLoggedIn && depth < MAX_COMMENT_DEPTH;
  const nestStyles = [
    "",
    "ml-3 border-l-2 border-accent/25 pl-4 sm:ml-4",
    "ml-3 border-l-2 border-border pl-4 sm:ml-3",
    "ml-3 border-l-2 border-border/80 pl-4 sm:ml-3",
    "ml-3 border-l border-border/60 pl-3 sm:ml-2",
    "ml-2 border-l border-dashed border-border/50 pl-3 sm:ml-2",
  ];
  const cardStyles = [
    "rounded-xl border border-border bg-card p-4 shadow-sm",
    "rounded-lg border border-border/90 bg-card/95 p-3",
    "rounded-lg border border-border/80 bg-background p-3",
    "rounded-md border border-border/70 bg-background p-3",
    "rounded-md bg-card/50 p-2.5",
    "rounded-md bg-card/30 p-2.5",
  ];
  const styleIndex = Math.min(depth - 1, nestStyles.length - 1);
  const avatarSize =
    depth === 1 ? "h-10 w-10 text-sm" : depth === 2 ? "h-9 w-9 text-xs" : "h-8 w-8 text-xs";

  return (
    <li className={depth > 1 ? nestStyles[styleIndex] : undefined}>
      <article className={cardStyles[styleIndex]}>
        <div className="flex items-start gap-3">
          <CommentAvatar
            authorName={comment.authorName}
            authorImage={comment.authorImage}
            sizeClass={avatarSize}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p
              className={`font-medium ${
                comment.authorName === DELETED_USER_DISPLAY_NAME
                  ? "text-muted italic"
                  : ""
              }`}
            >
              {comment.authorName}
            </p>
            </div>
            <time
              dateTime={toIsoString(comment.createdAt)}
              className="text-xs text-muted"
            >
              {formatDateRu(comment.createdAt)}
            </time>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {isLoggedIn ? (
                <button
                  type="button"
                  className="text-xs text-muted underline-offset-4 hover:underline"
                  onClick={() => onReportOpen(comment.id)}
                >
                  Пожаловаться
                </button>
              ) : null}
            </div>
            {canReply ? (
              <ReplyForm
                parentId={comment.id}
                siteKey={siteKey}
                onSubmit={onReply}
              />
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
                    onClick={() => void onReportSubmit(comment.id)}
                    className="rounded bg-accent px-3 py-1 text-xs text-accent-foreground"
                  >
                    Отправить
                  </button>
                  <button
                    type="button"
                    onClick={onReportCancel}
                    className="text-xs text-muted"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </article>

      {comment.replies.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              isLoggedIn={isLoggedIn}
              siteKey={siteKey}
              reportingId={reportingId}
              reportReason={reportReason}
              onReportOpen={onReportOpen}
              onReportCancel={onReportCancel}
              onReportReasonChange={onReportReasonChange}
              onReportSubmit={onReportSubmit}
              onReply={onReply}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function ReplyForm({
  parentId,
  siteKey,
  onSubmit,
}: {
  parentId: string;
  siteKey?: string;
  onSubmit: (
    parentId: string,
    content: string,
    turnstileToken?: string,
  ) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [token, setToken] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        className="text-xs font-medium text-accent hover:underline"
        onClick={() => setOpen(true)}
      >
        Ответить
      </button>
    );
  }

  return (
    <form
      className="mt-3 w-full space-y-2 rounded-lg border border-border/80 bg-background p-3"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);
        void onSubmit(parentId, content, token)
          .then(() => {
            setContent("");
            setToken(undefined);
            setOpen(false);
          })
          .catch((err: unknown) => {
            setError(err instanceof Error ? err.message : "Ошибка отправки");
          })
          .finally(() => setSubmitting(false));
      }}
    >
      <textarea
        required
        rows={3}
        placeholder="Ваш ответ"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
      />
      {siteKey ? (
        <Turnstile
          siteKey={siteKey}
          onSuccess={setToken}
          onExpire={() => setToken(undefined)}
        />
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-60"
        >
          {submitting ? "Отправка…" : "Отправить ответ"}
        </button>
        <button
          type="button"
          className="text-xs text-muted"
          onClick={() => {
            setOpen(false);
            setContent("");
            setError(null);
          }}
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
