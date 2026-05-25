export type MockProject = {
  slug: string;
  title: string;
  description: string;
  stack: string[];
  roles: string[];
  repoUrl?: string;
  demoUrl?: string;
  problem: string;
  solution: string;
  result: string;
};

export const mockProjects: MockProject[] = [
  {
    slug: "runews",
    title: "Runews",
    description: "Новостной агрегатор с модерацией и Blazor-клиентом.",
    stack: ["C#", "Blazor", "PostgreSQL", "Docker"],
    roles: ["Backend", "DevOps"],
    demoUrl: "https://runews.catshredia.ru",
    problem: "Нужен единый интерфейс для RSS, авторских статей и модерации.",
    solution:
      "ASP.NET Core API, SignalR, EF Core, отдельный Docker-стек на поддомене.",
    result: "Публичный сайт на VPS за Nginx, изолированная БД и uploads volume.",
  },
  {
    slug: "portfolio-site",
    title: "Catshredias Blog",
    description: "Этот сайт: визитка, блог и CMS на Next.js.",
    stack: ["Next.js", "Prisma", "PostgreSQL", "Tailwind"],
    roles: ["Full-stack", "Frontend"],
    repoUrl: "https://github.com",
    problem: "Портфолио и блог должны жить отдельно от Runews, но на том же VPS.",
    solution: "Next.js standalone, Auth.js, mock-данные на этапе 2.",
    result: "Готовый каркас для этапов 3–8 по ТЗ.",
  },
  {
    slug: "api-tooling",
    title: "API Tooling",
    description: "Набор утилит для тестирования REST и интеграций.",
    stack: ["TypeScript", "Node.js"],
    roles: ["Backend"],
    repoUrl: "https://github.com",
    demoUrl: "https://example.com",
    problem: "Ручная проверка эндпоинтов занимала много времени.",
    solution: "CLI + web UI с сохранением коллекций запросов.",
    result: "Сократили время регрессии перед релизом.",
  },
];

export const mockTechnologies = Array.from(
  new Set(mockProjects.flatMap((project) => project.stack)),
).sort();

export const mockRoles = Array.from(
  new Set(mockProjects.flatMap((project) => project.roles)),
).sort();

export function getProjectBySlug(slug: string) {
  return mockProjects.find((project) => project.slug === slug);
}
