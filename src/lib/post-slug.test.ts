import { describe, expect, it } from "vitest";

import { generatePostSlug, stripPostSlugSuffix } from "@/lib/post-slug";
import { slugify } from "@/lib/slug";

describe("generatePostSlug", () => {
  it("appends random hex suffix to slugified title", () => {
    const slug = generatePostSlug("Hello World");
    expect(slug).toMatch(/^hello-world-[a-f0-9]{6}$/);
  });

  it("strips existing suffix before generating", () => {
    const slug = generatePostSlug("hello-world-abc123");
    expect(slug).toMatch(/^hello-world-[a-f0-9]{6}$/);
    expect(slug).not.toBe("hello-world-abc123");
  });
});

describe("stripPostSlugSuffix", () => {
  it("removes trailing random suffix", () => {
    expect(stripPostSlugSuffix("nextjs-app-router-a1b2c3")).toBe(
      "nextjs-app-router",
    );
    expect(stripPostSlugSuffix(slugify("Plain title"))).toBe(
      slugify("Plain title"),
    );
  });
});
