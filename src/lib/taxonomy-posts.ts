import { prisma } from "@/lib/prisma";

export type TaxonomyKind = "category" | "tag";

export type TaxonomyTransferMode = "replace" | "add" | "remove";

export type TaxonomyPostSummary = {
  id: string;
  title: string;
  slug: string;
  status: string;
};

export async function listPostsForTaxonomy(
  kind: TaxonomyKind,
  taxonomyId: string,
): Promise<TaxonomyPostSummary[]> {
  const where =
    kind === "category"
      ? { categories: { some: { id: taxonomyId } } }
      : { tags: { some: { id: taxonomyId } } };

  return prisma.post.findMany({
    where,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
    },
    orderBy: { title: "asc" },
  });
}

export function nextRelationIds(
  currentIds: string[],
  sourceId: string,
  targetId: string | null,
  mode: TaxonomyTransferMode,
): string[] {
  if (mode === "remove") {
    return currentIds.filter((id) => id !== sourceId);
  }

  if (!targetId) {
    throw new Error("Выберите категорию или тег назначения");
  }

  if (mode === "replace") {
    const withoutSource = currentIds.filter((id) => id !== sourceId);
    return withoutSource.includes(targetId)
      ? withoutSource
      : [...withoutSource, targetId];
  }

  return currentIds.includes(targetId) ? currentIds : [...currentIds, targetId];
}

export async function transferTaxonomyPosts({
  kind,
  sourceId,
  targetId,
  mode,
  postIds,
}: {
  kind: TaxonomyKind;
  sourceId: string;
  targetId: string | null;
  mode: TaxonomyTransferMode;
  postIds: string[];
}) {
  if (mode !== "remove" && !targetId) {
    throw new Error("Выберите категорию или тег назначения");
  }

  if (targetId && targetId === sourceId) {
    throw new Error("Нельзя перенести в ту же категорию или тег");
  }

  if (kind === "category") {
    const posts = await prisma.post.findMany({
      where: {
        id: { in: postIds },
        categories: { some: { id: sourceId } },
      },
      select: {
        id: true,
        categories: { select: { id: true } },
      },
    });

    if (posts.length === 0) {
      throw new Error("Не выбраны посты с этой меткой");
    }

    for (const post of posts) {
      const updatedIds = nextRelationIds(
        post.categories.map((item) => item.id),
        sourceId,
        targetId,
        mode,
      );

      await prisma.post.update({
        where: { id: post.id },
        data: {
          categories: {
            set: updatedIds.map((id) => ({ id })),
          },
        },
      });
    }

    return posts.length;
  }

  const posts = await prisma.post.findMany({
    where: {
      id: { in: postIds },
      tags: { some: { id: sourceId } },
    },
    select: {
      id: true,
      tags: { select: { id: true } },
    },
  });

  if (posts.length === 0) {
    throw new Error("Не выбраны посты с этой меткой");
  }

  for (const post of posts) {
    const updatedIds = nextRelationIds(
      post.tags.map((item) => item.id),
      sourceId,
      targetId,
      mode,
    );

    await prisma.post.update({
      where: { id: post.id },
      data: {
        tags: {
          set: updatedIds.map((id) => ({ id })),
        },
      },
    });
  }

  return posts.length;
}
