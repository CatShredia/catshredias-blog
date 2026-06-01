import { PostTrackType } from "@prisma/client";

import { UploadedTrackPlayer } from "@/components/blog/uploaded-track-player";

type PostTrackPlayerProps = {
  trackType: PostTrackType;
  trackAudioUrl: string | null;
  trackTitle: string | null;
  trackArtist: string | null;
  trackCoverImage: string | null;
  trackEmbedSrc: string | null;
};

export function PostTrackPlayer({
  trackType,
  trackAudioUrl,
  trackTitle,
  trackArtist,
  trackCoverImage,
  trackEmbedSrc,
}: PostTrackPlayerProps) {
  if (trackType === PostTrackType.NONE) return null;

  if (trackType === PostTrackType.UPLOAD && trackAudioUrl) {
    return (
      <UploadedTrackPlayer
        src={trackAudioUrl}
        title={trackTitle}
        artist={trackArtist}
        coverImage={trackCoverImage}
      />
    );
  }

  if (
    (trackType === PostTrackType.YANDEX_MUSIC ||
      trackType === PostTrackType.YOUTUBE_MUSIC) &&
    trackEmbedSrc
  ) {
    const isYandex = trackType === PostTrackType.YANDEX_MUSIC;
    return (
      <div className="post-track-player mb-6">
        <div
          className={
            isYandex
              ? "post-track-embed-yandex overflow-hidden rounded-xl border border-border bg-card"
              : "post-track-embed-youtube overflow-hidden rounded-xl border border-border bg-card"
          }
        >
          <iframe
            src={trackEmbedSrc}
            title="Плеер трека"
            loading="lazy"
            allow="clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            className="block w-full border-0"
            style={
              isYandex
                ? { minHeight: 244, maxWidth: "100%" }
                : { aspectRatio: "16 / 9", minHeight: 200 }
            }
          />
        </div>
      </div>
    );
  }

  return null;
}
