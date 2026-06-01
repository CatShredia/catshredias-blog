import { PostStatus, PostTrackType } from "@prisma/client";
import { z } from "zod";

import { resolvePostTrackPayload } from "@/lib/post-track";
import { optionalPathOrUrl } from "@/lib/validations/path-or-url";

export const postFormSchema = z
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
    content: z.string().min(1, "Добавьте содержимое"),
    status: z.nativeEnum(PostStatus),
    publishedAt: z.string().optional(),
    categories: z.string().optional(),
    tags: z.string().optional(),
  })
  .transform((data) => ({
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
