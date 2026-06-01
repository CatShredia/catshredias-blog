"use client";

import { NotifyMode } from "@prisma/client";
import { useState } from "react";

import { updateNotificationSettingsAction } from "@/app/(admin)/admin/notifications/actions";
import { Button } from "@/components/ui/button";
import type { NotificationSettings } from "@/lib/notifications";

const modeLabels: Record<NotifyMode, string> = {
  INSTANT: "Сразу",
  DAILY: "Раз в сутки (дайджест)",
  WEEKLY: "Раз в неделю (дайджест)",
  OFF: "Выключено",
};

type NotificationSettingsFormProps = {
  settings: NotificationSettings;
  hasTelegramToken: boolean;
};

export function NotificationSettingsForm({
  settings,
  hasTelegramToken,
}: NotificationSettingsFormProps) {
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={async (formData) => {
        await updateNotificationSettingsAction(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
      className="space-y-4 rounded-xl border border-border bg-card p-5"
    >
      <h2 className="font-semibold">Настройки уведомлений</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium">Форма контактов</label>
          <select
            name="contactMode"
            defaultValue={settings.contactMode}
            className="min-h-10 w-full rounded-lg border border-border bg-background px-2 text-sm"
          >
            <option value={NotifyMode.INSTANT}>{modeLabels.INSTANT}</option>
            <option value={NotifyMode.OFF}>{modeLabels.OFF}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Жалобы</label>
          <select
            name="reportMode"
            defaultValue={settings.reportMode}
            className="min-h-10 w-full rounded-lg border border-border bg-background px-2 text-sm"
          >
            <option value={NotifyMode.INSTANT}>{modeLabels.INSTANT}</option>
            <option value={NotifyMode.OFF}>{modeLabels.OFF}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Комментарии</label>
          <select
            name="commentMode"
            defaultValue={settings.commentMode}
            className="min-h-10 w-full rounded-lg border border-border bg-background px-2 text-sm"
          >
            <option value={NotifyMode.INSTANT}>{modeLabels.INSTANT}</option>
            <option value={NotifyMode.DAILY}>{modeLabels.DAILY}</option>
            <option value={NotifyMode.WEEKLY}>{modeLabels.WEEKLY}</option>
            <option value={NotifyMode.OFF}>{modeLabels.OFF}</option>
          </select>
        </div>
      </div>

      <fieldset className="space-y-3 border-t border-border pt-4">
        <legend className="text-sm font-medium">Telegram</legend>
        {!hasTelegramToken ? (
          <p className="text-xs text-muted">
            Задайте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env на сервере.
          </p>
        ) : null}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="telegramEnabled"
            value="on"
            defaultChecked={settings.telegramEnabled}
          />
          Включить отправку в Telegram
        </label>
        <div>
          <label className="mb-1 block text-xs font-medium">
            Chat ID (необязательно, если задан в .env)
          </label>
          <input
            name="telegramChatId"
            defaultValue={settings.telegramChatId ?? ""}
            placeholder="123456789"
            className="min-h-10 w-full max-w-md rounded-lg border border-border bg-background px-3 text-sm font-mono"
          />
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="telegramContact"
              value="on"
              defaultChecked={settings.telegramContact}
            />
            Контакты
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="telegramReport"
              value="on"
              defaultChecked={settings.telegramReport}
            />
            Жалобы
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="telegramComments"
              value="on"
              defaultChecked={settings.telegramComments}
            />
            Комментарии
          </label>
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit">Сохранить настройки</Button>
        {saved ? <span className="text-xs text-muted">Сохранено</span> : null}
      </div>
    </form>
  );
}
