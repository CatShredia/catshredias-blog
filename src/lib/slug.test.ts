import { describe, expect, it } from "vitest";

import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("converts spaces to hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("keeps cyrillic characters", () => {
    expect(slugify("Разработка")).toBe("разработка");
  });

  it("trims duplicate hyphens", () => {
    expect(slugify("foo   bar")).toBe("foo-bar");
  });
});
