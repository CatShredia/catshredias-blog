import { describe, expect, it } from "vitest";

import { tagHref } from "@/lib/markdown-tags";
import {
  resolveWikiLinkSlug,
  type WikiLinkTarget,
} from "@/lib/markdown-wikilink";

const targets: WikiLinkTarget[] = [
  { title: "Hello World", slug: "hello-world" },
  { title: "Разработка", slug: "razrabotka" },
];

describe("resolveWikiLinkSlug", () => {
  it("resolves by slug", () => {
    expect(resolveWikiLinkSlug("hello-world", targets)).toBe("hello-world");
  });

  it("resolves by title", () => {
    expect(resolveWikiLinkSlug("Hello World", targets)).toBe("hello-world");
  });

  it("resolves cyrillic title", () => {
    expect(resolveWikiLinkSlug("Разработка", targets)).toBe("razrabotka");
  });

  it("falls back to slugify for unknown names", () => {
    expect(resolveWikiLinkSlug("New Post", targets)).toBe("new-post");
  });
});

describe("tagHref", () => {
  it("builds blog tag query URL", () => {
    expect(tagHref("фантастика")).toBe(
      "/blog?tag=%D1%84%D0%B0%D0%BD%D1%82%D0%B0%D1%81%D1%82%D0%B8%D0%BA%D0%B0",
    );
  });

  it("slugifies latin tags", () => {
    expect(tagHref("DevOps")).toBe("/blog?tag=devops");
  });
});
