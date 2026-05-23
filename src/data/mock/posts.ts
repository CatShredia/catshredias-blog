export type MockPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  categories: string[];
  tags: string[];
  content: string;
};

export const mockPosts: MockPost[] = [
  {
    slug: "nextjs-app-router",
    title: "Старт с Next.js App Router",
    excerpt: "Как устроены route groups, server components и middleware.",
    publishedAt: "2026-05-20",
    categories: ["Разработка"],
    tags: ["nextjs", "typescript"],
    content: `## Зачем App Router

App Router даёт вложенные layouts, loading states и colocation API routes.

\`\`\`ts
export default function Page() {
  return <main>Hello</main>;
}
\`\`\`

| Плюс | Минус |
|------|-------|
| RSC | Кривая обучения |
| Layouts | Edge cases с cache |
`,
  },
  {
    slug: "prisma-postgres",
    title: "Prisma и PostgreSQL на VPS",
    excerpt: "Отдельная БД для портфолио рядом с Runews.",
    publishedAt: "2026-05-18",
    categories: ["Инфраструктура"],
    tags: ["prisma", "docker"],
    content: `## Docker Compose

Поднимаем PostgreSQL на порту **55433**, чтобы не конфликтовать с Runews.

- volume для данных
- healthcheck перед стартом web
`,
  },
  {
    slug: "authjs-admin",
    title: "Auth.js для одной админки",
    excerpt: "Credentials + опциональный OAuth для CMS.",
    publishedAt: "2026-05-15",
    categories: ["Безопасность"],
    tags: ["auth", "jwt"],
    content: `Для одного администратора достаточно **Credentials** и JWT-сессии.

> OAuth подключается через переменные окружения, когда понадобится.
`,
  },
  {
    slug: "tailwind-themes",
    title: "Темы через CSS variables",
    excerpt: "Светлая, тёмная и системная тема с localStorage.",
    publishedAt: "2026-05-12",
    categories: ["UI"],
    tags: ["tailwind", "a11y"],
    content: `Переключатель темы меняет класс \`dark\` на \`<html>\`.

Контраст текста и фона держим не ниже **4.5:1**.
`,
  },
  {
    slug: "markdown-blog",
    title: "Markdown в блоге",
    excerpt: "remark-gfm, подсветка кода и страница правил.",
    publishedAt: "2026-05-10",
    categories: ["Контент"],
    tags: ["markdown"],
    content: `См. также страницу [правил форматирования](/blog/formatting).
`,
  },
];

export const mockCategories = [
  "Разработка",
  "Инфраструктура",
  "Безопасность",
  "UI",
  "Контент",
];

export function getPostBySlug(slug: string) {
  return mockPosts.find((post) => post.slug === slug);
}
