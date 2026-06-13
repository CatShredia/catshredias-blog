import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  deleteProjectAction,
  updateProjectAction,
} from "@/app/(admin)/admin/projects/actions";
import { ProjectForm } from "@/components/admin/project-form";
import { Button } from "@/components/ui/button";
import { AdminContainer } from "@/components/ui/admin-container";
import { getAdminProject } from "@/lib/queries/admin";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getAdminProject(id);
  if (!project) return { title: "Редактирование проекта" };
  return { title: `Редактирование: ${project.title}` };
}

export default async function EditProjectPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const project = await getAdminProject(id);
  if (!project) notFound();

  const updateAction = updateProjectAction.bind(null, id);

  return (
    <AdminContainer className="py-6">
      <Link
        href="/admin/projects"
        className="text-sm text-muted hover:text-foreground"
      >
        ← К списку проектов
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Редактирование проекта</h1>
      {query.saved ? (
        <p className="mt-2 text-sm text-muted" role="status">
          Сохранено.
        </p>
      ) : null}

      <div className="mt-8">
        <ProjectForm mode="edit" project={project} saveAction={updateAction} />
      </div>

      <form action={deleteProjectAction.bind(null, id)} className="mt-8">
        <Button type="submit" variant="ghost">
          Удалить проект
        </Button>
      </form>
    </AdminContainer>
  );
}
