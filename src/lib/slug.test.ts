import { describe, expect, it } from "vitest";

import { decodeRouteSlug, encodeRouteSlug, slugify } from "@/lib/slug";

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

describe("decodeRouteSlug", () => {
  it("decodes percent-encoded cyrillic", () => {
    const encoded =
      "%D1%80%D0%B5%D1%86%D0%B5%D0%BD%D0%B7%D0%B8%D1%8F-%D0%BA%D0%BD%D0%B8%D0%B3%D0%B8";
    expect(decodeRouteSlug(encoded)).toBe("рецензия-книги");
  });

  it("leaves latin slug unchanged", () => {
    expect(decodeRouteSlug("test1-bd390d")).toBe("test1-bd390d");
  });
});

describe("encodeRouteSlug", () => {
  it("encodes cyrillic for URLs", () => {
    expect(encodeRouteSlug("разработка")).toBe(
      "%D1%80%D0%B0%D0%B7%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D0%BA%D0%B0",
    );
  });
});
