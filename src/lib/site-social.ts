import { siteProfile } from "@/data/mock/site";

export type SocialLink = {
  label: string;
  href: string;
  external: boolean;
};

export function getSocialLinks(): SocialLink[] {
  const { social } = siteProfile;

  return [
    { label: "GitHub", href: social.github, external: true },
    { label: "Telegram", href: social.telegram, external: true },
    { label: "MAX", href: social.max, external: true },
    {
      label: social.email,
      href: `mailto:${social.email}`,
      external: false,
    },
    { label: "hh.ru", href: social.hh, external: true },
  ];
}
