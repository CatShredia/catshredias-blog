"use client";

import { PostStatus, PostTrackType } from "@prisma/client";
import Link from "next/link";
import { useMemo, useActionState } from "react";

import type { PostFormState } from "@/app/(admin)/admin/posts/actions";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { PostTrackField } from "@/components/admin/post-track-field";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { generatePostSlug } from "@/lib/post-slug";
import {
  defaultPostFormDraft,
  postFormDraftFromPost,
  postFormDraftStorageKey,
  usePostFormDraft,
  type PostFormDraft,
} from "@/lib/post-form-draft";

function preventEnterSubmit(event: React.KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Enter") {
    event.preventDefault();
  }
}

type PostFormPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  trackType: PostTrackType;
  trackAudioUrl: string | null;
  trackTitle: string | null;
  trackArtist: string | null;
  trackCoverImage: string | null;
  trackEmbedSrc: string | null;
  content: string;
  status: PostStatus;
  publishedAt: Date | null;
  categories: { name: string }[];
  tags: { name: string }[];
};

type PostFormProps = {
  mode: "create" | "edit";
  /** id формы — для кнопки submit вне формы (страница редактирования) */
  formId?: string;
  /** Скрыть кнопку внизу формы (submit вынесен на страницу) */
  hideSubmit?: boolean;
  saveAction: (
    prev: PostFormState,
    formData: FormData,
  ) => Promise<PostFormState>;
  /** После ?saved=1 — сбросить черновики и взять данные с сервера */
  syncContentFromServer?: boolean;
  post?: PostFormPost;
};

const initialActionState: PostFormState = {};

export function PostForm({
  mode,
  formId,
  hideSubmit = false,
  post,
  saveAction,
  syncContentFromServer = false,
}: PostFormProps) {
  const [state, action, pending] = useActionState(saveAction, initialActionState);
  const draftKey = post ? `draft-post-${post.id}` : "draft-post-new";
  const metaStorageKey = postFormDraftStorageKey(draftKey);

  const serverFallback = useMemo(
    () =>
      post
        ? postFormDraftFromPost(post)
        : defaultPostFormDraft({ slugTouched: false }),
    [post],
  );

  const { draft, setDraft } = usePostFormDraft(metaStorageKey, serverFallback, {
    syncFromServer: syncContentFromServer,
  });

  function updateDraft(partial: Partial<PostFormDraft>) {
    setDraft(partial);
  }

  return (
    <form id={formId} action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Заголовок</label>
          <input
            name="title"
            required
            value={draft.title}
            onChange={(event) => {
              const title = event.target.value;
              updateDraft({
                title,
                slug: draft.slugTouched ? draft.slug : generatePostSlug(title),
              });
            }}
            onKeyDown={preventEnterSubmit}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Slug</label>
          <input
            name="slug"
            required
            value={draft.slug}
            onChange={(event) => {
              updateDraft({
                slug: event.target.value,
                slugTouched: true,
              });
            }}
            onKeyDown={preventEnterSubmit}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 font-mono text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Краткое описание</label>
        <input
          name="excerpt"
          value={draft.excerpt}
          onChange={(event) => updateDraft({ excerpt: event.target.value })}
          className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
        />
      </div>

      <ImageUploadField
        name="coverImage"
        label="Обложка поста"
        value={draft.coverImage}
        onChange={(coverImage) => updateDraft({ coverImage })}
      />

      <PostTrackField
        value={draft.track}
        onChange={(track) => updateDraft({ track })}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Статус</label>
          <select
            name="status"
            value={draft.status}
            onChange={(event) =>
              updateDraft({ status: event.target.value as PostStatus })
            }
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
            value={draft.publishedAt}
            onChange={(event) =>
              updateDraft({ publishedAt: event.target.value })
            }
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
            value={draft.categories}
            onChange={(event) => updateDraft({ categories: event.target.value })}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
          />
          <p className="mt-1 text-xs text-muted">
            <Link href="/admin/categories" className="text-accent hover:underline">
              Управление категориями
            </Link>
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Теги (через запятую)
          </label>
          <input
            name="tags"
            value={draft.tags}
            onChange={(event) => updateDraft({ tags: event.target.value })}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
          />
          <p className="mt-1 text-xs text-muted">
            <Link href="/admin/tags" className="text-accent hover:underline">
              Управление тегами
            </Link>
          </p>
        </div>
      </div>

      <div>
        <MarkdownEditor
          key={draftKey}
          name="content"
          initialValue={post?.content ?? ""}
          draftKey={draftKey}
          syncFromServerOnMount={syncContentFromServer}
          layout="wide"
        />
        {state.fieldErrors?.content ? (
          <p className="mt-2 text-sm text-red-600">
            {state.fieldErrors.content[0]}
          </p>
        ) : null}
      </div>

      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      <p className="text-xs text-muted">
        Черновик формы и текста сохраняется в браузере при вводе (в том числе после
        ошибки или перезагрузки страницы).
      </p>

      {hideSubmit ? null : (
        <Button type="submit" disabled={pending}>
          {pending
            ? "Сохранение…"
            : mode === "create"
              ? "Создать пост"
              : "Сохранить"}
        </Button>
      )}
    </form>
  );
}
