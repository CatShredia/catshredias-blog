# Деплой catshredia.ru + runews.catshredia.ru на одном VPS

Пошаговая инструкция: **два независимых Docker-стека** на одном сервере Timeweb, единый **Nginx** на хосте (TLS, маршрутизация по доменам).


| Домен                          | Проект                     | Репозиторий         | Порт на localhost |
| ------------------------------ | -------------------------- | ------------------- | ----------------- |
| `https://catshredia.ru`        | Портфолио + блог (Next.js) | `catshredias-blog/` | `127.0.0.1:3000`  |
| `https://runews.catshredia.ru` | Runews (Blazor + API)      | `Coursework/`       | `127.0.0.1:8080`  |


У каждого сервиса **своя PostgreSQL** (разные Docker-тома, разные порты для отладки с ПК: `55433` и `55432`).

---

## Архитектура

```text
                    Internet
                        │
                        ▼
              ┌─────────────────┐
              │  Nginx (хост)   │
              │  :80  → редирект│
              │  :443 + TLS     │
              └────────┬────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
  catshredia.ru              runews.catshredia.ru
  proxy → :3000              proxy → :8080
         │                           │
         ▼                           ▼
  portfolio-web                runews-web
  portfolio-db                 runews-api
  (PostgreSQL)                 runews-db
                               (+ mailpit dev)
```

**Важно:** порты `3000` и `8080` слушают только `127.0.0.1` — снаружи VPS доступны только **22, 80, 443**.

---

## Требования к VPS


| Параметр  | Рекомендация                                  |
| --------- | --------------------------------------------- |
| ОС        | Ubuntu 22.04 / 24.04 LTS                      |
| CPU / RAM | 2 vCPU, **4 GB RAM** (минимум 2 GB, но тесно) |
| Диск      | от 30 GB                                      |
| Продукт   | VPS/VDS или Timeweb Cloud (не shared-хостинг) |


На сервере: **Docker Engine + Compose plugin**, **Nginx**, **Certbot**.

Базовая настройка SSH, firewall, Docker: [Coursework/docs/server-setup.md](../../Coursework/docs/server-setup.md).

---

## 1. DNS

В панели DNS для зоны `catshredia.ru`:


| Тип         | Имя      | Значение        |
| ----------- | -------- | --------------- |
| A           | `@`      | `IP_ВАШЕГО_VPS` |
| A           | `runews` | тот же IP       |
| A или CNAME | `www`    | `@` или IP      |


Проверка (с ПК или сервера):

```bash
dig +short catshredia.ru A
dig +short runews.catshredia.ru A
```

Оба должны вернуть один IP. Дождитесь распространения (обычно до 15–60 минут).

---

## 2. Firewall

### Timeweb Cloud (панель)

Входящий TCP, подсеть `0.0.0.0/0`:


| Порт | Назначение                |
| ---- | ------------------------- |
| 22   | SSH                       |
| 80   | HTTP (Certbot + редирект) |
| 443  | HTTPS                     |


**Не открывать** наружу: `3000`, `8080`, `55432`, `55433`, `8025`.

### ufw на сервере

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

---

## 3. Структура каталогов на сервере

```bash
mkdir -p ~/apps
cd ~/apps

# Клонировать оба репозитория (URL подставьте свои)
git clone URL/catshredias-blog.git catshredias-blog
git clone URL/Coursework.git Coursework
```

Итог:

```text
~/apps/
├── catshredias-blog/    # catshredia.ru
└── Coursework/          # runews.catshredia.ru
```

---

## 4. Подготовка docker-compose (обязательно)

На одном VPS **хостовый Nginx** занимает порты 80/443. Контейнеры должны слушать только localhost.

### 4.1. catshredias-blog

В [docker-compose.yml](../docker-compose.yml) для сервиса `web`:

```yaml
ports:
  - "127.0.0.1:3000:3000"
```

Для `db` порт `55433:5432` можно оставить — он нужен только для подключения с ПК через SSH-туннель; в production на VPS его можно убрать или привязать к `127.0.0.1:55433:5432`.

### 4.2. Coursework (Runews)

В [Coursework/docker-compose.yml](../../Coursework/docker-compose.yml) для сервиса `web`:

```yaml
ports:
  - "127.0.0.1:8080:80"
```

**Не** публиковать Runews на `80:80` — иначе конфликт с Nginx.

---

## 5. Переменные окружения

### 5.1. catshredias-blog (`~/apps/catshredias-blog/.env`)

