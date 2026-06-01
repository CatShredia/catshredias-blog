import { PostTrackType } from "@prisma/client";

import { SafeImage } from "@/components/ui/safe-image";

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
    const coverAlt =
      trackTitle && trackArtist
        ? `${trackTitle} — ${trackArtist}`
        : trackTitle ?? "Обложка трека";

    return (
      <div className="post-track-player mb-6 rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {trackCoverImage ? (
            <div className="relative mx-auto h-36 w-36 shrink-0 overflow-hidden rounded-lg border border-border shadow-sm sm:mx-0">
              <SafeImage
                src={trackCoverImage}
                alt={coverAlt}
                fill
                sizes="144px"
                objectFit="cover"
              />
            </div>
          ) : (
            <div
              className="mx-auto flex h-36 w-36 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-4xl text-muted sm:mx-0"
              aria-hidden
            >
              ♪
            </div>
          )}
          <div className="min-w-0 flex-1">
            {trackTitle ? (
              <p className="text-lg font-semibold leading-tight">{trackTitle}</p>
            ) : null}
            {trackArtist ? (
              <p className="mt-1 text-sm text-muted">{trackArtist}</p>
            ) : null}
            <audio
              controls
              preload="metadata"
              src={trackAudioUrl}
              className="mt-4 w-full"
            >
              <a href={trackAudioUrl}>Скачать аудио</a>
            </audio>
          </div>
        </div>
      </div>
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
