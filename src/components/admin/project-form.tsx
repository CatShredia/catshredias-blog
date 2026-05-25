"use client";

import { useState } from "react";

import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { Button } from "@/components/ui/button";
import { generatePostSlug } from "@/lib/post-slug";

type ProjectFormProps = {
  mode: "create" | "edit";
  saveAction: (formData: FormData) => Promise<void>;
  project?: {
    id: string;
    title: string;
    slug: string;
    description: string;
    problem: string;
    solution: string;
    result: string;
    stack: string[];
    roles: string[];
    repoUrl: string | null;
    demoUrl: string | null;
    hhUrl: string | null;
    resumePdf: string | null;
    screenshots: string[];
  };
};

export function ProjectForm({ mode, project, saveAction }: ProjectFormProps) {
  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [resumePdf, setResumePdf] = useState(project?.resumePdf ?? "");
  const [screenshots, setScreenshots] = useState(
    project?.screenshots.join(", ") ?? "",
  );
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function uploadAsset(file: File, target: "resume" | "screenshots") {
    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    setUploading(false);

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setMessage(data.error ?? "Ошибка загрузки");
      return;
    }

    const data = (await response.json()) as { url: string };
    if (target === "resume") {
      setResumePdf(data.url);
    } else {
      setScreenshots((prev) => (prev ? `${prev}, ${data.url}` : data.url));
    }
    setMessage("Файл загружен");
  }

  return (
    <form action={saveAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Название</label>
          <input
            name="title"
            required
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (!slugTouched) setSlug(generatePostSlug(event.target.value));
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
        <label className="mb-1 block text-sm font-medium">Описание</label>
        <textarea
          name="description"
          required
          rows={3}
          defaultValue={project?.description ?? ""}
          className="w-full rounded-lg border border-border bg-card px-3 py-2"
        />
      </div>

      <MarkdownEditor
        name="problem"
        label="Проблема (Markdown)"
        initialValue={project?.problem ?? ""}
        draftKey={project ? `draft-project-problem-${project.id}` : "draft-project-problem-new"}
      />

      <MarkdownEditor
        name="solution"
        label="Решение (Markdown)"
        initialValue={project?.solution ?? ""}
        draftKey={project ? `draft-project-solution-${project.id}` : "draft-project-solution-new"}
      />

      <MarkdownEditor
        name="result"
        label="Результат (Markdown)"
        initialValue={project?.result ?? ""}
        draftKey={project ? `draft-project-result-${project.id}` : "draft-project-result-new"}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Стек</label>
          <input
            name="stack"
            required
            defaultValue={project?.stack.join(", ") ?? ""}
            placeholder="Next.js, PostgreSQL"
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Роли</label>
          <input
            name="roles"
            required
            defaultValue={project?.roles.join(", ") ?? ""}
            placeholder="Full-stack, DevOps"
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">GitHub</label>
          <input
            name="repoUrl"
            type="url"
            defaultValue={project?.repoUrl ?? ""}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Демо</label>
          <input
            name="demoUrl"
            type="url"
            defaultValue={project?.demoUrl ?? ""}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">hh.ru</label>
          <input
            name="hhUrl"
            type="url"
            defaultValue={project?.hhUrl ?? ""}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Резюме PDF (URL)</label>
        <input
          name="resumePdf"
          value={resumePdf}
          onChange={(event) => setResumePdf(event.target.value)}
          className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
        />
        <label className="mt-2 inline-block cursor-pointer text-xs text-accent underline">
          {uploading ? "Загрузка…" : "Загрузить PDF"}
          <input
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadAsset(file, "resume");
            }}
          />
        </label>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Скриншоты (URL через запятую)
        </label>
        <input
          name="screenshots"
          value={screenshots}
          onChange={(event) => setScreenshots(event.target.value)}
          className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
        />
        <label className="mt-2 inline-block cursor-pointer text-xs text-accent underline">
          Добавить изображение
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadAsset(file, "screenshots");
            }}
          />
        </label>
      </div>

      {message ? <p className="text-xs text-muted">{message}</p> : null}

      <Button type="submit">
        {mode === "create" ? "Создать проект" : "Сохранить"}
      </Button>
    </form>
  );
}
