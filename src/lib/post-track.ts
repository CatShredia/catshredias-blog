import { PostTrackType } from "@prisma/client";

const YANDEX_HOST = "music.yandex.ru";
const YOUTUBE_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "music.youtube.com",
  "www.youtube-nocookie.com",
  "youtu.be",
]);

const AUDIO_PATH_RE = /^\/api\/uploads\/[\w.-]+\.(mp3|mpeg|ogg|wav|webm|m4a|mp4)$/i;

export function isAllowedAudioUploadPath(path: string) {
  const trimmed = path.trim();
  return trimmed.startsWith("/") && AUDIO_PATH_RE.test(trimmed);
}

function extractSrcFromIframe(html: string) {
  const match = /src\s*=\s*["']([^"']+)["']/i.exec(html);
  return match?.[1]?.trim() ?? null;
}

function normalizeYandexEmbedSrc(raw: string): string {
  const candidate = extractSrcFromIframe(raw) ?? raw.trim();
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("Некорректная ссылка Яндекс Музыки");
  }

  if (url.protocol !== "https:" || url.hostname !== YANDEX_HOST) {
    throw new Error("Разрешён только embed с music.yandex.ru");
  }
  if (!url.pathname.startsWith("/iframe/")) {
    throw new Error("Ссылка должна вести на /iframe/… (код вставки трека)");
  }

  return url.origin + url.pathname;
}

function youtubeVideoIdFromPath(pathname: string): string | null {
  const embed = /^\/embed\/([\w-]{11})/.exec(pathname);
  if (embed) return embed[1];
  const shorts = /^\/shorts\/([\w-]{11})/.exec(pathname);
  if (shorts) return shorts[1];
  return null;
}

function normalizeYoutubeMusicEmbedSrc(raw: string): string {
  const candidate = extractSrcFromIframe(raw) ?? raw.trim();
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("Некорректная ссылка YouTube Music");
  }

  if (url.protocol !== "https:" || !YOUTUBE_HOSTS.has(url.hostname)) {
    throw new Error("Разрешены только ссылки youtube.com / music.youtube.com");
  }

  if (url.hostname === "youtu.be") {
    const id = url.pathname.replace(/^\//, "").split("/")[0];
    if (!id) throw new Error("Не удалось определить ID видео");
    return `https://www.youtube.com/embed/${id}`;
  }

  const fromPath = youtubeVideoIdFromPath(url.pathname);
  if (fromPath) {
    return `https://www.youtube.com/embed/${fromPath}`;
  }

  const watchId = url.searchParams.get("v");
  if (watchId) {
    return `https://www.youtube.com/embed/${watchId}`;
  }

  throw new Error(
    "Вставьте ссылку на трек или iframe (watch, youtu.be или /embed/…)",
  );
}

export function parseTrackEmbedInput(
  type: PostTrackType,
  raw?: string,
): string | null {
  const input = raw?.trim() ?? "";
  if (!input) return null;

  if (type === PostTrackType.YANDEX_MUSIC) {
    return normalizeYandexEmbedSrc(input);
  }
  if (type === PostTrackType.YOUTUBE_MUSIC) {
    return normalizeYoutubeMusicEmbedSrc(input);
  }

  return null;
}

const EMPTY_TRACK_META = {
  trackAudioUrl: null,
  trackTitle: null,
  trackArtist: null,
  trackCoverImage: null,
  trackEmbedSrc: null,
} as const;

export function resolvePostTrackPayload(data: {
  trackType: PostTrackType;
  trackAudioUrl?: string;
  trackTitle?: string;
  trackArtist?: string;
  trackCoverImage?: string;
  trackEmbedInput?: string;
}) {
  if (data.trackType === PostTrackType.NONE) {
    return {
      trackType: PostTrackType.NONE,
      ...EMPTY_TRACK_META,
    };
  }

  if (data.trackType === PostTrackType.UPLOAD) {
    const url = data.trackAudioUrl?.trim() ?? "";
    if (!url || !isAllowedAudioUploadPath(url)) {
      throw new Error("Загрузите аудиофайл на сервер (mp3, ogg, wav, webm, m4a)");
    }

    const title = data.trackTitle?.trim() ?? "";
    const artist = data.trackArtist?.trim() ?? "";
    if (!title) throw new Error("Укажите название трека");
    if (!artist) throw new Error("Укажите исполнителя");

    const cover = data.trackCoverImage?.trim() ?? "";
    if (cover && !isAllowedTrackCoverUrl(cover)) {
      throw new Error(
        "Обложка: /api/uploads/… или публичная ссылка https:// на изображение",
      );
    }

    return {
      trackType: PostTrackType.UPLOAD,
      trackAudioUrl: url,
      trackTitle: title,
      trackArtist: artist,
      trackCoverImage: cover || null,
      trackEmbedSrc: null,
    };
  }

  const embedSrc = parseTrackEmbedInput(data.trackType, data.trackEmbedInput);
  if (!embedSrc) {
    throw new Error("Укажите код вставки или ссылку на трек");
  }

  return {
    trackType: data.trackType,
    ...EMPTY_TRACK_META,
    trackEmbedSrc: embedSrc,
  };
}

const IMAGE_UPLOAD_PATH_RE =
  /^\/api\/uploads\/[\w.-]+\.(jpe?g|png|webp|gif)$/i;

/** Локальный upload или публичная HTTPS-ссылка на изображение. */
export function isAllowedTrackCoverUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;

  if (trimmed.startsWith("/") && IMAGE_UPLOAD_PATH_RE.test(trimmed)) {
    return true;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

/** @deprecated use isAllowedTrackCoverUrl */
export function isAllowedTrackCoverPath(path: string) {
  return isAllowedTrackCoverUrl(path);
}

export function trackEmbedInputFromStored(
  type: PostTrackType,
  embedSrc: string | null | undefined,
) {
  if (!embedSrc) return "";
  if (type === PostTrackType.YANDEX_MUSIC) {
    return `<iframe src="${embedSrc}"></iframe>`;
  }
  if (type === PostTrackType.YOUTUBE_MUSIC) {
    return embedSrc;
  }
  return "";
}
