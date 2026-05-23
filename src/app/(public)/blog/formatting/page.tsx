import type { Metadata } from "next";
import Link from "next/link";

import { MarkdownContent } from "@/components/markdown/markdown-content";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Правила форматирования",
  description: "Синтаксис Markdown для статей блога",
};

const rulesContent = `## Заголовки

Используйте \`##\` и \`###\` для структуры. Один \`#\` — только заголовок страницы в CMS.

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
`;

export default function FormattingPage() {
  return (
    <Container className="py-10 sm:py-14">
      <Link href="/blog" className="text-sm text-muted hover:text-foreground">
        ← К блогу
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Правила форматирования</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Примеры синтаксиса для авторов в админке (этап 3).
      </p>
      <div className="mt-8 max-w-3xl">
        <MarkdownContent content={rulesContent} />
      </div>
    </Container>
  );
}
