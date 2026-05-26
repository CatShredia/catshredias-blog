import Link from "next/link";

import { SocialLinks } from "@/components/site/social-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { Container } from "@/components/ui/container";
import { siteProfile } from "@/data/mock/site";
import { legalRoutes } from "@/lib/legal";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border py-8">
      <Container className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteProfile.name}
          </p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <ThemeToggle showLabel />
            <SocialLinks />
          </div>
        </div>
        <nav
          aria-label="Юридические документы"
          className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-4 text-sm text-muted"
        >
          <Link
            href={legalRoutes.privacy}
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Политика конфиденциальности
          </Link>
          <Link
            href={legalRoutes.personalDataConsent}
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Согласие на обработку персональных данных
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
