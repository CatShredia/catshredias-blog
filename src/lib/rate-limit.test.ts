import { describe, expect, it } from "vitest";

import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests under limit", () => {
    const key = `test-${Date.now()}`;
    expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    expect(rateLimit(key, 3, 60_000).ok).toBe(true);
  });

  it("blocks after limit exceeded", () => {
    const key = `block-${Date.now()}`;
    rateLimit(key, 1, 60_000);
    expect(rateLimit(key, 1, 60_000).ok).toBe(false);
  });
});
