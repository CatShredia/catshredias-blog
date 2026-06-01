import Link from "next/link";
import { AdminNotificationType } from "@prisma/client";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/(admin)/admin/notifications/actions";
import { NotificationSettingsForm } from "@/components/admin/notification-settings-form";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { formatDateRu } from "@/lib/dates";
import {
  countUnreadNotifications,
  getNotificationSettings,
  listNotifications,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const typeLabels: Record<AdminNotificationType, string> = {
  CONTACT: "Контакты",
  REPORT: "Жалоба",
  COMMENT_INSTANT: "Комментарий",
  COMMENT_DIGEST: "Комментарии (дайджест)",
};

type PageProps = {
  searchParams: Promise<{ filter?: string; highlight?: string }>;
};

export default async function AdminNotificationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const unreadOnly = params.filter === "unread";

  const [settings, notifications, unreadCount, highlightContact] =
    await Promise.all([
      getNotificationSettings(),
      listNotifications({ unreadOnly, limit: 80 }),
      countUnreadNotifications(),
      params.highlight
        ? prisma.contactMessage.findUnique({
            where: { id: params.highlight },
          })
        : Promise.resolve(null),
    ]);

  const hasTelegramToken = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Уведомления</h1>
          <p className="mt-1 text-sm text-muted">
            Непрочитанных: {unreadCount}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink
            href="/admin/notifications"
            variant={unreadOnly ? "secondary" : "primary"}
          >
            Все
          </ButtonLink>
          <ButtonLink
            href="/admin/notifications?filter=unread"
            variant={unreadOnly ? "primary" : "secondary"}
          >
            Непрочитанные
          </ButtonLink>
          {unreadCount > 0 ? (
            <form action={markAllNotificationsReadAction}>
              <Button type="submit" variant="secondary">
                Прочитать все
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      <div className="mt-8">
        <NotificationSettingsForm
          settings={settings}
          hasTelegramToken={hasTelegramToken}
        />
      </div>

      {highlightContact ? (
        <div className="mt-6 rounded-xl border border-accent/40 bg-card p-5">
          <h2 className="font-semibold">Сообщение с формы</h2>
          <p className="mt-2 text-sm text-muted">
            {highlightContact.name} · {highlightContact.email} ·{" "}
            {formatDateRu(highlightContact.createdAt)}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm">{highlightContact.message}</p>
        </div>
      ) : null}

      <ul className="mt-8 space-y-3">
        {notifications.length === 0 ? (
          <li className="rounded-xl border border-border bg-card p-6 text-muted">
            Нет уведомлений
          </li>
        ) : (
          notifications.map((item) => {
            const isUnread = !item.readAt;
            const isExternal = item.href.startsWith("http");
            const openHref = isExternal ? item.href : item.href;

            return (
              <li
                key={item.id}
                className={`rounded-xl border bg-card p-4 ${
                  isUnread ? "border-accent/50" : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted">
                      {typeLabels[item.type]} · {formatDateRu(item.createdAt)}
                    </p>
                    <p className="mt-1 font-semibold">{item.title}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
                      {item.body}
                    </p>
                    <Link
                      href={openHref}
                      className="mt-2 inline-block text-sm text-accent underline"
                      target={item.href.startsWith("/blog") ? "_blank" : undefined}
                      rel={
                        item.href.startsWith("/blog") ? "noopener noreferrer" : undefined
                      }
                    >
                      Открыть →
                    </Link>
                  </div>
                  {isUnread ? (
                    <form action={markNotificationReadAction.bind(null, item.id)}>
                      <Button type="submit" variant="secondary">
                        Прочитано
                      </Button>
                    </form>
                  ) : null}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </Container>
  );
}
