import Link from "next/link";

import { createProjectAction } from "@/app/(admin)/admin/projects/actions";
import { ProjectForm } from "@/components/admin/project-form";
import { AdminContainer } from "@/components/ui/admin-container";

export default function NewProjectPage() {
  return (
    <AdminContainer className="py-6">
      <Link
        href="/admin/projects"
        className="text-sm text-muted hover:text-foreground"
      >
        ← К списку проектов
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Новый проект</h1>
      <div className="mt-8">
        <ProjectForm mode="create" saveAction={createProjectAction} />
      </div>
    </AdminContainer>
  );
}
