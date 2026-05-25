"use server";

import { BookStatus, PostStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { parseDateInput } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { upsertBookTags } from "@/lib/queries/books";
import { uniqueSlugWithSuffix } from "@/lib/post-slug";
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
    readAt: formData.get("readAt") || undefined,
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
    readAt: parseDateInput(data.readAt),
    tagNames,
  };
}

async function uniqueBookSlug(base: string): Promise<string> {
  return uniqueSlugWithSuffix(
    base,
    async (slug) => !!(await prisma.book.findUnique({ where: { slug } })),
    "book",
  );
}

export async function createBookAction(formData: FormData) {
  await requireAdmin();
  const data = parseFormData(formData);
  const slug = await uniqueBookSlug(data.slug || data.title);

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
      readAt: parsed.readAt,
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
      readAt: parsed.readAt,
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

  const [book, post] = await Promise.all([
    prisma.book.findUnique({ where: { id: bookId }, select: { id: true } }),
    prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true, bookId: true },
    }),
  ]);

  if (!book) throw new Error("Книга не найдена");
  if (!post) throw new Error("Пост не найден");
  if (post.status !== PostStatus.PUBLISHED) {
    throw new Error("Можно привязать только опубликованный пост");
  }
  if (post.bookId && post.bookId !== bookId) {
    throw new Error("Пост уже привязан к другой книге");
  }

  await prisma.post.update({
    where: { id: postId },
    data: { bookId },
  });

  revalidatePath("/library");
  revalidatePath("/admin/books");
  revalidatePath(`/admin/books/${bookId}/edit`);
}
