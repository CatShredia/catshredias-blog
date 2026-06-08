"use client";

import { BookStatus } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { StarRatingInput } from "@/components/ui/star-rating";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { BOOK_STATUS_LABELS } from "@/lib/validations/book";
import { toDateInputValue } from "@/lib/dates";
import { generatePostSlug } from "@/lib/post-slug";
import { blogPostPath } from "@/lib/slug";

type BookFormProps = {
  mode: "create" | "edit";
  /** id формы — для кнопки submit вне формы (страница редактирования) */
  formId?: string;
  /** Скрыть кнопку внизу формы (submit вынесен на страницу) */
  hideSubmit?: boolean;
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
    readAt: Date | null;
    tags: { name: string }[];
    reviewPost?: {
      id: string;
      slug: string;
      title: string;
      status: string;
    } | null;
  };
  publishedPosts?: { id: string; title: string; slug: string }[];
  linkReviewAction?: (postId: string) => Promise<void>;
};

export function BookForm({
  mode,
  formId,
  hideSubmit = false,
  book,
  saveAction,
  publishedPosts = [],
  linkReviewAction,
}: BookFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(book?.title ?? "");
  const [slug, setSlug] = useState(book?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [coverImage, setCoverImage] = useState(book?.coverImage ?? "");
  const [linkPostId, setLinkPostId] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);

  return (
    <form id={formId} action={saveAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Название</label>
          <input
            name="title"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(generatePostSlug(e.target.value));
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

      <MarkdownEditor
        key={book ? `draft-book-description-${book.id}` : "draft-book-description-new"}
        name="description"
        label="Описание (Markdown)"
        initialValue={book?.description ?? ""}
        draftKey={
          book ? `draft-book-description-${book.id}` : "draft-book-description-new"
        }
      />

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
          <label className="mb-1 block text-sm font-medium">Рейтинг</label>
          <StarRatingInput name="rating" defaultValue={book?.rating} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Дата прочтения</label>
        <input
          type="date"
          name="readAt"
          defaultValue={toDateInputValue(book?.readAt)}
          className="min-h-11 w-full max-w-xs rounded-lg border border-border bg-card px-3"
        />
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
              <Link href={blogPostPath(book.reviewPost.slug)} className="text-accent underline">
                {book.reviewPost.title}
              </Link>
            </p>
          ) : linkReviewAction && publishedPosts.length > 0 ? (
            <>
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
                  disabled={!linkPostId || linking}
                  onClick={() => {
                    if (!linkPostId || !linkReviewAction) return;
                    setLinking(true);
                    setLinkMessage(null);
                    void linkReviewAction(linkPostId)
                      .then(() => {
                        setLinkPostId("");
                        router.refresh();
                      })
                      .catch((error: unknown) => {
                        setLinkMessage(
                          error instanceof Error
                            ? error.message
                            : "Не удалось привязать пост",
                        );
                      })
                      .finally(() => setLinking(false));
                  }}
                >
                  {linking ? "Привязка…" : "Привязать"}
                </Button>
              </div>
              {linkMessage ? (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {linkMessage}
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Создайте и опубликуйте пост в блоге, затем привяжите его здесь.
            </p>
          )}
        </div>
      ) : null}

      {hideSubmit ? null : (
        <Button type="submit">
          {mode === "create" ? "Добавить книгу" : "Сохранить"}
        </Button>
      )}
    </form>
  );
}
