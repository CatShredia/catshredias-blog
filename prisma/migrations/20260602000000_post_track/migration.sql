-- CreateEnum
CREATE TYPE "PostTrackType" AS ENUM ('NONE', 'UPLOAD', 'YANDEX_MUSIC', 'YOUTUBE_MUSIC');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN "trackType" "PostTrackType" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Post" ADD COLUMN "trackAudioUrl" TEXT;
ALTER TABLE "Post" ADD COLUMN "trackEmbedSrc" TEXT;
