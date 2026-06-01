import { AdminProjectsTable } from "@/components/admin/admin-projects-table";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { listAdminProjects } from "@/lib/queries/admin";

export default async function AdminProjectsPage() {
  const projects = await listAdminProjects();

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Проекты</h1>
        <ButtonLink href="/admin/projects/new">Новый проект</ButtonLink>
      </div>

      <AdminProjectsTable
        projects={projects.map((project) => ({
          id: project.id,
          title: project.title,
          slug: project.slug,
          stack: project.stack,
          updatedAt: project.updatedAt.toISOString(),
        }))}
      />
    </Container>
  );
}
