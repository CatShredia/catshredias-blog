import { describe, expect, it } from "vitest";

import { extractMarkdownHeadings } from "@/lib/markdown-headings";

describe("extractMarkdownHeadings", () => {
  it("extracts all heading levels with slug ids", () => {
    const md = `# Title\n## First\n### Nested\n#### Deep\n##### More\n###### Leaf\n## Second`;
    const headings = extractMarkdownHeadings(md);
    expect(headings).toEqual([
      { level: 1, text: "Title", id: "title" },
      { level: 2, text: "First", id: "first" },
      { level: 3, text: "Nested", id: "nested" },
      { level: 4, text: "Deep", id: "deep" },
      { level: 5, text: "More", id: "more" },
      { level: 6, text: "Leaf", id: "leaf" },
      { level: 2, text: "Second", id: "second" },
    ]);
  });

  it("ignores single # without space", () => {
    expect(extractMarkdownHeadings("#not-a-heading")).toEqual([]);
  });

  it("ignores ordered and unordered lists", () => {
    const md = `## Section
1. Создать пользователя
2. Дать права sudo
- пункт один
* пункт два
### Real subsection`;
    expect(extractMarkdownHeadings(md)).toEqual([
      { level: 2, text: "Section", id: "section" },
      { level: 3, text: "Real subsection", id: "real-subsection" },
    ]);
  });

  it("ignores headings that look like numbered list steps", () => {
    const md = `## 1. Создать пользователя
## 2. Дать права sudo
## Настоящий раздел`;
    expect(extractMarkdownHeadings(md)).toEqual([
      { level: 2, text: "Настоящий раздел", id: "настоящий-раздел" },
    ]);
  });

  it("ignores headings inside fenced code", () => {
    const md = `\`\`\`
## not a toc item
\`\`\`
## Visible`;
    expect(extractMarkdownHeadings(md)).toEqual([
      { level: 2, text: "Visible", id: "visible" },
    ]);
  });
});