```bash
cd ~/apps/catshredias-blog
cp .env.example .env
chmod 600 .env
nano .env
```

Production-пример:

```env
POSTGRES_DB=portfolio_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=НАДЁЖНЫЙ_ПАРОЛЬ_1

AUTH_SECRET=СГЕНЕРИРОВАТЬ_openssl_rand_base64_32
AUTH_URL=https://catshredia.ru
NEXT_PUBLIC_SITE_URL=https://catshredia.ru

ADMIN_EMAIL=admin@catshredia.ru
ADMIN_PASSWORD=НАДЁЖНЫЙ_ПАРОЛЬ_АДМИНКИ

# Опционально
# CRON_SECRET=...
# NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
# TURNSTILE_SECRET_KEY=...
```

Сгенерировать секрет:

```bash
openssl rand -base64 32
```

### 5.2. Coursework (`~/apps/Coursework/.env`)

```bash
cd ~/apps/Coursework
cp .env.example .env
chmod 600 .env
nano .env
```

Production-пример:

```env
PUBLIC_URL=https://runews.catshredia.ru

POSTGRES_DB=news_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=НАДЁЖНЫЙ_ПАРОЛЬ_2

JWT_KEY=ДЛИННЫЙ_СЕКРЕТ_32_СИМВОЛА_И_БОЛЬШЕ

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_FROM=noreply@catshredia.ru
SMTP_USERNAME=...
SMTP_PASSWORD=...
SMTP_USE_SSL=true
SMTP_PREFER_IPV4=false
```

`PUBLIC_URL` — **только** поддомен Runews, без `/` в конце. От него зависят JWT, CORS и ссылки в письмах.

---

## 6. Первый запуск Docker-стеков

### 6.1. Runews

```bash
cd ~/apps/Coursework
docker compose up -d --build
docker compose ps
```

Проверка локально на сервере:

```bash
curl -I http://127.0.0.1:8080/
curl -s http://127.0.0.1:8080/api/tags | head -c 200
```

### 6.2. catshredias-blog

```bash
cd ~/catshredias-blog
git pull
docker compose up -d --build
```

#### npm registry на VPS (GitVerse)

Если `registry.npmjs.org` недоступен или медленный, в `.env` добавьте:

```env
NPM_REGISTRY=https://npm-mirror.gitverse.ru
```

