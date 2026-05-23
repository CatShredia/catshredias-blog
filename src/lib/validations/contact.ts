import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Минимум 2 символа").max(80),
  email: z.string().trim().email("Некорректный email").max(254),
  message: z.string().trim().min(10, "Минимум 10 символов").max(5000),
});
