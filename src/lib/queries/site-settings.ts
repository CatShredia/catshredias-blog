import { prisma } from "@/lib/prisma";

const SITE_SETTINGS_ID = "site";

export async function getSiteSettings() {
  return prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: { id: SITE_SETTINGS_ID },
    update: {},
  });
}

export async function updateSiteSettings(data: {
  hhUrl: string | null;
  resumePdf: string | null;
  lookingForWork: boolean;
}) {
  return prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: { id: SITE_SETTINGS_ID, ...data },
    update: data,
  });
}
