"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { uniqueSlugWithSuffix } from "@/lib/post-slug";
import { slugify } from "@/lib/slug";
import {
  parseCommaList,
  projectFormSchema,
} from "@/lib/validations/project";

function parseFormData(formData: FormData) {
  return projectFormSchema.parse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    problem: formData.get("problem"),
    solution: formData.get("solution"),
    result: formData.get("result"),
    stack: formData.get("stack"),
    roles: formData.get("roles"),
    repoUrl: formData.get("repoUrl") || "",
    demoUrl: formData.get("demoUrl") || "",
  });
}

function emptyToNull(value?: string) {
  return value && value.length > 0 ? value : null;
}

export async function createProjectAction(formData: FormData) {
  await requireAdmin();
  const data = parseFormData(formData);
  const slug = await uniqueSlugWithSuffix(
    data.slug || data.title,
    async (candidate) => !!(await prisma.project.findUnique({ where: { slug: candidate } })),
    "project",
  );

  const project = await prisma.project.create({
    data: {
      title: data.title,
      slug,
      description: data.description,
      problem: data.problem,
      solution: data.solution,
      result: data.result,
      stack: parseCommaList(data.stack),
      roles: parseCommaList(data.roles),
      repoUrl: emptyToNull(data.repoUrl),
      demoUrl: emptyToNull(data.demoUrl),
    },
  });

  revalidatePath("/portfolio");
  revalidatePath("/admin/projects");
  redirect(`/admin/projects/${project.id}/edit?saved=1`);
}

export async function updateProjectAction(id: string, formData: FormData) {
  await requireAdmin();
  const data = parseFormData(formData);
  const slug = slugify(data.slug) || slugify(data.title);

  const existing = await prisma.project.findFirst({
    where: { slug, NOT: { id } },
  });
  if (existing) {
    throw new Error("Проект с таким slug уже существует");
  }

  await prisma.project.update({
    where: { id },
    data: {
      title: data.title,
      slug,
      description: data.description,
      problem: data.problem,
      solution: data.solution,
      result: data.result,
      stack: parseCommaList(data.stack),
      roles: parseCommaList(data.roles),
      repoUrl: emptyToNull(data.repoUrl),
      demoUrl: emptyToNull(data.demoUrl),
    },
  });

  revalidatePath("/portfolio");
  revalidatePath(`/portfolio/${slug}`);
  revalidatePath("/admin/projects");
  redirect(`/admin/projects/${id}/edit?saved=1`);
}

export async function deleteProjectAction(id: string) {
  await requireAdmin();
  await prisma.project.delete({ where: { id } });
  revalidatePath("/portfolio");
  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}
