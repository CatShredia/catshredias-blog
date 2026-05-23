"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  resolvePublishedAt,
  upsertCategories,
  upsertTags,
} from "@/lib/queries/admin";
import { slugify } from "@/lib/slug";
import {
  parseCommaList,
  postFormSchema,
} from "@/lib/validations/post";

function parseFormData(formData: FormData) {
  return postFormSchema.parse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt") || undefined,
    content: formData.get("content"),
    status: formData.get("status"),
    publishedAt: formData.get("publishedAt") || undefined,
    categories: formData.get("categories") || undefined,
    tags: formData.get("tags") || undefined,
  });
}

export async function createPostAction(formData: FormData) {
  const session = await requireAdmin();
  const data = parseFormData(formData);
  const slug = slugify(data.slug) || slugify(data.title);

  const existing = await prisma.post.findUnique({ where: { slug } });
  if (existing) {
    throw new Error("Пост с таким slug уже существует");
  }

  const categoryIds = await upsertCategories(parseCommaList(data.categories));
  const tagIds = await upsertTags(parseCommaList(data.tags));
  const publishedAt = resolvePublishedAt(data.status, data.publishedAt);

  const post = await prisma.post.create({
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      status: data.status,
      publishedAt,
      authorId: session.user.id,
      categories: { connect: categoryIds.map((id) => ({ id })) },
      tags: { connect: tagIds.map((id) => ({ id })) },
    },
  });

  revalidatePath("/blog");
  revalidatePath("/admin/posts");
  redirect(`/admin/posts/${post.id}/edit?saved=1`);
}

export async function updatePostAction(id: string, formData: FormData) {
  await requireAdmin();
  const data = parseFormData(formData);
  const slug = slugify(data.slug) || slugify(data.title);

  const existing = await prisma.post.findFirst({
    where: { slug, NOT: { id } },
  });
  if (existing) {
    throw new Error("Пост с таким slug уже существует");
  }

  const categoryIds = await upsertCategories(parseCommaList(data.categories));
  const tagIds = await upsertTags(parseCommaList(data.tags));
  const publishedAt = resolvePublishedAt(data.status, data.publishedAt);

  await prisma.post.update({
    where: { id },
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      status: data.status,
      publishedAt,
      categories: { set: categoryIds.map((cid) => ({ id: cid })) },
      tags: { set: tagIds.map((tid) => ({ id: tid })) },
    },
  });

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/posts");
  redirect(`/admin/posts/${id}/edit?saved=1`);
}

export async function deletePostAction(id: string) {
  await requireAdmin();
  await prisma.post.delete({ where: { id } });
  revalidatePath("/blog");
  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}
