import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const adminProjectListSelect = {
  id: true,
  title: true,
  slug: true,
  stack: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

const adminProjectDetailSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  problem: true,
  solution: true,
  result: true,
  stack: true,
  roles: true,
  repoUrl: true,
  demoUrl: true,
} satisfies Prisma.ProjectSelect;

export type AdminProjectDetail = Prisma.ProjectGetPayload<{
  select: typeof adminProjectDetailSelect;
}>;

export async function listAdminPosts() {
  return prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      categories: { select: { name: true } },
      tags: { select: { name: true } },
    },
  });
}

export async function getAdminPost(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: { categories: true, tags: true },
  });
}

export async function listAdminProjects() {
  return prisma.project.findMany({
    select: adminProjectListSelect,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getAdminProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    select: adminProjectDetailSelect,
  });
}

export async function upsertCategories(names: string[]) {
  const ids: string[] = [];
  for (const name of names) {
    const slug = slugify(name) || name.toLowerCase();
    const row = await prisma.category.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    ids.push(row.id);
  }
  return ids;
}

export async function listAdminCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });
}

export async function listAdminTags() {
  return prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });
}

export async function upsertTags(names: string[]) {
  const ids: string[] = [];
  for (const name of names) {
    const slug = slugify(name) || name.toLowerCase();
    const row = await prisma.tag.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    ids.push(row.id);
  }
  return ids;
}

export function resolvePublishedAt(
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED",
  publishedAtRaw?: string,
) {
  if (status === "DRAFT") return null;
  const date = publishedAtRaw ? new Date(publishedAtRaw) : new Date();
  if (Number.isNaN(date.getTime())) {
    throw new Error("Некорректная дата публикации");
  }
  if (status === "SCHEDULED" && date <= new Date()) {
    throw new Error("Для отложенной публикации укажите дату в будущем");
  }
  return date;
}
