"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import {
  taxonomyFormSchema,
  type TaxonomyFormState,
} from "@/lib/validations/taxonomy";

export async function createCategoryAction(
  _prev: TaxonomyFormState,
  formData: FormData,
): Promise<TaxonomyFormState> {
  await requireAdmin();
  const parsed = taxonomyFormSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const name = parsed.data.name.trim();
  const slug = slugify(name) || name.toLowerCase();

  const existing = await prisma.category.findFirst({
    where: { OR: [{ slug }, { name }] },
  });
  if (existing) {
    return { error: "Категория с таким названием уже есть" };
  }

  await prisma.category.create({ data: { name, slug } });
  revalidatePath("/admin/categories");
  revalidatePath("/blog");
  return {};
}

export async function updateCategoryAction(
  id: string,
  _prev: TaxonomyFormState,
  formData: FormData,
): Promise<TaxonomyFormState> {
  await requireAdmin();
  const parsed = taxonomyFormSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const name = parsed.data.name.trim();
  const slug = slugify(name) || name.toLowerCase();

  const conflict = await prisma.category.findFirst({
    where: { OR: [{ slug }, { name }], NOT: { id } },
  });
  if (conflict) {
    return { error: "Категория с таким названием уже есть" };
  }

  await prisma.category.update({ where: { id }, data: { name, slug } });
  revalidatePath("/admin/categories");
  revalidatePath("/blog");
  return {};
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { posts: true } } },
  });
  if (!category) return;

  if (category._count.posts > 0) {
    throw new Error(
      `Нельзя удалить: категория используется в ${category._count.posts} постах`,
    );
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/blog");
}
