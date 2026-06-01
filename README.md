# catshredias-blog

Персональный сайт-визитка с блогом, портфолио, библиотекой книг и админ-панелью. Проект [catshredia.ru](https://catshredia.ru) разворачивается на VPS рядом с [Runews](../Coursework) на отдельном поддомене.

## Возможности

### Публичная часть

| Раздел         | Описание                                                                            |
| -------------- | ----------------------------------------------------------------------------------- |
| **Главная**    | Hero, биография, статус «Ищу работу» (Да/Нет)                                       |
| **Блог**       | Лента с infinite scroll, поиск, фильтры по категориям и тегам, Markdown             |
| **Портфолио**  | Проекты, фильтры по стеку и роли, PDF-резюме, ссылка на hh.ru, статус поиска работы |
| **Библиотека** | Книги: статус (в планах / читаю / прочитано), рейтинг, теги, отзыв-пост             |
| **Контакты**   | Форма обратной связи (сервер + rate limit), ссылки на соцсети                       |
| **Профиль**    | Регистрация, аватар, отображаемое имя; для админа — ссылка в админку                |

### Пользователи и комментарии

- Регистрация и вход (`/register`, `/login`)
- Комментарии к постам только для авторизованных; публикуются сразу
- Cloudflare Turnstile (опционально в dev)
- Жалобы на комментарии; админ видит новые комментарии и обрабатывает жалобы

### Админ-панель (`/admin`)

- Посты: CRUD, черновик / опубликовано / запланировано, обложка, Markdown-редактор с автосохранением и загрузкой файлов
- Проекты: кейсы «Проблема → Решение → Результат», скриншоты, PDF, hh.ru
- **Портфолио (настройки сайта):** hh.ru, PDF-резюме, «Ищу работу»
- Библиотека книг
- Комментарии и жалобы
- Правила Markdown (только в админке)

### Прочее

- Светлая / тёмная / системная тема
- SEO: `sitemap.xml`, `robots.txt`, Open Graph, JSON-LD
- CI (lint, test, build), health check, скрипты бэкапа БД
- Загрузки: изображения и PDF в `uploads/`, раздача через `/api/uploads/...`

## Стек

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend:** Route Handlers, Server Actions, Auth.js v5 (JWT)
- **БД:** PostgreSQL 16, Prisma 6
- **Деплой:** Docker `standalone`, Nginx на VPS

## Быстрый старт

### Требования

- Node.js 22+
- Docker (для PostgreSQL локально)

### 1. Переменные окружения

```bash
cp .env.example .env
```

Минимум для локальной разработки:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:55433/portfolio_db"
AUTH_SECRET="ваш-секрет-минимум-32-символа"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
ADMIN_EMAIL="admin@catshredia.ru"
ADMIN_PASSWORD="changeme"
```

Сгенерировать `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 2. База данных

```bash
docker compose up -d db
npm install
npm run db:migrate
npm run db:seed
```

PostgreSQL слушает порт **55433** (не пересекается с Runews на 55432).

В проекте **одна миграция** — `prisma/migrations/20260524000000_init`. На чистой БД достаточно `npx prisma migrate deploy` (или `npm run db:migrate` в dev).

Если раньше уже применялись старые миграции, сбросьте БД и накатите заново:

```bash
npx prisma migrate reset
npm run db:seed
```

### 3. Запуск

```bash
npm run dev
```

| URL                                                                    | Назначение          |
| ---------------------------------------------------------------------- | ------------------- |
| [http://localhost:3000](http://localhost:3000)                         | Сайт                |
| [http://localhost:3000/admin](http://localhost:3000/admin)             | Админка             |
| [http://localhost:3000/admin/login](http://localhost:3000/admin/login) | Вход администратора |

После seed: **[admin@catshredia.ru](mailto:admin@catshredia.ru)** / **changeme**

Обычные пользователи регистрируются на `/register`. Админка доступна только с ролью `ADMIN`; ссылка «Админка» — в профиле (`/profile`).

## Docker (web + db)

```bash
docker compose up -d --build
```

Перед первым запуском задайте в `.env` валидный `AUTH_SECRET` (≥ 32 символов).

## Переменные окружения

| Переменная                                                | Обязательно | Описание                                                                  |
| --------------------------------------------------------- | ----------- | ------------------------------------------------------------------------- |
| `DATABASE_URL`                                            | да          | PostgreSQL connection string                                              |
| `AUTH_SECRET`                                             | да          | Секрет Auth.js                                                            |
| `AUTH_URL`                                                | да          | Базовый URL приложения                                                    |
| `NEXT_PUBLIC_SITE_URL`                                    | да          | Публичный URL (SEO, ссылки)                                               |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD`                          | для seed    | Учётка администратора                                                     |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`                   | нет         | OAuth GitHub                                                              |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`                   | нет         | OAuth Google                                                              |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | нет         | Turnstile для комментариев                                                |
| `CRON_SECRET`                                             | нет         | Защита `POST /api/cron/publish-scheduled`                                 |
| `NPM_REGISTRY`                                            | нет         | npm registry для `docker compose build` на VPS (например GitVerse mirror) |
| `UPLOAD_DIR`                                              | нет         | Каталог загрузок (по умолчанию `./uploads`)                               |

## Скрипты npm

| Команда              | Описание                                     |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Dev-сервер                                   |
| `npm run build`      | Prisma generate + production build           |
| `npm run start`      | Production-сервер                            |
| `npm run lint`       | ESLint                                       |
| `npm run test`       | Vitest (unit)                                |
| `npm run db:migrate` | Миграции (`prisma migrate dev`)              |
| `npm run db:seed`    | Seed: админ, посты, проекты, настройки сайта |
| `npm run db:studio`  | Prisma Studio                                |

## Маршруты

### Публичные

- `/` — главная
- `/blog`, `/blog/[slug]` — блог
- `/portfolio`, `/portfolio/[slug]` — портфолио
- `/library`, `/library/[slug]` — библиотека
- `/contacts` — контакты
- `/login`, `/register`, `/profile`

### Админка

- `/admin` — дашборд
- `/admin/posts`, `/admin/projects`, `/admin/books`
- `/admin/portfolio-settings` — hh.ru, PDF, «Ищу работу»
- `/admin/comments`, `/admin/reports`
- `/admin/formatting` — справка по Markdown

## API

| Метод | URL                                           | Описание                             |
| ----- | --------------------------------------------- | ------------------------------------ |
| GET   | `/api/posts?cursor=&q=&category=&tag=&limit=` | Лента постов (cursor pagination)     |
| GET   | `/api/projects?tech=&role=`                   | Список проектов                      |
| POST  | `/api/comments`                               | Новый комментарий (auth + Turnstile) |
| POST  | `/api/comments/[id]/report`                   | Жалоба на комментарий                |
| POST  | `/api/contacts`                               | Форма обратной связи                 |
| POST  | `/api/user/avatar`                            | Аватар пользователя                  |
| PATCH | `/api/user/profile`                           | Имя в профиле                        |
| POST  | `/api/admin/upload`                           | Загрузка файлов (admin)              |
| GET   | `/api/uploads/[...path]`                      | Раздача загруженных файлов           |
| POST  | `/api/cron/publish-scheduled`                 | Публикация отложенных постов         |
| GET   | `/api/health`                                 | Health check + проверка БД           |

## Структура проекта

```text
catshredias-blog/
├── prisma/              # Схема, миграции, seed
├── src/
│   ├── app/
│   │   ├── (public)/    # Публичные страницы
│   │   ├── (admin)/     # Админка
│   │   └── api/         # Route Handlers
│   ├── components/      # UI, блог, портфолио, админка
│   └── lib/             # Auth, Prisma, queries, validations
├── uploads/             # Загруженные файлы (не в git)
├── docs/deploy-vps.md   # Деплой на VPS
└── _docs/               # Техническое задание
```

## Бэкап БД

```bash
# Linux / macOS
./scripts/backup-db.sh

# Windows
./scripts/backup-db.ps1
```

### Скачать бэкап и uploads с VPS на ПК

В `scripts/sync-from-vps.ps1` в начале файла задайте IP, имя бэкапа, пути и пароль локального Postgres, затем:

```powershell
cd catshredias-blog
.\scripts\sync-from-vps.ps1
```

Скрипт: локальный `pg_dump` → скачивание `.sql.gz` и `uploads` → подтверждение `yes` → **DROP/CREATE** локальной БД → заливка дампа с VPS (порт **5432**). SSH: **ssh-agent** (`$SshPrivateKeyPath`). Отчёт в `Downloads\vps-sync\`.

Передача на домашний пк:

```bash
scp deploy@147.45.246.115:~/catshredias-blog/backups/portfolio_db_20260528_235409.sql.gz "C:/Users/catsh/Downloads/"
```

все сразу:

```bash
scp -r deploy@147.45.246.115:~/catshredias-blog/backups "C:/Users/catsh/Downloads/portfolio-backups"
```

распаковка в sql:

```bash
gunzip portfolio_db_20260528_235409.sql.gz
psql -U postgres -d portfolio_db < portfolio_db_20260528_235409.sql
```

## Подключение к БД (DataGrip / DBeaver)

| Поле            | Значение                |
| --------------- | ----------------------- |
| Host            | `localhost`             |
| Port            | `55433`                 |
| Database        | `portfolio_db`          |
| User / Password | `postgres` / `postgres` |

## Деплой

Полная инструкция по размещению **catshredia.ru** и **runews.catshredia.ru** на одном VPS:

- **[docs/deploy-vps.md](docs/deploy-vps.md)** — DNS, Docker, Nginx, SSL, `.env`, миграции, cron, бэкапы, чеклист
- **[docs/nginx/](docs/nginx/)** — примеры конфигов Nginx для обоих доменов

Runews на том же сервере: [Coursework/docs/server-setup.md](../Coursework/docs/server-setup.md).

## Документация и ТЗ

- ТЗ: `_docs/Техническое задание 23.05.docx` (текст: `_docs/_tz_extracted.txt`)

## Статус по этапам ТЗ

- **1** — каркас, Prisma, Auth.js, Docker
- **2** — публичный UI, темы
- **3** — CRUD админки, Markdown-редактор
- **4** — блог: API, infinite scroll, SEO, фильтры
- **5** — портфолио: кейсы, PDF, hh.ru
- **6** — комментарии, Turnstile, модерация, жалобы
- **7** — CI, тесты, логи, бэкапы, health
- **8** — продакшен-деплой и финальная передача ([docs/deploy-vps.md](docs/deploy-vps.md))

## Лицензия

Приватный проект. Все права у владельца репозитория.
