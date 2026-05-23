# Деплой на VPS (catshredia.ru + runews)

## Схема

```text
Nginx :443
├── catshredia.ru        → portfolio-web:3000 (этот репозиторий)
└── runews.catshredia.ru → runews-web:80 (Coursework/docker)
```

У каждого сервиса **своя** PostgreSQL (портфолио: `55433`, Runews: `55432` или внутренняя сеть Docker).

## Nginx (черновик)

```nginx
server {
    listen 443 ssl http2;
    server_name catshredia.ru www.catshredia.ru;

    ssl_certificate     /etc/letsencrypt/live/catshredia.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/catshredia.ru/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

Runews — отдельный `server_name` на порт стека Coursework (см. [server-setup.md](../../Coursework/docs/server-setup.md)).

## Переменные production

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=https://catshredia.ru
NEXT_PUBLIC_SITE_URL=https://catshredia.ru
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
```

## Планировщик постов (этап 3+)

Не Vercel Cron — системный cron или sidecar:

```bash
*/5 * * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://catshredia.ru/api/cron/publish-scheduled
```

## Бэкапы

- `pg_dump` для `portfolio_db` по расписанию
- volume `uploads` — rsync или snapshot диска VPS
