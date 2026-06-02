import { logger } from "@/lib/logger";

import { telegramFetch } from "./telegram-fetch";

function logTelegramFetchError(error: unknown) {
  const payload: Record<string, unknown> = {
    error: error instanceof Error ? error.message : "unknown",
  };
  if (error instanceof Error) {
    payload.name = error.name;
    const cause = error.cause;
    if (cause instanceof Error) {
      payload.cause = cause.message;
      const code = (cause as NodeJS.ErrnoException).code;
      if (code) payload.causeCode = code;
    } else if (cause && typeof cause === "object" && "code" in cause) {
      payload.causeCode = String((cause as { code?: unknown }).code);
    }
  }
  logger.error("Telegram sendMessage error", payload);
}

type TelegramSendOptions = {
  chatId: string;
  text: string;
};

export async function sendTelegramMessage({
  chatId,
  text,
}: TelegramSendOptions): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token || !chatId) return false;

  try {
    const response = await telegramFetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.slice(0, 4096),
          disable_web_page_preview: true,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      logger.error("Telegram sendMessage failed", {
        status: response.status,
        body: body.slice(0, 500),
      });
      return false;
    }

    logger.info("Telegram sendMessage ok", { chatId });
    return true;
  } catch (error) {
    logTelegramFetchError(error);
    return false;
  }
}

/** Fire-and-forget: не блокирует HTTP-ответ API. */
export function sendTelegramMessageAsync(options: TelegramSendOptions) {
  void sendTelegramMessage(options).catch(() => undefined);
}
