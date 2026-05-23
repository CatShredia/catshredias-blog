import { describe, expect, it } from "vitest";

import { isPathOrUrl } from "@/lib/validations/path-or-url";

describe("isPathOrUrl", () => {
  it("accepts empty, relative paths and absolute URLs", () => {
    expect(isPathOrUrl("")).toBe(true);
    expect(isPathOrUrl("/api/uploads/file.pdf")).toBe(true);
    expect(isPathOrUrl("https://example.com/a.pdf")).toBe(true);
  });

  it("rejects invalid strings", () => {
    expect(isPathOrUrl("not-a-url")).toBe(false);
  });
});
