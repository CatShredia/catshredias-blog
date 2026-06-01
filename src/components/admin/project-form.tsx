"use client";

import { useState } from "react";

import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { Button } from "@/components/ui/button";
import { generatePostSlug } from "@/lib/post-slug";

function preventEnterSubmit(event: React.KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Enter") {
    event.preventDefault();
  }
}

type ProjectFormProps = {
  mode: "create" | "edit";
  saveAction: (formData: FormData) => Promise<void>;
  project?: {
    id: string;
    title: string;
    slug: string;
    description: string;
    problem: string | null;
    solution: string | null;
    result: string | null;
    stack: string[];
    roles: string[];
    repoUrl: string | null;
    demoUrl: string | null;
  };
};

export function ProjectForm({ mode, project, saveAction }: ProjectFormProps) {
  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

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
            onKeyDown={preventEnterSubmit}
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
            onKeyDown={preventEnterSubmit}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 font-mono text-sm"
          />
        </div>
      </div>

      <MarkdownEditor
        key={
          project ? `draft-project-description-${project.id}` : "draft-project-description-new"
        }
        name="description"
        label="Описание (Markdown) *"
        required
        initialValue={project?.description ?? ""}
        draftKey={
          project ? `draft-project-description-${project.id}` : "draft-project-description-new"
        }
        resetDraftOnMount={mode === "create"}
      />

      <MarkdownEditor
        key={project ? `draft-project-problem-${project.id}` : "draft-project-problem-new"}
        name="problem"
        label="Проблема (Markdown, необязательно)"
        initialValue={project?.problem ?? ""}
        draftKey={project ? `draft-project-problem-${project.id}` : "draft-project-problem-new"}
      />

      <MarkdownEditor
        key={
          project ? `draft-project-solution-${project.id}` : "draft-project-solution-new"
        }
        name="solution"
        label="Решение (Markdown, необязательно)"
        initialValue={project?.solution ?? ""}
        draftKey={
          project ? `draft-project-solution-${project.id}` : "draft-project-solution-new"
        }
      />

      <MarkdownEditor
        key={project ? `draft-project-result-${project.id}` : "draft-project-result-new"}
        name="result"
        label="Результат (Markdown, необязательно)"
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

      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <Button type="submit">
        {mode === "create" ? "Создать проект" : "Сохранить"}
      </Button>
    </form>
  );
}
