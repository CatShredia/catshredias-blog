import { logger } from "@/lib/logger";

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
    const response = await fetch(
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
    logger.error("Telegram sendMessage error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return false;
  }
}

/** Fire-and-forget: не блокирует HTTP-ответ API. */
export function sendTelegramMessageAsync(options: TelegramSendOptions) {
  void sendTelegramMessage(options).catch(() => undefined);
}
