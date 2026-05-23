import { BookStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const bookListSelect = {
  id: true,
  title: true,
  slug: true,
  author: true,
  description: true,
  coverImage: true,
  status: true,
  rating: true,
  tags: { select: { name: true, slug: true } },
  reviewPost: {
    select: { id: true, slug: true, title: true },
  },
} satisfies Prisma.BookSelect;

export type BookListItem = Prisma.BookGetPayload<{ select: typeof bookListSelect }>;

export async function listBooks(filters?: {
  status?: BookStatus;
  tag?: string;
  q?: string;
}) {
  return prisma.book.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.tag ? { tags: { some: { slug: filters.tag } } } : {}),
      ...(filters?.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: "insensitive" } },
              { author: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: bookListSelect,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getBookBySlug(slug: string) {
  return prisma.book.findUnique({
    where: { slug },
    include: {
      tags: true,
      reviewPost: {
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
        },
      },
    },
  });
}

export async function getBookSlugs() {
  return prisma.book.findMany({ select: { slug: true } });
}

export async function listBookTags() {
  return prisma.bookTag.findMany({ orderBy: { name: "asc" } });
}

export async function upsertBookTags(names: string[]) {
  const ids: string[] = [];
  for (const name of names) {
    const slug = slugify(name) || name.toLowerCase();
    const row = await prisma.bookTag.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    ids.push(row.id);
  }
  return ids;
}

export async function listAdminBooks() {
  return prisma.book.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      tags: true,
      reviewPost: { select: { id: true, slug: true, title: true, status: true } },
    },
  });
}

export async function getAdminBook(id: string) {
  return prisma.book.findUnique({
    where: { id },
    include: { tags: true, reviewPost: true },
  });
}
