import { describe, expect, it } from "vitest";

import {
  formatCommentsGroupedByPost,
  formatInstantCommentTelegram,
} from "@/lib/notifications/comment-format";

describe("formatCommentsGroupedByPost", () => {
  it("groups comments under post titles", () => {
    const text = formatCommentsGroupedByPost([
      {
        authorName: "Аня",
        content: "Первый",
        post: { title: "Пост A", slug: "post-a" },
      },
      {
        authorName: "Борис",
        content: "Второй",
        post: { title: "Пост A", slug: "post-a" },
      },
      {
        authorName: "Вера",
        content: "Третий",
        post: { title: "Пост B", slug: "post-b" },
      },
    ]);

    expect(text).toContain("📌 «Пост A»");
    expect(text).toContain("Аня");
    expect(text).toContain("Борис");
    expect(text).toContain("📌 «Пост B»");
    expect(text).toContain("Вера");
  });
});

describe("formatInstantCommentTelegram", () => {
  it("includes post title block", () => {
    const text = formatInstantCommentTelegram({
      authorName: "User",
      content: "Hello",
      post: { title: "Тест", slug: "test-slug" },
    });
    expect(text).toContain("📌 «Тест»");
    expect(text).toContain("User:");
  });
});
