import type { Metadata } from "next";
import Link from "next/link";

import { MarkdownContent } from "@/components/markdown/markdown-content";
import { AdminContainer } from "@/components/ui/admin-container";

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

## Спойлер

Текст скрыт до нажатия на заголовок:

:::spoiler Подробности
Скрытый абзац с **Markdown**.
:::
`;

export default function AdminFormattingPage() {
  return (
    <AdminContainer className="py-6">
      <Link href="/admin/posts" className="text-sm text-muted hover:text-foreground">
        ← К постам
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Правила форматирования Markdown</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Справка для авторов в админке при создании постов и проектов.
      </p>
      <div className="mt-8 max-w-3xl">
        <MarkdownContent content={rulesContent} />
      </div>
    </AdminContainer>
  );
}
