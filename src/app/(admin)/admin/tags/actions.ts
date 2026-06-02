"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import {
  taxonomyFormSchema,
  type TaxonomyFormState,
} from "@/lib/validations/taxonomy";

export async function createTagAction(
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

  const existing = await prisma.tag.findFirst({
    where: { OR: [{ slug }, { name }] },
  });
  if (existing) {
    return { error: "Тег с таким названием уже есть" };
  }

  await prisma.tag.create({ data: { name, slug } });
  revalidatePath("/admin/tags");
  revalidatePath("/blog");
  return {};
}

export async function updateTagAction(
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

  const conflict = await prisma.tag.findFirst({
    where: { OR: [{ slug }, { name }], NOT: { id } },
  });
  if (conflict) {
    return { error: "Тег с таким названием уже есть" };
  }

  await prisma.tag.update({ where: { id }, data: { name, slug } });
  revalidatePath("/admin/tags");
  revalidatePath("/blog");
  return {};
}

export async function deleteTagAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const tag = await prisma.tag.findUnique({
    where: { id },
    include: { _count: { select: { posts: true } } },
  });
  if (!tag) return;

  if (tag._count.posts > 0) {
    throw new Error(
      `Нельзя удалить: тег используется в ${tag._count.posts} постах`,
    );
  }

  await prisma.tag.delete({ where: { id } });
  revalidatePath("/admin/tags");
  revalidatePath("/blog");
}
