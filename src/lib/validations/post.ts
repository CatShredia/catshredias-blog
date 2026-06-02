import { PostStatus, PostTrackType } from "@prisma/client";
import { z } from "zod";

import { resolvePublishedAt } from "@/lib/queries/admin";
import { resolvePostTrackPayload } from "@/lib/post-track";
import { optionalPathOrUrl } from "@/lib/validations/path-or-url";

export const postFormBaseSchema = z
  .object({
    title: z.string().min(1, "Укажите заголовок").max(200),
    slug: z.string().min(1, "Укажите slug").max(200),
    excerpt: z.string().max(500).optional(),
    coverImage: optionalPathOrUrl.optional().or(z.literal("")),
    trackType: z.nativeEnum(PostTrackType),
    trackAudioUrl: z.string().optional(),
    trackTitle: z.string().max(200).optional(),
    trackArtist: z.string().max(200).optional(),
    trackCoverImage: optionalPathOrUrl.optional().or(z.literal("")),
    trackEmbedInput: z.string().optional(),
    content: z.string(),
    status: z.nativeEnum(PostStatus),
    publishedAt: z.string().optional(),
    categories: z.string().optional(),
    tags: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status !== PostStatus.DRAFT && data.content.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Добавьте содержимое",
        path: ["content"],
      });
    }
  });

export type PostFormBaseInput = z.infer<typeof postFormBaseSchema>;

export type ParsedPostForm = Omit<PostFormBaseInput, "publishedAt"> & {
  track: ReturnType<typeof resolvePostTrackPayload>;
  publishedAt: Date | null;
};

export type PostFormParseResult =
  | { ok: true; data: ParsedPostForm }
  | { ok: false; fieldErrors?: Record<string, string[]>; error?: string };

export function parsePostFormFromFormData(formData: FormData): PostFormParseResult {
  const parsed = postFormBaseSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt") || undefined,
    coverImage: formData.get("coverImage") || undefined,
    trackType: formData.get("trackType") || PostTrackType.NONE,
    trackAudioUrl: formData.get("trackAudioUrl") || undefined,
    trackTitle: formData.get("trackTitle") || undefined,
    trackArtist: formData.get("trackArtist") || undefined,
    trackCoverImage: formData.get("trackCoverImage") || undefined,
    trackEmbedInput: formData.get("trackEmbedInput") || undefined,
    content: formData.get("content") ?? "",
    status: formData.get("status"),
    publishedAt: formData.get("publishedAt") || undefined,
    categories: formData.get("categories") || undefined,
    tags: formData.get("tags") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const track = resolvePostTrackPayload({
      trackType: parsed.data.trackType,
      trackAudioUrl: parsed.data.trackAudioUrl,
      trackTitle: parsed.data.trackTitle,
      trackArtist: parsed.data.trackArtist,
      trackCoverImage: parsed.data.trackCoverImage,
      trackEmbedInput: parsed.data.trackEmbedInput,
    });
    const publishedAt = resolvePublishedAt(
      parsed.data.status,
      parsed.data.publishedAt,
    );
    return { ok: true, data: { ...parsed.data, track, publishedAt } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Ошибка сохранения",
    };
  }
}

/** @deprecated use postFormBaseSchema + parsePostFormFromFormData */
export const postFormSchema = postFormBaseSchema.transform((data) => ({
  ...data,
  track: resolvePostTrackPayload({
    trackType: data.trackType,
    trackAudioUrl: data.trackAudioUrl,
    trackTitle: data.trackTitle,
    trackArtist: data.trackArtist,
    trackCoverImage: data.trackCoverImage,
    trackEmbedInput: data.trackEmbedInput,
  }),
}));

export type PostFormInput = z.infer<typeof postFormSchema>;

export function parseCommaList(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
