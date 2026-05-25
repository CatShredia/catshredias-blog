import { describe, expect, it } from "vitest";

import {
  DELETED_USER_DISPLAY_NAME,
  mapCommentAuthor,
} from "@/lib/deleted-user";

describe("mapCommentAuthor", () => {
  it("masks deleted users", () => {
    const result = mapCommentAuthor(
      {
        deletedAt: new Date(),
        name: "Иван",
        image: "/avatar.jpg",
      },
      "Иван",
    );

    expect(result.authorName).toBe(DELETED_USER_DISPLAY_NAME);
    expect(result.authorImage).toBeNull();
  });

  it("keeps active users", () => {
    const result = mapCommentAuthor(
      {
        deletedAt: null,
        name: "Иван",
        image: "/avatar.jpg",
      },
      "fallback",
    );

    expect(result.authorName).toBe("Иван");
    expect(result.authorImage).toBe("/avatar.jpg");
  });
});
