import { z } from "zod";

export const commentSchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(3).max(5000),
  parentId: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export const reportSchema = z.object({
  reason: z.string().min(5, "Опишите причину (минимум 5 символов)").max(1000),
});
