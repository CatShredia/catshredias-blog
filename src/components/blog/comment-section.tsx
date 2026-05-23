"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useState } from "react";

type Comment = {
  id: string;
  authorName: string;
  content: string;
  createdAt: Date;
  replies: {
    id: string;
    authorName: string;
    content: string;
    createdAt: Date;
  }[];
};

export function CommentSection({
  postId,
  comments,
}: {
  postId: string;
  comments: Comment[];
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string>();
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId,
        authorName,
        authorEmail,
        content,
        turnstileToken,
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setStatus(data.error ?? "Ошибка отправки");
      return;
    }

    setAuthorName("");
    setAuthorEmail("");
    setContent("");
    setTurnstileToken(undefined);
    setStatus("Комментарий отправлен на модерацию. Спасибо!");
  }

  return (
    <section className="mt-12 border-t border-border pt-10">
      <h2 className="text-xl font-semibold">Комментарии</h2>

      {comments.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Пока нет комментариев.</p>
      ) : (
        <ul className="mt-6 space-y-6">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-lg border border-border p-4">
              <p className="font-medium">{comment.authorName}</p>
              <time
                dateTime={comment.createdAt.toISOString()}
                className="text-xs text-muted"
              >
                {comment.createdAt.toLocaleDateString("ru-RU")}
              </time>
              <p className="mt-2 text-sm leading-relaxed">{comment.content}</p>
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
          ))}
        </ul>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <h3 className="font-medium">Оставить комментарий</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="Имя"
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={authorEmail}
            onChange={(event) => setAuthorEmail(event.target.value)}
            className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm"
          />
        </div>
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
        ) : (
          <p className="text-xs text-muted">
            Turnstile не настроен — в dev комментарии принимаются без капчи.
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {submitting ? "Отправка…" : "Отправить"}
        </button>
        {status ? (
          <p className="text-sm text-muted" role="status">
            {status}
          </p>
        ) : null}
      </form>
    </section>
  );
}
