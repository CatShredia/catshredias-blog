import { PostStatus, PostTrackType } from "@prisma/client";
import { useCallback, useRef, useSyncExternalStore } from "react";

import { trackEmbedInputFromStored } from "@/lib/post-track";

export type PostFormTrackDraft = {
  trackType: PostTrackType;
  audioUrl: string;
  trackTitle: string;
  trackArtist: string;
  coverImage: string;
  embedInput: string;
};

export type PostFormDraft = {
  title: string;
  slug: string;
  slugTouched: boolean;
  excerpt: string;
  coverImage: string;
  status: PostStatus;
  publishedAt: string;
  categories: string;
  tags: string;
  track: PostFormTrackDraft;
};

const TRACK_DEFAULT: PostFormTrackDraft = {
  trackType: PostTrackType.NONE,
  audioUrl: "",
  trackTitle: "",
  trackArtist: "",
  coverImage: "",
  embedInput: "",
};

export function postFormDraftStorageKey(draftKey: string) {
  return `${draftKey}-meta`;
}

export function defaultPostFormDraft(
  partial?: Partial<PostFormDraft>,
): PostFormDraft {
  return {
    title: partial?.title ?? "",
    slug: partial?.slug ?? "",
    slugTouched: partial?.slugTouched ?? false,
    excerpt: partial?.excerpt ?? "",
    coverImage: partial?.coverImage ?? "",
    status: partial?.status ?? PostStatus.DRAFT,
    publishedAt: partial?.publishedAt ?? "",
    categories: partial?.categories ?? "",
    tags: partial?.tags ?? "",
    track: { ...TRACK_DEFAULT, ...partial?.track },
  };
}

export function postFormDraftFromPost(post: {
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  trackType: PostTrackType;
  trackAudioUrl: string | null;
  trackTitle: string | null;
  trackArtist: string | null;
  trackCoverImage: string | null;
  trackEmbedSrc: string | null;
  status: PostStatus;
  publishedAt: Date | null;
  categories: { name: string }[];
  tags: { name: string }[];
}): PostFormDraft {
  return defaultPostFormDraft({
    title: post.title,
    slug: post.slug,
    slugTouched: true,
    excerpt: post.excerpt ?? "",
    coverImage: post.coverImage ?? "",
    status: post.status,
    publishedAt: post.publishedAt
      ? new Date(post.publishedAt).toISOString().slice(0, 16)
      : "",
    categories: post.categories.map((c) => c.name).join(", "),
    tags: post.tags.map((t) => t.name).join(", "),
    track: {
      trackType: post.trackType,
      audioUrl: post.trackAudioUrl ?? "",
      trackTitle: post.trackTitle ?? "",
      trackArtist: post.trackArtist ?? "",
      coverImage: post.trackCoverImage ?? "",
      embedInput: trackEmbedInputFromStored(post.trackType, post.trackEmbedSrc),
    },
  });
}

export function readPostFormDraft(
  storageKey: string,
  fallback: PostFormDraft,
): PostFormDraft {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PostFormDraft>;
    return defaultPostFormDraft({
      ...fallback,
      ...parsed,
      track: { ...fallback.track, ...parsed.track },
    });
  } catch {
    return fallback;
  }
}

export function writePostFormDraft(storageKey: string, draft: PostFormDraft) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify(draft));
}

export function clearPostFormDraft(storageKey: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey);
}

const draftListeners = new Set<() => void>();

function subscribeDraftListeners(callback: () => void) {
  draftListeners.add(callback);
  return () => {
    draftListeners.delete(callback);
  };
}

function notifyDraftListeners() {
  draftListeners.forEach((listener) => listener());
}

function mergeDraftUpdate(
  current: PostFormDraft,
  update: Partial<PostFormDraft>,
): PostFormDraft {
  return {
    ...current,
    ...update,
    ...(update.track ? { track: { ...current.track, ...update.track } } : {}),
  };
}

/** Черновик формы поста с гидрацией из localStorage без setState в useEffect. */
export function usePostFormDraft(
  storageKey: string,
  serverFallback: PostFormDraft,
  options?: { syncFromServer?: boolean },
) {
  const syncFromServer = options?.syncFromServer ?? false;
  const didSyncClearRef = useRef(false);

  const getSnapshot = useCallback(() => {
    if (syncFromServer && typeof window !== "undefined") {
      if (!didSyncClearRef.current) {
        didSyncClearRef.current = true;
        clearPostFormDraft(storageKey);
      }
      return serverFallback;
    }
    return readPostFormDraft(storageKey, serverFallback);
  }, [storageKey, serverFallback, syncFromServer]);

  const draft = useSyncExternalStore(
    subscribeDraftListeners,
    getSnapshot,
    () => serverFallback,
  );

  const setDraft = useCallback(
    (update: Partial<PostFormDraft> | ((prev: PostFormDraft) => PostFormDraft)) => {
      const current = readPostFormDraft(storageKey, serverFallback);
      const next =
        typeof update === "function"
          ? update(current)
          : mergeDraftUpdate(current, update);
      writePostFormDraft(storageKey, next);
      notifyDraftListeners();
    },
    [storageKey, serverFallback],
  );

  return { draft, setDraft };
}
