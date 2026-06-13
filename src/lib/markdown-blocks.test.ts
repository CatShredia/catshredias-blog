import { describe, expect, it } from "vitest";

import {
  appendMarkdownBlock,
  joinMarkdownBlocks,
  replaceMarkdownBlock,
  splitMarkdownBlocks,
} from "@/lib/markdown-blocks";

describe("splitMarkdownBlocks", () => {
  it("returns a single empty block for empty source", () => {
    expect(splitMarkdownBlocks("")).toEqual({
      blocks: [""],
      separator: "\n\n",
    });
  });

  it("splits paragraphs on blank lines", () => {
    const input = "# Title\n\nParagraph one.\n\nParagraph two.";
    expect(splitMarkdownBlocks(input).blocks).toEqual([
      "# Title",
      "Paragraph one.",
      "Paragraph two.",
    ]);
  });

  it("keeps fenced code blocks intact", () => {
    const input = "Intro\n\n```js\nconst a = 1;\n\nstill code\n```\n\nAfter";
    expect(splitMarkdownBlocks(input).blocks).toEqual([
      "Intro",
      "```js\nconst a = 1;\n\nstill code\n```",
      "After",
    ]);
  });

  it("treats a blank line as a block boundary", () => {
    const input = "Line one\n\nLine three";
    expect(splitMarkdownBlocks(input).blocks).toEqual(["Line one", "Line three"]);
  });
});

describe("replaceMarkdownBlock", () => {
  it("replaces only the selected block", () => {
    const source = "A\n\nB\n\nC";
    expect(replaceMarkdownBlock(source, 1, "Updated")).toBe("A\n\nUpdated\n\nC");
  });
});

describe("appendMarkdownBlock", () => {
  it("appends with a blank line separator", () => {
    expect(appendMarkdownBlock("Existing", "> [!note]\n> Text")).toBe(
      "Existing\n\n> [!note]\n> Text",
    );
  });

  it("returns the block when source is empty", () => {
    expect(appendMarkdownBlock("", "New block")).toBe("New block");
  });
});

describe("joinMarkdownBlocks", () => {
  it("joins blocks with the default separator", () => {
    expect(joinMarkdownBlocks(["A", "B"])).toBe("A\n\nB");
  });
});
