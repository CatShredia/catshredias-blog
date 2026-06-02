import { afterEach, describe, expect, it } from "vitest";

import { getTelegramProxyUrl, redactProxyUrl } from "./telegram-fetch";

describe("getTelegramProxyUrl", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("prefers TELEGRAM_PROXY_URL over HTTPS_PROXY", () => {
    process.env.TELEGRAM_PROXY_URL = "http://telegram-proxy:8080";
    process.env.HTTPS_PROXY = "http://other:3128";
    expect(getTelegramProxyUrl()).toBe("http://telegram-proxy:8080");
  });

  it("falls back to HTTPS_PROXY", () => {
    delete process.env.TELEGRAM_PROXY_URL;
    process.env.HTTPS_PROXY = "http://fallback:3128";
    expect(getTelegramProxyUrl()).toBe("http://fallback:3128");
  });

  it("returns undefined when unset", () => {
    delete process.env.TELEGRAM_PROXY_URL;
    delete process.env.HTTPS_PROXY;
    delete process.env.https_proxy;
    expect(getTelegramProxyUrl()).toBeUndefined();
  });
});

describe("redactProxyUrl", () => {
  it("hides credentials", () => {
    expect(redactProxyUrl("http://user:secret@proxy:8080")).toBe(
      "http://***:***@proxy:8080/",
    );
  });
});
