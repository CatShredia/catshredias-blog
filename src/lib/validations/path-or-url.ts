import { z } from "zod";

export function isPathOrUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("/")) return true;
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

/** Пустая строка, относительный путь (/api/uploads/...) или абсолютный URL. */
export const optionalPathOrUrl = z
  .string()
  .refine(isPathOrUrl, "Укажите путь /api/... или полный URL (https://...)");
