import { SocialLinks } from "@/components/site/social-links";
import { Container } from "@/components/ui/container";
import { siteProfile } from "@/data/mock/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border py-8">
      <Container className="flex flex-col gap-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {siteProfile.name}
        </p>
        <SocialLinks />
      </Container>
    </footer>
  );
}
