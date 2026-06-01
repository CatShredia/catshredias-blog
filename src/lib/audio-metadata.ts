import { parseBlob } from "music-metadata";

export type ParsedAudioMetadata = {
  title?: string;
  artist?: string;
  coverFile?: File;
};

function artistFromTags(
  artist?: string,
  artists?: string[],
  albumartist?: string,
): string | undefined {
  if (artist?.trim()) return artist.trim();
  if (artists?.length) return artists.map((a) => a.trim()).filter(Boolean).join(", ");
  if (albumartist?.trim()) return albumartist.trim();
  return undefined;
}

function coverFileFromPicture(
  picture: { data: Uint8Array | Buffer; format: string } | undefined,
): File | undefined {
  if (!picture?.data?.length) return undefined;

  const mime = picture.format?.includes("/")
    ? picture.format
    : `image/${picture.format === "jpg" ? "jpeg" : picture.format || "jpeg"}`;
  const ext =
    mime.includes("png") ? ".png" : mime.includes("webp") ? ".webp" : ".jpg";
  // Копия в новый Uint8Array — иначе TS ругается на ArrayBufferLike в production build.
  const bytes = Uint8Array.from(picture.data);
  const blob = new Blob([bytes], { type: mime });

  return new File([blob], `cover${ext}`, { type: mime });
}

/** Читает название, исполнителя и обложку из тегов аудиофайла (MP3, M4A, …). */
export async function parseAudioMetadata(file: File): Promise<ParsedAudioMetadata> {
  try {
    const metadata = await parseBlob(file);
    const { common } = metadata;

    const title = common.title?.trim() || undefined;
    const artist = artistFromTags(
      common.artist,
      common.artists,
      common.albumartist,
    );
    const coverFile = coverFileFromPicture(common.picture?.[0]);

    return { title, artist, coverFile };
  } catch {
    return {};
  }
}
