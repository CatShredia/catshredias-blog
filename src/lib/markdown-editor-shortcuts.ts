export type EditorModeShortcut = "source" | "split" | "preview" | "live";

export type EditorShortcutId =
  | EditorModeShortcut
  | "search"
  | "image"
  | "pdf"
  | "table"
  | "callout"
  | "spoiler"
  | "textStyleMenu"
  | "resetDraft";

export type EditorShortcut = {
  id: EditorShortcutId;
  label: string;
  keys: string;
};

export const EDITOR_SHORTCUTS: EditorShortcut[] = [
  { id: "source", label: "Source", keys: "Ctrl+Alt+1" },
  { id: "split", label: "Split", keys: "Ctrl+Alt+2" },
  { id: "preview", label: "Preview", keys: "Ctrl+Alt+3" },
  { id: "live", label: "Live", keys: "Ctrl+Alt+4" },
  { id: "search", label: "Поиск", keys: "Ctrl+Alt+F" },
  { id: "image", label: "Изображение", keys: "Ctrl+Alt+I" },
  { id: "pdf", label: "PDF", keys: "Ctrl+Alt+P" },
  { id: "table", label: "Таблица", keys: "Ctrl+Alt+T" },
  { id: "callout", label: "Callout", keys: "Ctrl+Alt+C" },
  { id: "spoiler", label: "Спойлер", keys: "Ctrl+Alt+S" },
  { id: "textStyleMenu", label: "Текст", keys: "Ctrl+Alt+G" },
  { id: "resetDraft", label: "Сброс черновика", keys: "Ctrl+Alt+Shift+R" },
];

function isMacPlatform() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

export function formatShortcutKeys(keys: string) {
  if (!isMacPlatform()) return keys;
  return keys
    .replaceAll("Ctrl", "⌃")
    .replaceAll("Alt", "⌥")
    .replaceAll("Shift", "⇧");
}

function hasMod(event: KeyboardEvent) {
  return event.ctrlKey || event.metaKey;
}

function isTypingInForeignField(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return !target.closest(".markdown-editor-root");
  }
  if (target.isContentEditable && !target.closest(".cm-editor")) {
    return !target.closest(".markdown-editor-root");
  }
  return false;
}

export function matchEditorShortcut(event: KeyboardEvent): EditorShortcutId | null {
  if (event.defaultPrevented || event.repeat) return null;
  if (isTypingInForeignField(event.target)) return null;

  const mod = hasMod(event);
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (mod && event.altKey && event.shiftKey && key === "r") {
    return "resetDraft";
  }

  if (!mod || !event.altKey || event.shiftKey) return null;

  switch (key) {
    case "1":
      return "source";
    case "2":
      return "split";
    case "3":
      return "preview";
    case "4":
      return "live";
    case "f":
      return "search";
    case "i":
      return "image";
    case "p":
      return "pdf";
    case "t":
      return "table";
    case "c":
      return "callout";
    case "s":
      return "spoiler";
    case "g":
      return "textStyleMenu";
    default:
      return null;
  }
}
