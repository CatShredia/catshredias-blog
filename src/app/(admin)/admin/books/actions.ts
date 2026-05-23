"use server";

import { BookStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { upsertBookTags } from "@/lib/queries/books";
import { slugify } from "@/lib/slug";
import { bookFormSchema, parseCommaList } from "@/lib/validations/book";

function parseFormData(formData: FormData) {
  const ratingRaw = formData.get("rating");
  return bookFormSchema.parse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    author: formData.get("author") || undefined,
    description: formData.get("description") || undefined,
    coverImage: formData.get("coverImage") || undefined,
    status: formData.get("status"),
    rating: ratingRaw ? String(ratingRaw) : undefined,
    tags: formData.get("tags") || undefined,
  });
}

function parseRating(value?: string) {
  if (!value || value.length === 0) return null;
  const n = Number(value);
  if (Number.isNaN(n) || n < 1 || n > 5) return null;
  return Math.round(n);
}

function bookData(data: ReturnType<typeof parseFormData>, slug: string) {
  const tagNames = parseCommaList(data.tags);
  return {
    title: data.title,
    slug,
    author: data.author || null,
    description: data.description || null,
    coverImage: data.coverImage || null,
    status: data.status as BookStatus,
    rating: parseRating(data.rating),
    tagNames,
  };
}

export async function createBookAction(formData: FormData) {
  await requireAdmin();
  const data = parseFormData(formData);
  const slug = slugify(data.slug) || slugify(data.title);

  if (await prisma.book.findUnique({ where: { slug } })) {
    throw new Error("Книга с таким slug уже существует");
  }

  const parsed = bookData(data, slug);
  const book = await prisma.book.create({
    data: {
      title: parsed.title,
      slug: parsed.slug,
      author: parsed.author,
      description: parsed.description,
      coverImage: parsed.coverImage,
      status: parsed.status,
      rating: parsed.rating,
      tags: {
        connect: (await upsertBookTags(parsed.tagNames)).map((id) => ({ id })),
      },
    },
  });

  revalidatePath("/library");
  revalidatePath("/admin/books");
  redirect(`/admin/books/${book.id}/edit?saved=1`);
}

export async function updateBookAction(id: string, formData: FormData) {
  await requireAdmin();
  const data = parseFormData(formData);
  const slug = slugify(data.slug) || slugify(data.title);

  const existing = await prisma.book.findFirst({
    where: { slug, NOT: { id } },
  });
  if (existing) throw new Error("Книга с таким slug уже существует");

  const parsed = bookData(data, slug);
  const tagIds = await upsertBookTags(parsed.tagNames);

  await prisma.book.update({
    where: { id },
    data: {
      title: parsed.title,
      slug: parsed.slug,
      author: parsed.author,
      description: parsed.description,
      coverImage: parsed.coverImage,
      status: parsed.status,
      rating: parsed.rating,
      tags: { set: tagIds.map((tid) => ({ id: tid })) },
    },
  });

  revalidatePath("/library");
  revalidatePath(`/library/${slug}`);
  revalidatePath("/admin/books");
  redirect(`/admin/books/${id}/edit?saved=1`);
}

export async function deleteBookAction(id: string) {
  await requireAdmin();
  await prisma.book.delete({ where: { id } });
  revalidatePath("/library");
  revalidatePath("/admin/books");
  redirect("/admin/books");
}

export async function linkReviewPostAction(bookId: string, postId: string) {
  await requireAdmin();
  await prisma.post.update({
    where: { id: postId },
    data: { bookId },
  });
  revalidatePath("/library");
  revalidatePath("/admin/books");
}
