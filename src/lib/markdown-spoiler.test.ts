import { describe, expect, it } from "vitest";

import { splitMarkdownSpoilers } from "@/lib/markdown-spoiler";

describe("splitMarkdownSpoilers", () => {
  it("splits spoiler block", () => {
    const input = `Вступление

:::spoiler Подробности
Секретный **текст**
:::

Конец`;

    const segments = splitMarkdownSpoilers(input);
    expect(segments).toHaveLength(3);
    expect(segments[1]).toEqual({
      kind: "spoiler",
      title: "Подробности",
      content: "Секретный **текст**",
    });
  });
});