Сборка подхватит зеркало через `Dockerfile` → `npm config set registry`. Документация: [GitVerse NPM mirror](https://gitverse.ru/docs/artifactory/registry-mirrors/npm-mirror/).

```bash
docker compose build web
docker compose up -d
```

**Не запускайте `npm install` на хосте VPS** — там Node 18, а проекту нужен Node 22; сборка идёт только внутри Docker.

Публичные страницы с Prisma помечены `dynamic = "force-dynamic"` — `**docker compose build` не требует запущенной БД** (данные читаются при первом запросе после `up`).

#### Ошибка `Environment variable not found: DATABASE_URL` при `npm run build`

Старая версия кода вызывала Prisma на этапе `next build`. Обновите репозиторий (`git pull`) — сборка образа не обращается к PostgreSQL. БД нужна только при **запуске** контейнера (`docker compose up`).

#### Ошибка `npm ci` / lock file out of sync

```text
Missing: @emnapi/runtime@1.10.0 from lock file
```

Lockfile должен быть собран под Linux. На ПК с Docker:

```bash
docker run --rm \
  -v "$PWD/package.json:/app/package.json" \
  -v "$PWD/package-lock.json:/app/package-lock.json" \
  -w /app node:22-alpine sh -c "npm install"
```

Закоммитьте обновлённый `package-lock.json`, на VPS: `git pull`, затем `docker compose build web`.

Если на VPS остался битый `node_modules` от попыток `npm install`:

```bash
rm -rf ~/catshredias-blog/node_modules
```

Применить миграции и seed (первый раз или после `down -v`):

```bash
docker compose --profile tools run --rm migrate
docker compose --profile tools run --rm seed
docker compose up -d web
```

Сервисы `migrate` и `seed` используют builder-образ с полным `node_modules` (Prisma **6.x**). **Не используйте `docker compose exec web npx prisma`** — в production-контейнере `npx` скачает Prisma 7.

Проверка:

```bash
curl -s http://127.0.0.1:3000/api/health
curl -I http://127.0.0.1:3000/
```

После seed войти в админку: `https://catshredia.ru/admin/login` (учётка из `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

### 6.3. Сборка образа `web` на ПК (если на VPS нет Docker Hub / npm)

На VPS ошибки вида `node:22-alpine: i/o timeout` или падение на `npm ci` — соберите образ **локально**, где есть интернет, и перенесите `.tar` на сервер.

**Базовые образы** (если на ПК ещё нет):

```bash
docker pull node:22-alpine
docker pull postgres:16-alpine
```

**На ПК** в каталоге проекта (Docker Desktop запущен):

```bash
cd path/to/catshredias-blog

# Сборка Next.js внутри Docker (npm ci + next build)
docker compose build web

# Имя образа Compose: catshredias-blog-web (проверить)
docker images | grep catshredias-blog

# Явный тег (удобно для переноса)
docker tag catshredias-blog-web:latest catshredias-blog-web:latest

# Архив: web + postgres для db
docker save catshredias-blog-web:latest postgres:16-alpine -o portfolio-stack.tar

scp portfolio-stack.tar deploy@IP_СЕРВЕРА:~/
```

**На VPS:**

```bash
docker load -i ~/portfolio-stack.tar
docker images | grep -E 'catshredias-blog-web|postgres'

cd ~/catshredias-blog
docker compose up -d --no-build
```

`--no-build` — не пересобирать на сервере, использовать загруженный образ.

**Обновление после изменений в коде:** снова `docker compose build web` на ПК → `docker save` → `scp` → `docker load` → на VPS:

```bash
cd ~/catshredias-blog
docker compose up -d --no-build web
docker compose --profile tools run --rm migrate
```

---

## 7. Nginx на хосте

Установка:

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 7.1. Временные HTTP-сайты (для Certbot)

Сначала поднимите HTTP без SSL, чтобы Certbot мог пройти проверку.

`**/etc/nginx/sites-available/catshredia.ru`:**

```nginx
server {
    listen 80;
    server_name catshredia.ru www.catshredia.ru;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

`**/etc/nginx/sites-available/runews.catshredia.ru`:**

```nginx
server {
    listen 80;
    server_name runews.catshredia.ru;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /hubs/ {
        proxy_pass http://127.0.0.1:8080/hubs/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Включить сайты:

```bash
sudo ln -sf /etc/nginx/sites-available/runews.catshredia.ru /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/catshredia.ru /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Проверка по HTTP:

```bash
curl -I http://catshredia.ru/
curl -I http://runews.catshredia.ru/
```

### 7.2. HTTPS (Let's Encrypt)

```bash
sudo certbot --nginx -d catshredia.ru -d www.catshredia.ru
sudo certbot --nginx -d runews.catshredia.ru
```

Certbot добавит SSL-блоки и редирект HTTP → HTTPS.

После выпуска сертификатов обновите `.env` на **https** (если ещё не сделали) и перезапустите web-контейнеры:

```bash
cd ~/apps/catshredias-blog && docker compose up -d web
cd ~/apps/Coursework && docker compose up -d api web
```

### 7.3. Кэш статики Next.js (опционально)

В HTTPS-блок `catshredia.ru` можно добавить:

```nginx
location /_next/static/ {
    proxy_pass http://127.0.0.1:3000;
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

Готовые примеры конфигов: [nginx/catshredia.ru.conf.example](nginx/catshredia.ru.conf.example), [nginx/runews.catshredia.ru.conf.example](nginx/runews.catshredia.ru.conf.example).

---

## 8. Связка портфолио и Runews в контенте

В админке портфолио (`/admin/projects`) создайте проект **Runews**:


| Поле        | Пример                                                   |
| ----------- | -------------------------------------------------------- |
| Название    | Runews                                                   |
| Live URL    | `https://runews.catshredia.ru`                           |
| Репозиторий | ссылка на GitHub                                         |
| Стек        | Blazor WASM, ASP.NET Core 8, PostgreSQL, Docker, SignalR |
| Описание    | новостной агрегатор с модерацией, RSS, комментариями     |


Опционально в Runews на странице «О сервисе» добавьте ссылку на `https://catshredia.ru`.

---

## 9. Cron: отложенные посты и уведомления

На VPS (не Vercel Cron):

```bash
crontab -e
```

```cron
*/5 * * * * curl -fsS -X POST -H "Authorization: Bearer ВАШ_CRON_SECRET" https://catshredia.ru/api/cron/publish-scheduled >/dev/null 2>&1
0 9 * * 1 curl -fsS -X POST -H "Authorization: Bearer ВАШ_CRON_SECRET" "https://catshredia.ru/api/cron/notify-digest?period=weekly" >/dev/null 2>&1
```

- `publish-scheduled` — публикация отложенных постов (каждые 5 минут).
- `notify-digest?period=weekly` — дайджест непросмотренных комментариев (по умолчанию в настройках «раз в неделю»; пример: понедельник 09:00). Для режима «раз в сутки» добавьте `period=daily`.

`CRON_SECRET` задайте в `.env` catshredias-blog.

### Telegram (опционально)

В `.env`:

```env
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=ваш_chat_id
```

Получить `chat_id`: напишите боту `/start`, затем `curl "https://api.telegram.org/bot<TOKEN>/getUpdates"`. Включение типов уведомлений — в админке `/admin/notifications`.

---

## 10. Бэкапы

### PostgreSQL портфолио

```bash
cd ~/apps/catshredias-blog
./scripts/backup-db.sh
```

Cron (ежедневно в 03:00):

```cron
0 3 * * * cd /root/apps/catshredias-blog && BACKUP_DIR=/root/backups/portfolio ./scripts/backup-db.sh
```

### PostgreSQL Runews

```bash
docker exec runews-db pg_dump -U postgres news_db | gzip > ~/backups/runews/news_db_$(date +%Y%m%d).sql.gz
```

### Загрузки

- `catshredias-blog`: Docker volume `uploads`
- Runews: Docker volume `api_uploads`

Периодически копируйте тома или делайте snapshot диска VPS.

---

## 11. Обновление приложений

### catshredias-blog

```bash
cd ~/apps/catshredias-blog
git pull
docker compose up -d --build
docker compose --profile tools run --rm migrate
```

### Runews

```bash
cd ~/apps/Coursework
git pull
docker compose up -d --build
```

Миграции Runews применяются автоматически при старте API.

---

## 12. Мониторинг и диагностика

```bash
# Состояние контейнеров
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Логи
cd ~/apps/catshredias-blog && docker compose logs -f --tail=100 web
cd ~/apps/Coursework && docker compose logs -f --tail=100 api web

# Health
curl -s https://catshredia.ru/api/health
curl -s https://runews.catshredia.ru/api/tags | head -c 200
docker exec runews-web wget -qO- http://api:8080/health

# PUBLIC_URL Runews
docker exec runews-api printenv | grep -E 'PUBLIC_URL|App__BaseUrl|Jwt__Issuer'

# Ресурсы
docker stats --no-stream
```

---

## 13. Чеклист приёмки

- `https://catshredia.ru` открывается, валидный TLS
- `https://catshredia.ru/admin/login` — вход администратора
- `https://runews.catshredia.ru` — лента Runews
- API Runews: `curl -s https://runews.catshredia.ru/api/tags`
- SignalR: комментарии на статье обновляются в реальном времени
- Письма Runews (регистрация/сброс пароля) ведут на `runews.catshredia.ru`
- В карточке проекта Runews на портфолио — рабочая ссылка live
- Снаружи закрыты порты 3000, 8080, 55432, 55433
- `.env` с правами `600`, секреты не в git
- Настроены бэкапы обеих БД и загрузок

---

## 14. Типичные проблемы


| Симптом                                  | Причина                                | Решение                                                                 |
| ---------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| `502 Bad Gateway` на домене              | Контейнер не запущен или неверный порт | `docker compose ps`, проверить `127.0.0.1:3000` / `:8080`               |
| Nginx не стартует                        | Runews занял `:80`                     | Изменить Runews на `127.0.0.1:8080:80`                                  |
| Ссылки в email ведут на localhost        | Неверный `PUBLIC_URL`                  | `.env` → `https://runews.catshredia.ru`, `docker compose up -d api web` |
| Auth.js / OAuth ошибки                   | `AUTH_URL` не совпадает с браузером    | `AUTH_URL=https://catshredia.ru`                                        |
| WebSocket комментариев Runews обрывается | Нет Upgrade в Nginx                    | Блок `location /hubs/` (см. §7.1)                                       |
| Prisma ошибка при старте blog            | Нет миграций                           | `docker compose --profile tools run --rm migrate`                     |


---

## Связанная документация

- [README.md](../README.md) — локальная разработка catshredias-blog
- [Coursework/README.md](../../Coursework/README.md) — Runews, переменные `.env`
- [Coursework/docs/server-setup.md](../../Coursework/docs/server-setup.md) — VPS Timeweb, Docker, firewall

