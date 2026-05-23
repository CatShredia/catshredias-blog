"use client";

import { BookStatus } from "@prisma/client";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { BOOK_STATUS_LABELS } from "@/lib/validations/book";
import { slugify } from "@/lib/slug";

type BookFormProps = {
  mode: "create" | "edit";
  saveAction: (formData: FormData) => Promise<void>;
  book?: {
    id: string;
    title: string;
    slug: string;
    author: string | null;
    description: string | null;
    coverImage: string | null;
    status: BookStatus;
    rating: number | null;
    tags: { name: string }[];
    reviewPost?: {
      id: string;
      slug: string;
      title: string;
      status: string;
    } | null;
  };
  publishedPosts?: { id: string; title: string; slug: string }[];
  linkReviewAction?: (bookId: string, postId: string) => Promise<void>;
};

export function BookForm({
  mode,
  book,
  saveAction,
  publishedPosts = [],
  linkReviewAction,
}: BookFormProps) {
  const [title, setTitle] = useState(book?.title ?? "");
  const [slug, setSlug] = useState(book?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [coverImage, setCoverImage] = useState(book?.coverImage ?? "");
  const [linkPostId, setLinkPostId] = useState("");

  return (
    <form action={saveAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Название</label>
          <input
            name="title"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Slug</label>
          <input
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 font-mono text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Автор книги</label>
        <input
          name="author"
          defaultValue={book?.author ?? ""}
          className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Описание</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={book?.description ?? ""}
          className="w-full rounded-lg border border-border bg-card px-3 py-2"
        />
      </div>

      <ImageUploadField
        name="coverImage"
        label="Обложка"
        value={coverImage}
        onChange={setCoverImage}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Статус</label>
          <select
            name="status"
            defaultValue={book?.status ?? BookStatus.PLANNED}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
          >
            {Object.entries(BOOK_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Рейтинг (1–5)</label>
          <select
            name="rating"
            defaultValue={book?.rating?.toString() ?? ""}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
          >
            <option value="">Без оценки</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} ★
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Теги (через запятую)</label>
        <input
          name="tags"
          defaultValue={book?.tags.map((t) => t.name).join(", ") ?? ""}
          placeholder="фантастика, классика"
          className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
        />
      </div>

      {mode === "edit" && book ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-medium">Отзыв (пост в блоге)</h3>
          {book.reviewPost ? (
            <p className="mt-2 text-sm text-muted">
              Связан:{" "}
              <Link href={`/blog/${book.reviewPost.slug}`} className="text-accent underline">
                {book.reviewPost.title}
              </Link>
            </p>
          ) : linkReviewAction && publishedPosts.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <select
                value={linkPostId}
                onChange={(e) => setLinkPostId(e.target.value)}
                className="min-h-11 flex-1 rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="">Выберите опубликованный пост</option>
                {publishedPosts.map((post) => (
                  <option key={post.id} value={post.id}>
                    {post.title}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="secondary"
                disabled={!linkPostId}
                onClick={() => linkPostId && void linkReviewAction(book.id, linkPostId)}
              >
                Привязать
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Создайте и опубликуйте пост в блоге, затем привяжите его здесь.
            </p>
          )}
        </div>
      ) : null}

      <Button type="submit">{mode === "create" ? "Добавить книгу" : "Сохранить"}</Button>
    </form>
  );
}
