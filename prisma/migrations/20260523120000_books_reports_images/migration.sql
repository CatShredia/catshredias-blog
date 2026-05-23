-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('PLANNED', 'READING', 'READ');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED');

-- AlterTable Post
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "coverImage" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "bookId" TEXT;

-- AlterTable Comment
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "adminSeenAt" TIMESTAMP(3);
ALTER TABLE "Comment" ALTER COLUMN "status" SET DEFAULT 'APPROVED';

-- CreateTable BookTag
CREATE TABLE IF NOT EXISTS "BookTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    CONSTRAINT "BookTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable Book
CREATE TABLE IF NOT EXISTS "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "author" TEXT,
    "description" TEXT,
    "coverImage" TEXT,
    "status" "BookStatus" NOT NULL DEFAULT 'PLANNED',
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable Report
CREATE TABLE IF NOT EXISTS "Report" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "reporterId" TEXT,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable _BookToBookTag
CREATE TABLE IF NOT EXISTS "_BookToBookTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_BookToBookTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Book_slug_key" ON "Book"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "BookTag_name_key" ON "BookTag"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "BookTag_slug_key" ON "BookTag"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Post_bookId_key" ON "Post"("bookId");
CREATE INDEX IF NOT EXISTS "_BookToBookTag_B_index" ON "_BookToBookTag"("B");

-- AddForeignKey
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Post_bookId_fkey') THEN
   ALTER TABLE "Post" ADD CONSTRAINT "Post_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;
 END IF;
END $$;

DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Report_commentId_fkey') THEN
   ALTER TABLE "Report" ADD CONSTRAINT "Report_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
 END IF;
END $$;

DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Report_reporterId_fkey') THEN
   ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
 END IF;
END $$;

DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_BookToBookTag_A_fkey') THEN
   ALTER TABLE "_BookToBookTag" ADD CONSTRAINT "_BookToBookTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
 END IF;
END $$;

DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_BookToBookTag_B_fkey') THEN
   ALTER TABLE "_BookToBookTag" ADD CONSTRAINT "_BookToBookTag_B_fkey" FOREIGN KEY ("B") REFERENCES "BookTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
 END IF;
END $$;
