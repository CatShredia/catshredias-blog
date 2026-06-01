import { describe, expect, it } from "vitest";

import { parseAudioMetadata } from "@/lib/audio-metadata";

describe("parseAudioMetadata", () => {
  it("returns empty object for invalid file", async () => {
    const file = new File(["not audio"], "test.txt", { type: "text/plain" });
    const meta = await parseAudioMetadata(file);
    expect(meta.title).toBeUndefined();
    expect(meta.artist).toBeUndefined();
  });
});
