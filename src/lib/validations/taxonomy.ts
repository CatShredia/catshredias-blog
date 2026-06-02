import { z } from "zod";

export const taxonomyFormSchema = z.object({
  name: z.string().min(1, "Укажите название").max(100),
});

export type TaxonomyFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};
