import { z } from "zod";

export const taxonomyFormSchema = z.object({
  name: z.string().min(1, "Укажите название").max(100),
});

export type TaxonomyFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: string;
};

export const taxonomyTransferSchema = z.object({
  sourceId: z.string().min(1),
  targetId: z.string().optional(),
  mode: z.enum(["replace", "add", "remove"]),
  postIds: z.array(z.string().min(1)).min(1, "Выберите хотя бы один пост"),
});

export type TaxonomyTransferState = {
  error?: string;
  success?: string;
};
