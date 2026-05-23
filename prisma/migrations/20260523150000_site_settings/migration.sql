-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'site',
    "hhUrl" TEXT,
    "resumePdf" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SiteSettings" ("id", "hhUrl", "resumePdf", "updatedAt")
VALUES ('site', NULL, NULL, CURRENT_TIMESTAMP);
