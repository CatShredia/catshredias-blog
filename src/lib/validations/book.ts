import { BookStatus } from "@prisma/client";
import { z } from "zod";

export const bookFormSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  author: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  coverImage: z.string().optional(),
  status: z.nativeEnum(BookStatus),
  rating: z.string().optional(),
  tags: z.string().optional(),
});

export function parseCommaList(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  PLANNED: "В планах",
  READING: "Читаю",
  READ: "Прочитано",
};
