"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { SafeImage } from "@/components/ui/safe-image";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function durationFromElement(audio: HTMLAudioElement) {
  const direct = audio.duration;
  if (Number.isFinite(direct) && direct > 0) return direct;

  if (audio.seekable.length > 0) {
    const end = audio.seekable.end(audio.seekable.length - 1);
    if (Number.isFinite(end) && end > 0) return end;
  }

  return 0;
}

type UploadedTrackPlayerProps = {
  src: string;
  title?: string | null;
  artist?: string | null;
  coverImage?: string | null;
};

export function UploadedTrackPlayer({
  src,
  title,
  artist,
  coverImage,
}: UploadedTrackPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const seekingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const syncDuration = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = durationFromElement(audio);
    if (next > 0) setDuration(next);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (seekingRef.current) return;
      setCurrent(audio.currentTime);
    };

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);

    const metaEvents = [
      "loadedmetadata",
      "durationchange",
      "loadeddata",
      "canplay",
    ] as const;

    for (const event of metaEvents) {
      audio.addEventListener(event, syncDuration);
    }
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    syncDuration();

    return () => {
      for (const event of metaEvents) {
        audio.removeEventListener(event, syncDuration);
      }
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src, syncDuration]);

  useEffect(() => {
    setCurrent(0);
    setDuration(0);
    setPlaying(false);
    seekingRef.current = false;
  }, [src]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }

  function applySeek(value: number) {
    const audio = audioRef.current;
    if (!audio || duration <= 0) return;

    const next = Math.min(Math.max(0, value), duration);
    seekingRef.current = true;
    setCurrent(next);

    try {
      audio.currentTime = next;
    } catch {
      seekingRef.current = false;
      return;
    }

    const release = () => {
      seekingRef.current = false;
      setCurrent(audio.currentTime);
    };

    audio.addEventListener("seeked", release, { once: true });
    window.setTimeout(release, 300);
  }

  const progressPercent =
    duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  const coverAlt =
    title && artist ? `${title} — ${artist}` : title ?? "Обложка трека";

  return (
    <div className="post-track-player mb-6 rounded-xl border border-border bg-card p-4 sm:p-5">
      <audio ref={audioRef} src={src} preload="metadata" className="sr-only" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {coverImage ? (
          <div className="relative mx-auto h-36 w-36 shrink-0 overflow-hidden rounded-lg border border-border shadow-sm sm:mx-0">
            <SafeImage
              src={coverImage}
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
          {title ? (
            <p className="text-lg font-semibold leading-tight">{title}</p>
          ) : null}
          {artist ? (
            <p className="mt-1 text-sm text-muted">{artist}</p>
          ) : null}

          <div className="mt-4 flex items-center gap-3 rounded-full border border-border bg-background px-3 py-2">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card hover:bg-background"
              aria-label={playing ? "Пауза" : "Воспроизведение"}
            >
              {playing ? (
                <span className="flex gap-0.5" aria-hidden>
                  <span className="block h-4 w-1 rounded-sm bg-foreground" />
                  <span className="block h-4 w-1 rounded-sm bg-foreground" />
                </span>
              ) : (
                <span
                  className="ml-0.5 block h-0 w-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-foreground"
                  aria-hidden
                />
              )}
            </button>

            <span className="w-10 shrink-0 tabular-nums text-xs text-muted">
              {formatTime(current)}
            </span>

            <input
              type="range"
              min={0}
              max={duration > 0 ? duration : 1}
              step={0.1}
              value={duration > 0 ? current : 0}
              disabled={duration <= 0}
              onPointerDown={() => {
                seekingRef.current = true;
              }}
              onInput={(event) => applySeek(Number(event.currentTarget.value))}
              onChange={(event) => applySeek(Number(event.currentTarget.value))}
              onPointerUp={() => {
                const audio = audioRef.current;
                seekingRef.current = false;
                if (audio) setCurrent(audio.currentTime);
              }}
              className="uploaded-track-seek min-w-0 flex-1"
              style={
                {
                  "--seek-progress": `${progressPercent}%`,
                } as React.CSSProperties
              }
              aria-label="Позиция воспроизведения"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={current}
            />

            <span className="hidden w-10 shrink-0 tabular-nums text-xs text-muted sm:inline">
              {duration > 0 ? formatTime(duration) : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
