import { siteProfile } from "@/data/mock/site";
import { siteUrl } from "@/lib/seo";

/** Данные оператора для юридических страниц (152-ФЗ). */
export const legalOperator = {
  fullName: siteProfile.name,
  email: siteProfile.social.email,
  siteHost: "catshredia.ru",
  siteUrl,
} as const;

export const legalRoutes = {
  privacy: "/privacy",
  personalDataConsent: "/personal-data-consent",
} as const;
