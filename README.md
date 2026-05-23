# catshredias-blog

Персональный сайт-визитка с блогом, портфолио и админкой (Next.js 16, Prisma, PostgreSQL, Auth.js).

## Стек

- **Frontend:** Next.js App Router, TypeScript, Tailwind CSS v4
- **Backend:** Route Handlers, Server Actions, Auth.js v5
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

3. Миграции и seed (админ + посты + проекты):

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
- Модерация комментариев: http://localhost:3000/admin/comments  
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
| `npm run test` | Unit-тесты (Vitest) |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Миграции |
| `npm run db:seed` | Админ, посты, проекты |
| `npm run db:studio` | Prisma Studio |

## API

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/posts?cursor=&q=&category=&limit=` | Лента постов (cursor) |
| GET | `/api/projects?tech=&role=` | Портфолио |
| POST | `/api/comments` | Новый комментарий (Turnstile) |
| POST | `/api/cron/publish-scheduled` | Публикация отложенных постов |
| GET | `/api/health` | Health + БД |

## SEO

- `/sitemap.xml`, `/robots.txt`
- Open Graph и JSON-LD (Article, Person, WebSite)
- `revalidate = 60` на страницах блога и портфолио

## Бэкап БД

```bash
# Linux/macOS
./scripts/backup-db.sh

# Windows
./scripts/backup-db.ps1
```

## DataGrip

| Поле | Значение |
|------|----------|
| Host | `localhost` |
| Port | `55433` |
| Database | `portfolio_db` |
| User / Password | `postgres` / `postgres` |

## Документация

- [deploy-vps.md](docs/deploy-vps.md) — Nginx, поддомены, Runews + портфолио
- ТЗ: `_docs/Техническое задание 23.05.docx`

## Этапы по ТЗ

- [x] **1** — каркас, Prisma, Auth.js, Docker
- [x] **2** — публичный UI, темы, mock-данные
- [x] **3** — CRUD админки, редактор Markdown
- [x] **4** — блог: API, infinite scroll, SEO
- [x] **5** — портфолио из БД, PDF viewer, hh.ru
- [x] **6** — комментарии, Turnstile, модерация
- [x] **7** — CI, тесты, логи, бэкапы, health
- [ ] **8** — деплой на прод, финальная документация
