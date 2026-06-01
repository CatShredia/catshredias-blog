import { describe, expect, it } from "vitest";

import {
  buildCommentTree,
  canReplyToDepth,
  getCommentDepth,
  MAX_COMMENT_DEPTH,
} from "@/lib/comments-tree";

describe("buildCommentTree", () => {
  it("builds nested replies", () => {
    const tree = buildCommentTree([
      {
        id: "1",
        parentId: null,
        authorUserId: null,
        authorName: "A",
        authorImage: null,
        content: "root",
        createdAt: new Date(),
      },
      {
        id: "2",
        parentId: "1",
        authorUserId: null,
        authorName: "B",
        authorImage: null,
        content: "child",
        createdAt: new Date(),
      },
      {
        id: "3",
        parentId: "2",
        authorUserId: null,
        authorName: "C",
        authorImage: null,
        content: "grandchild",
        createdAt: new Date(),
      },
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.replies[0]?.replies[0]?.content).toBe("grandchild");
  });
});

describe("getCommentDepth", () => {
  it("counts depth along parent chain", () => {
    const map = new Map([
      ["1", null],
      ["2", "1"],
      ["3", "2"],
    ]);
    expect(getCommentDepth("3", map)).toBe(3);
  });
});

describe("canReplyToDepth", () => {
  it("allows reply up to max depth", () => {
    expect(canReplyToDepth(MAX_COMMENT_DEPTH - 1)).toBe(true);
    expect(canReplyToDepth(MAX_COMMENT_DEPTH)).toBe(false);
  });
});
