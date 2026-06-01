import { z } from "zod";

export const projectFormSchema = z.object({
  title: z.string().min(1, "Укажите название").max(200),
  slug: z.string().min(1, "Укажите slug").max(200),
  description: z.string().min(1, "Добавьте описание"),
  problem: z.string().optional(),
  solution: z.string().optional(),
  result: z.string().optional(),
  stack: z.string().min(1, "Укажите стек (через запятую)"),
  roles: z.string().min(1, "Укажите роли (через запятую)"),
  repoUrl: z.string().url().optional().or(z.literal("")),
  demoUrl: z.string().url().optional().or(z.literal("")),
});

export type ProjectFormInput = z.infer<typeof projectFormSchema>;

export function parseCommaList(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
