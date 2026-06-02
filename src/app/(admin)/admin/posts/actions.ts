"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { upsertCategories, upsertTags } from "@/lib/queries/admin";
import { uniqueSlugWithSuffix } from "@/lib/post-slug";
import { blogPostPath, slugify } from "@/lib/slug";
import {
  parseCommaList,
  parsePostFormFromFormData,
} from "@/lib/validations/post";

export type PostFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

async function uniquePostSlug(base: string): Promise<string> {
  return uniqueSlugWithSuffix(
    base,
    async (slug) => !!(await prisma.post.findUnique({ where: { slug } })),
    "post",
  );
}

export async function createPostAction(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const session = await requireAdmin();
  const parsed = parsePostFormFromFormData(formData);
  if (!parsed.ok) {
    return {
      error: parsed.error,
      fieldErrors: parsed.fieldErrors,
    };
  }

  const data = parsed.data;
  const slug = await uniquePostSlug(data.slug || data.title);

  const categoryIds = await upsertCategories(parseCommaList(data.categories));
  const tagIds = await upsertTags(parseCommaList(data.tags));

  const post = await prisma.post.create({
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt,
      coverImage: data.coverImage || null,
      trackType: data.track.trackType,
      trackAudioUrl: data.track.trackAudioUrl,
      trackTitle: data.track.trackTitle,
      trackArtist: data.track.trackArtist,
      trackCoverImage: data.track.trackCoverImage,
      trackEmbedSrc: data.track.trackEmbedSrc,
      content: data.content,
      status: data.status,
      publishedAt: data.publishedAt,
      authorId: session.user.id,
      categories: { connect: categoryIds.map((id) => ({ id })) },
      tags: { connect: tagIds.map((id) => ({ id })) },
    },
  });

  revalidatePath("/blog");
  revalidatePath("/admin/posts");
  redirect(`/admin/posts/${post.id}/edit?saved=1`);
}

export async function updatePostAction(
  id: string,
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  await requireAdmin();
  const parsed = parsePostFormFromFormData(formData);
  if (!parsed.ok) {
    return {
      error: parsed.error,
      fieldErrors: parsed.fieldErrors,
    };
  }

  const data = parsed.data;
  const slug = slugify(data.slug) || slugify(data.title);

  const existing = await prisma.post.findFirst({
    where: { slug, NOT: { id } },
  });
  if (existing) {
    return { error: "Пост с таким slug уже существует" };
  }

  const categoryIds = await upsertCategories(parseCommaList(data.categories));
  const tagIds = await upsertTags(parseCommaList(data.tags));

  await prisma.post.update({
    where: { id },
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt,
      coverImage: data.coverImage || null,
      trackType: data.track.trackType,
      trackAudioUrl: data.track.trackAudioUrl,
      trackTitle: data.track.trackTitle,
      trackArtist: data.track.trackArtist,
      trackCoverImage: data.track.trackCoverImage,
      trackEmbedSrc: data.track.trackEmbedSrc,
      content: data.content,
      status: data.status,
      publishedAt: data.publishedAt,
      categories: { set: categoryIds.map((cid) => ({ id: cid })) },
      tags: { set: tagIds.map((tid) => ({ id: tid })) },
    },
  });

  revalidatePath("/blog");
  revalidatePath(blogPostPath(slug));
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
