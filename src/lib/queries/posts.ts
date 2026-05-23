import { PostStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const postListSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  publishedAt: true,
  categories: { select: { name: true, slug: true } },
  tags: { select: { name: true, slug: true } },
} satisfies Prisma.PostSelect;

export type PostListItem = Prisma.PostGetPayload<{ select: typeof postListSelect }>;

export type PostsCursor = {
  publishedAt: string;
  id: string;
};

function publishedWhere(
  q?: string,
  categorySlug?: string,
  tagSlug?: string,
): Prisma.PostWhereInput {
  return {
    status: PostStatus.PUBLISHED,
    publishedAt: { lte: new Date() },
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { excerpt: { contains: q, mode: "insensitive" } },
            { content: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(categorySlug
      ? { categories: { some: { slug: categorySlug } } }
      : {}),
    ...(tagSlug ? { tags: { some: { slug: tagSlug } } } : {}),
  };
}

export function encodePostsCursor(post: {
  id: string;
  publishedAt: Date | null;
}): string | null {
  if (!post.publishedAt) return null;
  return Buffer.from(
    JSON.stringify({
      id: post.id,
      publishedAt: post.publishedAt.toISOString(),
    }),
  ).toString("base64url");
}

export function decodePostsCursor(cursor: string): PostsCursor | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as PostsCursor;
    if (!parsed.id || !parsed.publishedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function listPublishedPosts({
  limit = 6,
  cursor,
  q,
  categorySlug,
  tagSlug,
}: {
  limit?: number;
  cursor?: string;
  q?: string;
  categorySlug?: string;
  tagSlug?: string;
}) {
  const decoded = cursor ? decodePostsCursor(cursor) : null;
  const where = publishedWhere(q, categorySlug, tagSlug);

  const cursorFilter: Prisma.PostWhereInput | undefined = decoded
    ? {
        OR: [
          { publishedAt: { lt: new Date(decoded.publishedAt) } },
          {
            publishedAt: new Date(decoded.publishedAt),
            id: { lt: decoded.id },
          },
        ],
      }
    : undefined;

  const items = await prisma.post.findMany({
    where: cursorFilter ? { AND: [where, cursorFilter] } : where,
    select: postListSelect,
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const last = page.at(-1);

  return {
    items: page,
    nextCursor: hasMore && last ? encodePostsCursor(last) : null,
  };
}

export async function getPublishedPostBySlug(slug: string) {
  return prisma.post.findFirst({
    where: {
      slug,
      status: PostStatus.PUBLISHED,
      publishedAt: { lte: new Date() },
    },
    include: {
      author: { select: { name: true, email: true } },
      categories: true,
      tags: true,
    },
  });
}

export async function getPublishedPostSlugs() {
  return prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      publishedAt: { lte: new Date() },
    },
    select: { slug: true },
  });
}

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });
}

export async function listTags() {
  return prisma.tag.findMany({ orderBy: { name: "asc" } });
}

export async function publishScheduledPosts() {
  const result = await prisma.post.updateMany({
    where: {
      status: PostStatus.SCHEDULED,
      publishedAt: { lte: new Date() },
    },
    data: { status: PostStatus.PUBLISHED },
  });
  return result.count;
}
