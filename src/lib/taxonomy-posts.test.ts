import { describe, expect, it } from "vitest";

import { nextRelationIds } from "@/lib/taxonomy-posts";

describe("nextRelationIds", () => {
  it("removes source relation", () => {
    expect(nextRelationIds(["a", "b", "c"], "b", null, "remove")).toEqual([
      "a",
      "c",
    ]);
  });

  it("replaces source with target", () => {
    expect(nextRelationIds(["a", "b"], "b", "c", "replace")).toEqual(["a", "c"]);
  });

  it("adds target without removing source", () => {
    expect(nextRelationIds(["a", "b"], "b", "c", "add")).toEqual(["a", "b", "c"]);
  });
});
