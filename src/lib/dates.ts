export function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toIsoString(value: Date | string | null | undefined): string | undefined {
  const date = toDate(value);
  return date?.toISOString();
}

export function formatDateRu(value: Date | string | null | undefined): string {
  const date = toDate(value);
  return date ? date.toLocaleDateString("ru-RU") : "";
}
