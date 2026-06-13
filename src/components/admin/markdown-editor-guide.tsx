import { EDITOR_SHORTCUTS, formatShortcutKeys } from "@/lib/markdown-editor-shortcuts";

export function MarkdownEditorGuide() {
  return (
    <section className="mt-10 rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="text-sm font-semibold">Работа с редактором</h2>
      <div className="mt-3 space-y-3 text-xs text-muted">
        <p>
          Режимы: <strong className="text-foreground">Source</strong> — только
          исходник, <strong className="text-foreground">Split</strong> — редактор и
          предпросмотр рядом (границу можно перетаскивать),{" "}
          <strong className="text-foreground">Preview</strong> — только
          предпросмотр, <strong className="text-foreground">Live</strong> —
          предпросмотр с редактированием блока по клику (как в Obsidian).
        </p>
        <p>
          CodeMirror: поиск и замена (Ctrl+F / Ctrl+H), подсветка синтаксиса,
          сворачивание заголовков и блоков кода. Изображения — кнопка, drag-and-drop
          или вставка из буфера (Ctrl+V). Для изображений доступна обрезка или
          загрузка в оригинальном размере.
        </p>
        <p>
          Стили текста (меню «Текст»):{" "}
          <code className="text-[0.7rem]">**жирный**</code>,{" "}
          <code className="text-[0.7rem]">[semibold]полужирный[/semibold]</code>,{" "}
          <code className="text-[0.7rem]">*курсив*</code>,{" "}
          <code className="text-[0.7rem]">[underline]подчёркнутый[/underline]</code>,{" "}
          <code className="text-[0.7rem]">~~зачёркнутый~~</code>. Wikilinks{" "}
          <code className="text-[0.7rem]">[[пост|alias]]</code>, callouts{" "}
          <code className="text-[0.7rem]">{`> [!note]`}</code>, теги{" "}
          <code className="text-[0.7rem]">#tag</code>, спойлеры{" "}
          <code className="text-[0.7rem]">:::spoiler</code>.
        </p>
        <p>Черновик текста и формы сохраняется в браузере каждые 500 мс.</p>
        <div>
          <p className="mb-2 font-medium text-foreground">Горячие клавиши</p>
          <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {EDITOR_SHORTCUTS.map((shortcut) => (
              <li key={shortcut.id}>
                {shortcut.label}{" "}
                <kbd className="markdown-editor-kbd">
                  {formatShortcutKeys(shortcut.keys)}
                </kbd>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
