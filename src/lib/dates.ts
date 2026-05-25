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

export function toDateInputValue(value: Date | string | null | undefined): string {
  const date = toDate(value);
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateInput(value?: string): Date | null {
  if (!value?.trim()) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}
