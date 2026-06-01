export function readEditorDraft(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;
  return stored;
}

export function writeEditorDraft(key: string, value: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
}

export function clearEditorDraft(key: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}
