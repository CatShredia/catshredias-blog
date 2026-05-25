import { describe, expect, it } from "vitest";

import { extractMarkdownHeadings } from "@/lib/markdown-headings";

describe("extractMarkdownHeadings", () => {
  it("extracts h2 and h3 with slug ids", () => {
    const md = `# Title\n## First\n### Nested\n## Second`;
    const headings = extractMarkdownHeadings(md);
    expect(headings).toEqual([
      { level: 2, text: "First", id: "first" },
      { level: 3, text: "Nested", id: "nested" },
      { level: 2, text: "Second", id: "second" },
    ]);
  });
});
