import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { routeSlugCandidates } from "@/lib/slug";

const projectListSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  stack: true,
  roles: true,
  repoUrl: true,
  demoUrl: true,
} satisfies Prisma.ProjectSelect;

export type ProjectListItem = Prisma.ProjectGetPayload<{
  select: typeof projectListSelect;
}>;

export async function listProjects(filters?: {
  tech?: string;
  role?: string;
}) {
  return prisma.project.findMany({
    where: {
      ...(filters?.tech ? { stack: { has: filters.tech } } : {}),
      ...(filters?.role ? { roles: { has: filters.role } } : {}),
    },
    select: projectListSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function getProjectBySlug(slug: string) {
  for (const candidate of routeSlugCandidates(slug)) {
    const project = await prisma.project.findUnique({ where: { slug: candidate } });
    if (project) return project;
  }
  return null;
}

export async function getProjectSlugs() {
  return prisma.project.findMany({ select: { slug: true } });
}

export async function listProjectFilters() {
  const projects = await prisma.project.findMany({
    select: { stack: true, roles: true },
  });
  const stack = new Set<string>();
  const roles = new Set<string>();
  for (const project of projects) {
    project.stack.forEach((item) => stack.add(item));
    project.roles.forEach((item) => roles.add(item));
  }
  return {
    technologies: [...stack].sort(),
    roles: [...roles].sort(),
  };
}
