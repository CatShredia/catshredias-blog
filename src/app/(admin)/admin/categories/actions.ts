"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import {
  listPostsForTaxonomy,
  transferTaxonomyPosts,
} from "@/lib/taxonomy-posts";
import {
  taxonomyFormSchema,
  taxonomyTransferSchema,
  type TaxonomyFormState,
  type TaxonomyTransferState,
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

export async function getCategoryPostsAction(categoryId: string) {
  await requireAdmin();
  return listPostsForTaxonomy("category", categoryId);
}

function revalidateCategoryPaths() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/tags");
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
}

export async function transferCategoryPostsAction(
  _prev: TaxonomyTransferState,
  formData: FormData,
): Promise<TaxonomyTransferState> {
  await requireAdmin();

  const parsed = taxonomyTransferSchema.safeParse({
    sourceId: formData.get("sourceId"),
    targetId: formData.get("targetId") || undefined,
    mode: formData.get("mode"),
    postIds: formData.getAll("postIds").map(String),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Некорректные данные";
    return { error: message };
  }

  const { sourceId, targetId, mode, postIds } = parsed.data;

  try {
    const count = await transferTaxonomyPosts({
      kind: "category",
      sourceId,
      targetId: targetId ?? null,
      mode,
      postIds,
    });
    revalidateCategoryPaths();
    return { success: `Обновлено постов: ${count}` };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Не удалось перенести посты",
    };
  }
}
