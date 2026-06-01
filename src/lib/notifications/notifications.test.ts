import { NotifyMode } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { shouldDigestComments, shouldNotify } from "@/lib/notifications/settings";

describe("shouldNotify", () => {
  it("contact instant only when INSTANT", () => {
    expect(shouldNotify(NotifyMode.INSTANT, "contact")).toBe(true);
    expect(shouldNotify(NotifyMode.WEEKLY, "contact")).toBe(false);
    expect(shouldNotify(NotifyMode.OFF, "contact")).toBe(false);
  });

  it("comment instant only when INSTANT", () => {
    expect(shouldNotify(NotifyMode.INSTANT, "comment")).toBe(true);
    expect(shouldNotify(NotifyMode.DAILY, "comment")).toBe(false);
  });
});

describe("shouldDigestComments", () => {
  it("daily and weekly enable digest", () => {
    expect(shouldDigestComments(NotifyMode.WEEKLY)).toBe(true);
    expect(shouldDigestComments(NotifyMode.DAILY)).toBe(true);
    expect(shouldDigestComments(NotifyMode.INSTANT)).toBe(false);
  });
});
