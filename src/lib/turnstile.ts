/** Включён только если заданы и публичный, и секретный ключ (оба в .env). */
export function isTurnstileEnabled(): boolean {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return Boolean(secret && siteKey);
}

export async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  if (!isTurnstileEnabled()) {
    return true;
  }
  if (!token) return false;

  const secret = process.env.TURNSTILE_SECRET_KEY!.trim();

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
    },
  );

  const data = (await response.json()) as { success?: boolean };
  return data.success === true;
}
