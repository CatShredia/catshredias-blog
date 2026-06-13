import { describe, expect, it } from "vitest";

import {
  buildTextStyleMarkdown,
  splitTextIntoStyleNodes,
} from "@/lib/markdown-text-style";

describe("buildTextStyleMarkdown", () => {
  it("wraps bold text with markdown emphasis", () => {
    expect(buildTextStyleMarkdown("bold", "важно")).toBe("**важно**");
  });

  it("wraps semibold text with custom markers", () => {
    expect(buildTextStyleMarkdown("semibold", "текст")).toBe(
      "[semibold]текст[/semibold]",
    );
  });
});

describe("splitTextIntoStyleNodes", () => {
  it("splits semibold markers into html spans", () => {
    const nodes = splitTextIntoStyleNodes(
      "Текст [semibold]важно[/semibold] дальше.",
    );
    expect(nodes).toHaveLength(3);
    expect(nodes[1]).toEqual({
      type: "html",
      value: '<span class="markdown-text-semibold">важно</span>',
    });
  });

  it("returns plain text when no custom markers are present", () => {
    expect(splitTextIntoStyleNodes("обычный текст")).toEqual([
      { type: "text", value: "обычный текст" },
    ]);
  });
});
