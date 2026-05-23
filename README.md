# catshredias-blog

Персональный сайт-визитка с блогом, портфолио и админкой (Next.js 16, Prisma, PostgreSQL, Auth.js).

## Стек

- **Frontend:** Next.js App Router, TypeScript, Tailwind CSS v4
- **Backend:** Server Actions / Route Handlers, Auth.js v5
- **БД:** PostgreSQL 16, Prisma ORM
- **Деплой:** Docker `standalone` на VPS (рядом с [Runews](../Coursework))

## Быстрый старт (локально)

1. Скопируйте переменные:

```bash
cp .env.example .env
```

2. Поднимите PostgreSQL:

```bash
docker compose up -d db
```

Порт **55433** (не конфликтует с Runews на 55432).

3. Миграции и seed:

```bash
npm run db:migrate
npm run db:seed
```

4. Dev-сервер:

```bash
npm run dev
```

- Сайт: http://localhost:3000  
- Админка: http://localhost:3000/admin  
- Логин после seed: `admin@catshredia.ru` / `changeme`

## Docker (web + db)

```bash
docker compose up -d --build
```

Перед первым запуском задайте `AUTH_SECRET` (≥32 символов) в `.env`.

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Разработка |
| `npm run build` | Prisma generate + production build |
| `npm run db:migrate` | Миграции |
| `npm run db:seed` | Админ-пользователь |
| `npm run db:studio` | Prisma Studio |

## Маршруты

| URL | Описание |
|-----|----------|
| `/` | Главная |
| `/blog` | Блог (mock) |
| `/portfolio` | Портфолио (mock) |
| `/contacts` | Контакты |
| `/admin` | CMS (этап 3+) |
| `/api/health` | Health check |

## Документация

- [deploy-vps.md](docs/deploy-vps.md) — Nginx, поддомены, Runews + портфолио
- ТЗ: `_docs/Техническое задание 23.05.docx`

## Этапы по ТЗ

- [x] **1** — каркас, Prisma, Auth.js, Docker
- [x] **2** — публичный UI, темы, mock-данные
- [ ] **3** — CRUD админки, редактор Markdown
- [ ] **4–8** — блог API, комментарии, SEO, CI/CD, прод
