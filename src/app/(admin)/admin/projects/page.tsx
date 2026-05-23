import Link from "next/link";

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

      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-card">
            <tr>
              <th className="px-4 py-3 font-medium">Название</th>
              <th className="px-4 py-3 font-medium">Стек</th>
              <th className="px-4 py-3 font-medium">Обновлён</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-muted">
                  Проектов пока нет.
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{project.title}</p>
                    <p className="text-xs text-muted">/{project.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {project.stack.slice(0, 3).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {project.updatedAt.toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/projects/${project.id}/edit`}
                      className="text-accent underline-offset-4 hover:underline"
                    >
                      Редактировать
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
