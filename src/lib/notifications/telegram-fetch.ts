import { fetch as undiciFetch, ProxyAgent, type Dispatcher } from "undici";

import { logger } from "@/lib/logger";

/** Прокси только для запросов к Telegram API (не влияет на остальной сайт). */
export function getTelegramProxyUrl(): string | undefined {
  const url =
    process.env.TELEGRAM_PROXY_URL?.trim() ||
    process.env.HTTPS_PROXY?.trim() ||
    process.env.https_proxy?.trim();
  return url || undefined;
}

export function redactProxyUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "***";
    if (parsed.username) parsed.username = "***";
    return parsed.toString();
  } catch {
    return "(invalid proxy url)";
  }
}

let cachedDispatcher: Dispatcher | undefined;
let proxyLogged = false;

function getProxyDispatcher(): Dispatcher | undefined {
  const proxyUrl = getTelegramProxyUrl();
  if (!proxyUrl) return undefined;
  if (!cachedDispatcher) {
    cachedDispatcher = new ProxyAgent(proxyUrl);
    if (!proxyLogged) {
      proxyLogged = true;
      logger.info("Telegram requests use proxy", {
        proxy: redactProxyUrl(proxyUrl),
      });
    }
  }
  return cachedDispatcher;
}

type TelegramFetchInit = {
  method?: string;
  headers?: HeadersInit;
  body?: string;
};

export async function telegramFetch(input: string, init?: TelegramFetchInit) {
  const dispatcher = getProxyDispatcher();
  if (!dispatcher) {
    return fetch(input, init);
  }

  return undiciFetch(input, {
    method: init?.method,
    headers: init?.headers,
    body: init?.body,
    dispatcher,
  });
}
