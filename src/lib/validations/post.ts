import { PostStatus } from "@prisma/client";
import { z } from "zod";

export const postFormSchema = z.object({
  title: z.string().min(1, "Укажите заголовок").max(200),
  slug: z.string().min(1, "Укажите slug").max(200),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1, "Добавьте содержимое"),
  status: z.nativeEnum(PostStatus),
  publishedAt: z.string().optional(),
  categories: z.string().optional(),
  tags: z.string().optional(),
});

export type PostFormInput = z.infer<typeof postFormSchema>;

export function parseCommaList(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
