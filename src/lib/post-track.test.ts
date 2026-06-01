import { PostTrackType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  isAllowedAudioUploadPath,
  isAllowedTrackCoverUrl,
  parseTrackEmbedInput,
  resolvePostTrackPayload,
} from "@/lib/post-track";

describe("parseTrackEmbedInput", () => {
  it("parses yandex iframe", () => {
    const html = `<iframe src="https://music.yandex.ru/iframe/album/262181/track/2569285"></iframe>`;
    expect(parseTrackEmbedInput(PostTrackType.YANDEX_MUSIC, html)).toBe(
      "https://music.yandex.ru/iframe/album/262181/track/2569285",
    );
  });

  it("parses youtube watch url", () => {
    expect(
      parseTrackEmbedInput(
        PostTrackType.YOUTUBE_MUSIC,
        "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
      ),
    ).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("parses youtube embed url", () => {
    expect(
      parseTrackEmbedInput(
        PostTrackType.YOUTUBE_MUSIC,
        "https://www.youtube.com/embed/abc12345678",
      ),
    ).toBe("https://www.youtube.com/embed/abc12345678");
  });
});

describe("resolvePostTrackPayload", () => {
  it("clears track when none", () => {
    expect(
      resolvePostTrackPayload({ trackType: PostTrackType.NONE }),
    ).toEqual({
      trackType: PostTrackType.NONE,
      trackAudioUrl: null,
      trackTitle: null,
      trackArtist: null,
      trackCoverImage: null,
      trackEmbedSrc: null,
    });
  });

  it("requires upload path", () => {
    expect(() =>
      resolvePostTrackPayload({
        trackType: PostTrackType.UPLOAD,
        trackAudioUrl: "https://evil.com/x.mp3",
      }),
    ).toThrow();
  });

  it("requires title and artist for upload", () => {
    expect(() =>
      resolvePostTrackPayload({
        trackType: PostTrackType.UPLOAD,
        trackAudioUrl: "/api/uploads/song.mp3",
      }),
    ).toThrow("название");
  });

  it("accepts upload with metadata", () => {
    expect(
      resolvePostTrackPayload({
        trackType: PostTrackType.UPLOAD,
        trackAudioUrl: "/api/uploads/song.mp3",
        trackTitle: "I Choke",
        trackArtist: "Ektomorf",
        trackCoverImage: "/api/uploads/cover.jpg",
      }),
    ).toMatchObject({
      trackType: PostTrackType.UPLOAD,
      trackAudioUrl: "/api/uploads/song.mp3",
      trackTitle: "I Choke",
      trackArtist: "Ektomorf",
      trackCoverImage: "/api/uploads/cover.jpg",
    });
  });

  it("accepts public https cover url", () => {
    expect(
      resolvePostTrackPayload({
        trackType: PostTrackType.UPLOAD,
        trackAudioUrl: "/api/uploads/song.mp3",
        trackTitle: "Track",
        trackArtist: "Artist",
        trackCoverImage: "https://example.com/cover.jpg",
      }),
    ).toMatchObject({
      trackCoverImage: "https://example.com/cover.jpg",
    });
  });
});

describe("isAllowedAudioUploadPath", () => {
  it("allows local upload paths", () => {
    expect(isAllowedAudioUploadPath("/api/uploads/track.mp3")).toBe(true);
    expect(isAllowedAudioUploadPath("/api/uploads/../x.mp3")).toBe(false);
  });
});

describe("isAllowedTrackCoverUrl", () => {
  it("allows upload path and https url", () => {
    expect(isAllowedTrackCoverUrl("/api/uploads/cover.jpg")).toBe(true);
    expect(isAllowedTrackCoverUrl("https://cdn.example.com/album.png")).toBe(
      true,
    );
    expect(isAllowedTrackCoverUrl("http://insecure.jpg")).toBe(false);
  });
});
