"use client";

import { PostStatus } from "@prisma/client";
import { useState } from "react";

import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/slug";

type PostFormProps = {
  mode: "create" | "edit";
  saveAction: (formData: FormData) => Promise<void>;
  post?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    status: PostStatus;
    publishedAt: Date | null;
    categories: { name: string }[];
    tags: { name: string }[];
  };
};

export function PostForm({ mode, post, saveAction }: PostFormProps) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  const draftKey = post ? `draft-post-${post.id}` : "draft-post-new";

  const publishedAtDefault = post?.publishedAt
    ? new Date(post.publishedAt).toISOString().slice(0, 16)
    : "";

  return (
    <form action={saveAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Заголовок</label>
          <input
            name="title"
            required
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (!slugTouched) {
                setSlug(slugify(event.target.value));
              }
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
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 font-mono text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Краткое описание</label>
        <input
          name="excerpt"
          defaultValue={post?.excerpt ?? ""}
          className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Статус</label>
          <select
            name="status"
            defaultValue={post?.status ?? PostStatus.DRAFT}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
          >
            <option value={PostStatus.DRAFT}>Черновик</option>
            <option value={PostStatus.PUBLISHED}>Опубликовано</option>
            <option value={PostStatus.SCHEDULED}>Запланировано</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Дата публикации
          </label>
          <input
            type="datetime-local"
            name="publishedAt"
            defaultValue={publishedAtDefault}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
          />
          <p className="mt-1 text-xs text-muted">
            Для «Запланировано» — дата в будущем. Для «Опубликовано» — пусто =
            сейчас.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Категории (через запятую)
          </label>
          <input
            name="categories"
            defaultValue={post?.categories.map((c) => c.name).join(", ") ?? ""}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Теги (через запятую)
          </label>
          <input
            name="tags"
            defaultValue={post?.tags.map((t) => t.name).join(", ") ?? ""}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
          />
        </div>
      </div>

      <MarkdownEditor
        name="content"
        initialValue={post?.content ?? ""}
        draftKey={draftKey}
      />

      <Button type="submit">
        {mode === "create" ? "Создать пост" : "Сохранить"}
      </Button>
    </form>
  );
}
