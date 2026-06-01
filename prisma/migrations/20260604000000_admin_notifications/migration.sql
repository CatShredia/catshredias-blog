-- CreateEnum
CREATE TYPE "AdminNotificationType" AS ENUM ('CONTACT', 'REPORT', 'COMMENT_INSTANT', 'COMMENT_DIGEST');

-- CreateEnum
CREATE TYPE "NotifyMode" AS ENUM ('INSTANT', 'DAILY', 'WEEKLY', 'OFF');

-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN "readAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL,
    "type" "AdminNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "entityId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNotificationSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "contactMode" "NotifyMode" NOT NULL DEFAULT 'INSTANT',
    "reportMode" "NotifyMode" NOT NULL DEFAULT 'INSTANT',
    "commentMode" "NotifyMode" NOT NULL DEFAULT 'WEEKLY',
    "telegramEnabled" BOOLEAN NOT NULL DEFAULT false,
    "telegramChatId" TEXT,
    "telegramContact" BOOLEAN NOT NULL DEFAULT true,
    "telegramReport" BOOLEAN NOT NULL DEFAULT true,
    "telegramComments" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminNotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDigestState" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "lastDailyDigestAt" TIMESTAMP(3),
    "lastWeeklyDigestAt" TIMESTAMP(3),

    CONSTRAINT "NotificationDigestState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminNotification_readAt_createdAt_idx" ON "AdminNotification"("readAt", "createdAt");

-- CreateIndex
CREATE INDEX "AdminNotification_type_createdAt_idx" ON "AdminNotification"("type", "createdAt");

-- Seed default settings and digest state
INSERT INTO "AdminNotificationSettings" ("id", "updatedAt")
VALUES ('default', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "NotificationDigestState" ("id")
VALUES ('default')
ON CONFLICT ("id") DO NOTHING;
