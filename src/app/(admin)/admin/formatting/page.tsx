import type { Metadata } from "next";
import Link from "next/link";

import { MarkdownContent } from "@/components/markdown/markdown-content";
import { AdminContainer } from "@/components/ui/admin-container";
import { listPublishedWikiLinkTargets } from "@/lib/queries/wiki-link-targets";

export const metadata: Metadata = {
  title: "Правила форматирования",
  description: "Синтаксис Markdown для статей блога",
};

const rulesContent = `## Заголовки

Используйте ## и ### для структуры. Один # — только заголовок страницы в CMS.

## Код

\`\`\`ts
const answer = 42;
\`\`\`

## Списки

- пункт один
- пункт два

1. нумерованный
2. список

## Таблицы

| Колонка | Описание |
|---------|----------|
| slug    | URL поста |
| status  | draft / published |

## Цитаты

> Премодерация комментариев включена по умолчанию.

## Ссылки и изображения

[Текст ссылки](https://example.com)

![alt](https://placehold.co/600x300)

## Wikilinks (Obsidian)

Ссылка на другой пост блога по заголовку или slug:

[[Hello World]]

С псевдонимом:

[[Hello World|краткий текст]]

## Callouts (GFM alerts)

> [!note] Подсказка
> Текст блока с **Markdown**.

> [!tip] Совет
> Полезная рекомендация.

> [!warning] Внимание
> Важное предупреждение.

## Теги в тексте

Теги в теле поста ведут на фильтр блога: #фантастика #devops

## Спойлер (legacy)

Текст скрыт до нажатия на заголовок:

:::spoiler Подробности
Скрытый абзац с **Markdown**.
:::
`;

export default async function AdminFormattingPage() {
  const linkTargets = await listPublishedWikiLinkTargets();

  return (
    <AdminContainer className="py-6">
      <Link href="/admin/posts" className="text-sm text-muted hover:text-foreground">
        ← К постам
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Правила форматирования Markdown</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Справка для авторов в админке: CodeMirror-редактор, wikilinks, callouts, теги и
        спойлеры. Предпросмотр использует тот же конвейер, что и публичный сайт.
      </p>
      <div className="mt-8 max-w-3xl">
        <MarkdownContent content={rulesContent} linkTargets={linkTargets} />
      </div>
    </AdminContainer>
  );
}
